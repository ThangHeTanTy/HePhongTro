package io.github.thanghetanty.sotro

import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.content.FileProvider
import androidx.core.content.pm.PackageInfoCompat
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors

/**
 * Cập nhật app từ GitHub Releases, giống HeDeck: hỏi bản mới nhất, hiện ghi chú thay đổi,
 * tải APK ngay trong app (kiểm SHA-256), rồi mở trình cài đặt của Android.
 *
 * Android không cho app ngoài Play Store tự cài im lặng: người dùng bấm "Cài đặt" để xác nhận.
 * Cài đè giữ nguyên dữ liệu, miễn là APK mới ký cùng khóa với bản đang cài.
 *
 * Bản phát hành do .github/workflows/android.yml tạo trên nhánh main, thẻ dạng android-v1.0.N,
 * với N đúng bằng versionCode của APK.
 */
class AppUpdater(private val activity: MainActivity) {

    class Release(val code: Long, val name: String, val notes: String, val url: String, val size: Long, val sha256: String)

    private val io = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())
    private val prefs = activity.getSharedPreferences("updater", Context.MODE_PRIVATE)
    private var checking = false
    private var cancelled = false
    private var pendingApk: File? = null

    private val info get() = activity.packageManager.getPackageInfo(activity.packageName, 0)
    val currentCode: Long get() = PackageInfoCompat.getLongVersionCode(info)
    val currentName: String get() = info.versionName ?: currentCode.toString()

    /** Bản debug (tự build trên máy) có tên gói khác, không cập nhật từ GitHub. */
    private val isDebug get() = (activity.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0

    /**
     * manual=true khi người dùng bấm "Kiểm tra cập nhật": báo cả khi đã là bản mới nhất hoặc mất mạng.
     * Tự kiểm tra lúc mở app thì tối đa 12 giờ một lần và im lặng nếu không có gì.
     */
    fun check(manual: Boolean) {
        if (checking) return
        if (isDebug) {
            if (manual) activity.toast("Bản tự build không cập nhật từ GitHub")
            return
        }
        val now = System.currentTimeMillis()
        if (!manual && now - prefs.getLong("lastCheck", 0) < 12 * 3600_000L) return
        checking = true
        if (manual) activity.toast("Đang kiểm tra bản mới…")
        io.execute {
            val result = runCatching { fetchLatest() }
            main.post {
                checking = false
                if (activity.isFinishing || activity.isDestroyed) return@post
                result.onSuccess { rel ->
                    prefs.edit().putLong("lastCheck", now).apply()
                    when {
                        rel != null && rel.code > currentCode -> showAvailable(rel)
                        manual -> activity.toast("Bạn đang dùng bản mới nhất ($currentName)")
                    }
                }.onFailure {
                    if (manual) activity.toast("Không kiểm tra được bản mới. Kiểm tra kết nối mạng.")
                }
            }
        }
    }

    /** Gọi trong onResume: nếu người dùng vừa bật quyền cài ứng dụng thì cài tiếp. */
    fun onResume() {
        val apk = pendingApk ?: return
        if (canInstall()) {
            pendingApk = null
            install(apk)
        }
    }

    private fun fetchLatest(): Release? {
        val c = URL("https://api.github.com/repos/$REPO/releases/latest").openConnection() as HttpURLConnection
        c.connectTimeout = 10_000
        c.readTimeout = 15_000
        c.setRequestProperty("Accept", "application/vnd.github+json")
        c.setRequestProperty("User-Agent", "SoTro-Android")
        try {
            if (c.responseCode == 404) return null // chưa có bản phát hành nào
            if (c.responseCode != 200) throw IllegalStateException("GitHub ${c.responseCode}")
            val j = JSONObject(c.inputStream.bufferedReader().use { it.readText() })
            val tag = j.optString("tag_name")
            val code = Regex("""^android-v\d+\.\d+\.(\d+)$""").find(tag)?.groupValues?.get(1)?.toLongOrNull() ?: return null
            val assets = j.optJSONArray("assets") ?: return null
            for (i in 0 until assets.length()) {
                val a = assets.getJSONObject(i)
                if (!a.optString("name").lowercase().endsWith(".apk")) continue
                return Release(
                    code = code,
                    name = tag.removePrefix("android-v"),
                    // Phần dưới dòng --- là hướng dẫn cài lần đầu, không phải danh sách thay đổi.
                    notes = j.optString("body").substringBefore("\n---").trim(),
                    url = a.optString("browser_download_url"),
                    size = a.optLong("size"),
                    sha256 = a.optString("digest").removePrefix("sha256:").lowercase(),
                )
            }
            return null
        } finally {
            c.disconnect()
        }
    }

    private fun showAvailable(rel: Release) {
        val notes = rel.notes.lines().map { it.trim() }.filter { it.isNotEmpty() }.take(12)
            .joinToString("\n") { if (it.startsWith("- ") || it.startsWith("* ")) "• " + it.drop(2) else it }
        val size = if (rel.size > 0) " (%.1f MB)".format(rel.size / 1_048_576.0) else ""
        AlertDialog.Builder(activity)
            .setTitle("Có bản mới ${rel.name}")
            .setMessage(
                "Bạn đang dùng bản $currentName.\n\n" +
                    (if (notes.isNotEmpty()) "$notes\n\n" else "") +
                    "Cập nhật giữ nguyên toàn bộ dữ liệu của bạn."
            )
            .setPositiveButton("Cập nhật$size") { _, _ -> download(rel) }
            .setNegativeButton("Để sau", null)
            .show()
    }

    private fun download(rel: Release) {
        cancelled = false
        val bar = ProgressBar(activity, null, android.R.attr.progressBarStyleHorizontal).apply { max = 100; isIndeterminate = rel.size <= 0 }
        val text = TextView(activity).apply { text = "Đang tải…"; setPadding(0, 16, 0, 0) }
        val box = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            val p = (20 * resources.displayMetrics.density).toInt()
            setPadding(p, p / 2, p, 0)
            addView(bar)
            addView(text)
        }
        val dialog = AlertDialog.Builder(activity)
            .setTitle("Đang tải bản ${rel.name}")
            .setView(box)
            .setCancelable(false)
            .setNegativeButton("Hủy") { _, _ -> cancelled = true }
            .show()

        io.execute {
            val result = runCatching {
                val dir = File(activity.cacheDir, "update").apply { mkdirs() }
                dir.listFiles()?.forEach { it.delete() } // chỉ giữ bản sắp tải
                val file = File(dir, "SoTro-${rel.name}.apk")
                val c = URL(rel.url).openConnection() as HttpURLConnection
                c.connectTimeout = 15_000
                c.readTimeout = 30_000
                c.setRequestProperty("User-Agent", "SoTro-Android")
                try {
                    if (c.responseCode != 200) throw IllegalStateException("GitHub ${c.responseCode}")
                    val total = if (c.contentLengthLong > 0) c.contentLengthLong else rel.size
                    val md = MessageDigest.getInstance("SHA-256")
                    var done = 0L
                    var lastPct = -1
                    c.inputStream.use { input ->
                        file.outputStream().use { out ->
                            val buf = ByteArray(64 * 1024)
                            while (true) {
                                if (cancelled) throw InterruptedException()
                                val n = input.read(buf)
                                if (n < 0) break
                                out.write(buf, 0, n)
                                md.update(buf, 0, n)
                                done += n
                                val pct = if (total > 0) (done * 100 / total).toInt() else -1
                                if (pct != lastPct) {
                                    lastPct = pct
                                    val mb = "%.1f".format(done / 1_048_576.0)
                                    main.post {
                                        if (pct >= 0) bar.progress = pct
                                        text.text = if (pct >= 0) "$pct% · $mb MB" else "$mb MB"
                                    }
                                }
                            }
                        }
                    }
                    val got = md.digest().joinToString("") { "%02x".format(it) }
                    if (rel.sha256.isNotEmpty() && got != rel.sha256) {
                        file.delete()
                        throw SecurityException("sha256")
                    }
                    file
                } finally {
                    c.disconnect()
                }
            }
            main.post {
                runCatching { dialog.dismiss() }
                if (activity.isFinishing || activity.isDestroyed) return@post
                result.onSuccess { install(it) }.onFailure {
                    when (it) {
                        is InterruptedException -> activity.toast("Đã hủy tải bản mới")
                        is SecurityException -> activity.toast("Tệp tải về bị hỏng, hãy thử lại")
                        else -> activity.toast("Tải bản mới thất bại. Kiểm tra mạng rồi thử lại.")
                    }
                }
            }
        }
    }

    private fun canInstall() = Build.VERSION.SDK_INT < Build.VERSION_CODES.O || activity.packageManager.canRequestPackageInstalls()

    private fun install(apk: File) {
        if (!canInstall()) {
            // Lần đầu: Android cần bật "Cho phép từ nguồn này" cho Sổ Trọ. Bật xong quay lại là cài tiếp (onResume).
            pendingApk = apk
            AlertDialog.Builder(activity)
                .setTitle("Cho phép Sổ Trọ cài bản cập nhật")
                .setMessage("Android cần bạn bật “Cho phép từ nguồn này” cho Sổ Trọ, chỉ một lần. Bật xong bấm nút quay lại, app sẽ cài tiếp.")
                .setPositiveButton("Mở cài đặt") { _, _ ->
                    try {
                        activity.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${activity.packageName}")))
                    } catch (e: ActivityNotFoundException) {
                        activity.toast("Không mở được cài đặt. Hãy bật quyền cài ứng dụng cho Sổ Trọ trong Cài đặt.")
                    }
                }
                .setNegativeButton("Để sau") { _, _ -> pendingApk = null }
                .show()
            return
        }
        activity.flushWeb() // ghi ngay dữ liệu đang chờ trước khi app bị thay
        try {
            val uri = FileProvider.getUriForFile(activity, "${activity.packageName}.files", apk)
            activity.startActivity(
                Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (e: Exception) {
            activity.toast("Không mở được trình cài đặt: ${e.message}")
        }
    }

    companion object {
        const val REPO = "ThangHeTanTy/HePhongTro"
    }
}
