import java.net.HttpURLConnection
import java.net.URI

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Thư mục gốc của kho (chứa index.html và src/), nằm ngay trên android/.
val repoDir: File = rootProject.projectDir.parentFile

// Số phiên bản tăng dần theo lần chạy GitHub Actions để Android cho cài đè bản mới.
val buildNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

// Khóa ký: dùng khóa riêng nếu có (biến môi trường, xem android/README.md), nếu không thì dùng khóa chung trong kho.
val keystorePath: String? = System.getenv("SOTRO_KEYSTORE")?.takeIf { it.isNotBlank() && file(it).exists() }

android {
    namespace = "io.github.thanghetanty.sotro"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.github.thanghetanty.sotro"
        minSdk = 26
        targetSdk = 35
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    signingConfigs {
        create("release") {
            if (keystorePath != null) {
                storeFile = file(keystorePath)
                storePassword = System.getenv("SOTRO_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("SOTRO_KEY_ALIAS")
                keyPassword = System.getenv("SOTRO_KEY_PASSWORD")
            } else {
                storeFile = rootProject.file("keystore/sotro-chung.jks")
                storePassword = "sotro-chung"
                keyAlias = "sotro"
                keyPassword = "sotro-chung"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
}

/**
 * Chép index.html (bản đã đóng gói bởi build.mjs) vào assets của app, đồng thời tải sẵn các thư viện
 * và phông chữ mà trang dùng (cdnjs, Google Fonts) để app mở được cả khi không có mạng.
 * Danh sách tệp tải sẵn ghi ở offline/index.tsv: url <tab> tệp trong assets <tab> kiểu MIME.
 */
abstract class PrepareWebAssets : DefaultTask() {
    @get:InputFile
    @get:PathSensitive(PathSensitivity.NONE)
    abstract val indexHtml: RegularFileProperty

    @get:InputFiles
    @get:PathSensitive(PathSensitivity.NONE)
    abstract val webSources: ConfigurableFileCollection

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    private val chromeUa =
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"

    private fun fetch(url: String): ByteArray {
        val c = URI(url).toURL().openConnection() as HttpURLConnection
        c.connectTimeout = 20_000
        c.readTimeout = 60_000
        c.setRequestProperty("User-Agent", chromeUa)
        try {
            if (c.responseCode != 200) throw GradleException("HTTP ${c.responseCode}")
            return c.inputStream.use { it.readBytes() }
        } finally {
            c.disconnect()
        }
    }

    private fun mimeOf(url: String): String {
        val path = url.substringBefore('?').lowercase()
        return when {
            url.startsWith("https://fonts.googleapis.com/") -> "text/css"
            path.endsWith(".js") -> "application/javascript"
            path.endsWith(".css") -> "text/css"
            path.endsWith(".woff2") -> "font/woff2"
            path.endsWith(".woff") -> "font/woff"
            path.endsWith(".ttf") -> "font/ttf"
            else -> "application/octet-stream"
        }
    }

    @TaskAction
    fun run() {
        val out = outputDir.get().asFile
        out.deleteRecursively()
        val offline = File(out, "offline").apply { mkdirs() }
        indexHtml.get().asFile.copyTo(File(out, "index.html"))

        val text = webSources.files.joinToString("\n") { it.readText() }
        val queue = ArrayDeque(
            Regex("""https://(?:cdnjs\.cloudflare\.com|fonts\.googleapis\.com)/[^\s'"`)<>\\]+""")
                .findAll(text).map { it.value.replace("&amp;", "&") }.distinct().toList()
        )
        val seen = HashSet<String>()
        val rows = StringBuilder()
        var n = 0
        while (queue.isNotEmpty()) {
            val url = queue.removeFirst()
            if (!seen.add(url)) continue
            val bytes = try {
                fetch(url)
            } catch (e: Exception) {
                logger.warn("Không tải sẵn được $url: ${e.message}. App sẽ tải khi có mạng.")
                continue
            }
            val mime = mimeOf(url)
            if (mime == "text/css") {
                // Phông chữ được khai báo trong CSS cũng tải sẵn.
                Regex("""url\((https://fonts\.gstatic\.com/[^)]+)\)""").findAll(String(bytes))
                    .forEach { queue.addLast(it.groupValues[1]) }
            }
            val ext = url.substringBefore('?').substringAfterLast('/').substringAfterLast('.', "bin").take(6)
            val name = "%03d.%s".format(n++, ext.ifEmpty { "bin" })
            File(offline, name).writeBytes(bytes)
            rows.append(url).append('\t').append("offline/").append(name).append('\t').append(mime).append('\n')
        }
        File(offline, "index.tsv").writeText(rows.toString())
        logger.lifecycle("Đã tải sẵn $n tệp cho chế độ không mạng.")
    }
}

val prepareWebAssets = tasks.register<PrepareWebAssets>("prepareWebAssets") {
    indexHtml.set(File(repoDir, "index.html"))
    webSources.from(File(repoDir, "src/app.js"), File(repoDir, "src/shell.html"))
}

androidComponents {
    onVariants { variant ->
        variant.sources.assets?.addGeneratedSourceDirectory(prepareWebAssets, PrepareWebAssets::outputDir)
    }
}
