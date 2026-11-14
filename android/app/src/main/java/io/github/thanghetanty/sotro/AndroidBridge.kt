package io.github.thanghetanty.sotro

import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import java.io.File

/**
 * Các hàm mà trang web gọi được qua window.SoTroAndroid (xem phần "app Android" cuối src/app.js).
 * Hàm @JavascriptInterface chạy trên luồng riêng của WebView, việc giao diện phải chuyển về luồng chính.
 */
class AndroidBridge(private val activity: MainActivity) {

    /** Lưu tệp (Excel, ảnh hóa đơn, Word, sao lưu) vào Tải xuống/SoTro, rồi cho mở hoặc chia sẻ (Zalo, Messenger…). */
    @JavascriptInterface
    fun saveFile(filename: String, mime: String, base64: String) {
        val name = safeName(filename)
        val type = mime.takeIf { it.isNotBlank() && it != "application/octet-stream" } ?: guessMime(name)
        val bytes = try {
            Base64.decode(base64, Base64.DEFAULT)
        } catch (e: IllegalArgumentException) {
            activity.runOnUiThread { activity.toast("Tệp bị lỗi, không lưu được") }
            return
        }

        // Bản trong bộ nhớ đệm của app để mở và chia sẻ.
        val shared = File(File(activity.cacheDir, "shared").apply { mkdirs() }, name)
        shared.writeBytes(bytes)
        val shareUri = FileProvider.getUriForFile(activity, "${activity.packageName}.files", shared)

        // Bản lưu lâu dài trong thư mục Tải xuống (Android 10 trở lên không cần xin quyền).
        val savedInDownloads = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && saveToDownloads(name, type, bytes)

        activity.runOnUiThread {
            if (activity.isFinishing || activity.isDestroyed) return@runOnUiThread
            AlertDialog.Builder(activity)
                .setTitle(if (savedInDownloads) "Đã lưu tệp" else "Đã tạo tệp")
                .setMessage(
                    if (savedInDownloads) "$name\n\nTrong thư mục Tải xuống › SoTro."
                    else "$name\n\nBấm Chia sẻ để gửi qua Zalo hoặc lưu vào Drive, Tệp."
                )
                .setPositiveButton("Chia sẻ") { _, _ -> share(shareUri, type) }
                .setNeutralButton("Mở") { _, _ -> open(shareUri, type) }
                .setNegativeButton("Đóng", null)
                .show()
        }
    }

    @JavascriptInterface
    fun copyText(text: String) {
        activity.runOnUiThread {
            val cm = activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(ClipData.newPlainText("Sổ Trọ", text))
        }
    }

    private fun saveToDownloads(name: String, mime: String, bytes: ByteArray): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false
        val resolver = activity.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, name)
            put(MediaStore.Downloads.MIME_TYPE, mime)
            put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/SoTro")
            put(MediaStore.Downloads.IS_PENDING, 1)
        }
        return try {
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return false
            try {
                resolver.openOutputStream(uri)?.use { it.write(bytes) } ?: throw IllegalStateException()
                values.clear()
                values.put(MediaStore.Downloads.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
                true
            } catch (e: Exception) {
                resolver.delete(uri, null, null)
                false
            }
        } catch (e: Exception) {
            false
        }
    }

    private fun share(uri: Uri, mime: String) {
        val send = Intent(Intent.ACTION_SEND).apply {
            type = mime
            putExtra(Intent.EXTRA_STREAM, uri)
            clipData = ClipData.newRawUri("", uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        start(Intent.createChooser(send, "Gửi tệp"))
    }

    private fun open(uri: Uri, mime: String) {
        start(Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, mime)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        })
    }

    private fun start(intent: Intent) {
        try {
            activity.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            activity.toast("Không có ứng dụng nào mở được tệp này")
        }
    }

    private fun safeName(name: String): String {
        val cleaned = name.replace(Regex("""[\\/:*?"<>|\u0000-\u001f]"""), "_").trim().trimStart('.')
        return cleaned.ifEmpty { "tep-so-tro" }.take(120)
    }

    private fun guessMime(name: String): String {
        val ext = name.substringAfterLast('.', "").lowercase()
        return when (ext) {
            "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            "json" -> "application/json"
            "zip" -> "application/zip"
            "png" -> "image/png"
            "jpg", "jpeg" -> "image/jpeg"
            else -> MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext) ?: "application/octet-stream"
        }
    }
}
