package io.github.thanghetanty.sotro

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.ViewGroup
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import java.io.File
import kotlin.math.max

/**
 * Vỏ Android của Sổ Trọ: một WebView chạy đúng bản web (index.html) đóng gói trong app.
 * Dữ liệu lưu trong bộ nhớ của WebView (localStorage), giống bản chạy trên trình duyệt.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var offline: OfflineLibs
    lateinit var updater: AppUpdater

    private val assetLoader by lazy {
        WebViewAssetLoader.Builder()
            .setDomain(APP_HOST)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
    }

    // Chọn tệp (khôi phục sao lưu) và chụp ảnh đồng hồ cho thẻ <input type="file">.
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var cameraUri: Uri? = null
    // Ảnh chụp khi người dùng chọn "Máy ảnh" trong hộp chọn ảnh (không phải nút Chụp ảnh).
    private var chooserCameraFile: File? = null

    private val pickFile = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        val cb = fileCallback ?: return@registerForActivityResult
        fileCallback = null
        val camFile = chooserCameraFile
        chooserCameraFile = null
        val data = res.data
        val clip = data?.clipData
        val uris: Array<Uri>? = when {
            res.resultCode != RESULT_OK -> null
            // Chọn nhiều ảnh cùng lúc
            clip != null && clip.itemCount > 0 -> (0 until clip.itemCount).mapNotNull { clip.getItemAt(it).uri }.toTypedArray()
            data?.data != null -> arrayOf(data.data!!)
            camFile != null && camFile.length() > 0 -> arrayOf(FileProvider.getUriForFile(this, "$packageName.files", camFile))
            else -> null
        }
        cb.onReceiveValue(uris?.takeIf { it.isNotEmpty() })
    }

    private val takePicture = registerForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        val cb = fileCallback ?: return@registerForActivityResult
        fileCallback = null
        val uri = cameraUri
        cb.onReceiveValue(if (ok && uri != null) arrayOf(uri) else null)
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        offline = OfflineLibs(assets)
        updater = AppUpdater(this)
        WebView.setWebContentsDebuggingEnabled((applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0)

        webView = WebView(this).apply {
            setBackgroundColor(Color.TRANSPARENT)
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = false
                allowContentAccess = true
                // Giữ cỡ chữ như bản web trên iPhone, tránh vỡ bố cục khi máy đặt chữ to.
                textZoom = 100
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = true
            }
            addJavascriptInterface(AndroidBridge(this@MainActivity), "SoTroAndroid")
            webViewClient = AppWebViewClient()
            webChromeClient = AppChromeClient()
        }

        val root = FrameLayout(this)
        root.addView(webView, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        setContentView(root)

        // Chừa chỗ cho thanh trạng thái, thanh điều hướng và bàn phím.
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            v.setPadding(bars.left, bars.top, bars.right, max(bars.bottom, ime.bottom))
            WindowInsetsCompat.CONSUMED
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript("!!(window.sotroAndroid&&sotroAndroid.back())") { handled ->
                    if (handled != "true") {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(START_URL)
        }
        // Tự xem có bản mới trên GitHub (tối đa 12 giờ một lần), chờ app mở xong cho đỡ vướng.
        if (savedInstanceState == null) webView.postDelayed({ updater.check(manual = false) }, 4000)
    }

    /** Ghi ngay dữ liệu đang chờ của trang (trước khi vào nền hoặc cài bản cập nhật). */
    fun flushWeb() = webView.evaluateJavascript("window.sotroAndroid&&sotroAndroid.flush()", null)

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onPause() {
        // Ghi ngay dữ liệu đang chờ trước khi app vào nền.
        flushWeb()
        webView.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        updater.onResume()
    }

    override fun onDestroy() {
        fileCallback?.onReceiveValue(null)
        fileCallback = null
        webView.destroy()
        super.onDestroy()
    }

    fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    /** Mở liên kết ra ngoài app: Google Calendar, trình duyệt, gọi điện… */
    private fun openExternal(uri: Uri) {
        try {
            val intent = if (uri.scheme == "intent") {
                Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME).apply {
                    addCategory(Intent.CATEGORY_BROWSABLE)
                    component = null
                    selector = null
                }
            } else {
                Intent(Intent.ACTION_VIEW, uri)
            }
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            toast("Không có ứng dụng nào mở được liên kết này")
        } catch (e: Exception) {
            toast("Không mở được liên kết")
        }
    }

    private inner class AppWebViewClient : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
            offline.intercept(request) ?: assetLoader.shouldInterceptRequest(request.url)

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val uri = request.url
            if (uri.host == APP_HOST) return false
            if (uri.scheme == "blob" || uri.scheme == "data" || uri.scheme == "about") return true
            openExternal(uri)
            return true
        }
    }

    private inner class AppChromeClient : WebChromeClient() {
        override fun onShowFileChooser(
            view: WebView,
            callback: ValueCallback<Array<Uri>>,
            params: FileChooserParams,
        ): Boolean {
            fileCallback?.onReceiveValue(null)
            fileCallback = callback

            val accept = params.acceptTypes.flatMap { it.split(',') }.map { it.trim().lowercase() }.filter { it.isNotEmpty() }
            val imagesOnly = accept.isNotEmpty() && accept.all { it.startsWith("image/") }

            if (params.isCaptureEnabled && imagesOnly && launchCamera()) return true

            val pick = Intent(Intent.ACTION_GET_CONTENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = if (imagesOnly) "image/*" else "*/*"
                putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
            }
            // Với ảnh: hộp chọn có thêm Máy ảnh, giống cách iPhone cho chọn Chụp ảnh hoặc Thư viện ảnh.
            val intent = if (imagesOnly) {
                Intent.createChooser(pick, "Ảnh đồng hồ").apply {
                    cameraIntentForChooser()?.let { putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(it)) }
                }
            } else {
                pick
            }
            return try {
                pickFile.launch(intent)
                true
            } catch (e: ActivityNotFoundException) {
                fileCallback = null
                toast("Không có ứng dụng chọn tệp")
                false
            }
        }
    }

    private fun newCameraFile(): File {
        val dir = File(cacheDir, "camera").apply { mkdirs() }
        dir.listFiles()?.forEach { it.delete() }
        return File(dir, "dong-ho-${System.currentTimeMillis()}.jpg")
    }

    private fun cameraIntentForChooser(): Intent? = try {
        val file = newCameraFile()
        val uri = FileProvider.getUriForFile(this, "$packageName.files", file)
        chooserCameraFile = file
        Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
            putExtra(MediaStore.EXTRA_OUTPUT, uri)
            clipData = ClipData.newRawUri("", uri)
            addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
    } catch (e: Exception) {
        chooserCameraFile = null
        null
    }

    private fun launchCamera(): Boolean {
        return try {
            val file = newCameraFile()
            val uri = FileProvider.getUriForFile(this, "$packageName.files", file)
            cameraUri = uri
            takePicture.launch(uri)
            true
        } catch (e: Exception) {
            // Máy không có app máy ảnh: chuyển sang chọn ảnh có sẵn.
            false
        }
    }

    companion object {
        const val APP_HOST = "appassets.androidplatform.net"
        const val START_URL = "https://$APP_HOST/assets/index.html"
    }
}
