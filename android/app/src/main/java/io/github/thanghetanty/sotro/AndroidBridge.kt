package io.github.thanghetanty.sotro

import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.ContentUris
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

    /** Phiên bản app, hiện trong Thiết lập. */
    @JavascriptInterface
    fun appVersion(): String = activity.updater.currentName

    /** Nút "Kiểm tra cập nhật" trong Thiết lập. */
    @JavascriptInterface
    fun checkUpdate() {
        activity.runOnUiThread { activity.updater.check(manual = true) }
    }

    @JavascriptInterface
    fun copyText(text: String) {
        activity.runOnUiThread {
            val cm = activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(ClipData.newPlainText("Sổ Trọ", text))
        }
    }

    /**
     * Bản tự sao lưu hằng ngày (trang web gọi khi chưa lưu hôm nay). Ghi im lặng vào
     * Tải xuống/SoTro/SaoLuuTuDong, tệp ở đó còn lại sau khi gỡ app. Chỉ giữ [KEEP_AUTO] bản mới nhất.
     * Trả về false trên Android 9 trở xuống (cần quyền bộ nhớ, app không xin).
     */
    @JavascriptInterface
    fun autoBackup(filename: String, base64: String): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false
        val bytes = try { Base64.decode(base64, Base64.DEFAULT) } catch (e: IllegalArgumentException) { return false }
        val ok = saveToDownloads(safeName(filename), "application/zip", bytes, AUTO_DIR)
        if (ok) pruneAuto()
        return ok
    }

    private fun pruneAuto() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return
        try {
            val coll = MediaStore.Downloads.EXTERNAL_CONTENT_URI
            val resolver = activity.contentResolver
            // Chỉ thấy và xóa được tệp do chính bản cài này tạo; tệp của bản cài trước vẫn giữ nguyên.
            resolver.query(
                coll, arrayOf(MediaStore.Downloads._ID),
                "${MediaStore.Downloads.RELATIVE_PATH}=? AND ${MediaStore.Downloads.DISPLAY_NAME} LIKE ?",
                arrayOf(AUTO_DIR + "/", "SoTro_tudong_%"),
                "${MediaStore.Downloads.DATE_ADDED} DESC",
            )?.use { c ->
                var i = 0
                while (c.moveToNext()) {
                    if (i++ < KEEP_AUTO) continue
                    resolver.delete(ContentUris.withAppendedId(coll, c.getLong(0)), null, null)
                }
            }
        } catch (e: Exception) {
            // Không dọn được thì thôi, lần sau thử lại.
        }
    }

    private fun saveToDownloads(name: String, mime: String, bytes: ByteArray, relDir: String = Environment.DIRECTORY_DOWNLOADS + "/SoTro"): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false
        val resolver = activity.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, name)
            put(MediaStore.Downloads.MIME_TYPE, mime)
            put(MediaStore.Downloads.RELATIVE_PATH, relDir)
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

    companion object {
        val AUTO_DIR = Environment.DIRECTORY_DOWNLOADS + "/SoTro/SaoLuuTuDong"
        const val KEEP_AUTO = 5
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
