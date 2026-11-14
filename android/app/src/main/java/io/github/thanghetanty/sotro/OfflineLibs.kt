package io.github.thanghetanty.sotro

import android.content.res.AssetManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse

/**
 * Trả về bản tải sẵn trong app cho các thư viện (three.js, SheetJS, JSZip, mã QR) và phông chữ,
 * để app chạy được cả khi không có mạng. Danh sách do Gradle tạo ở assets/offline/index.tsv.
 */
class OfflineLibs(private val assets: AssetManager) {

    private class Entry(val path: String, val mime: String)

    private val entries: Map<String, Entry> = try {
        assets.open("offline/index.tsv").bufferedReader().useLines { lines ->
            lines.mapNotNull { line ->
                val p = line.split('\t')
                if (p.size == 3) p[0] to Entry(p[1], p[2]) else null
            }.toMap()
        }
    } catch (e: Exception) {
        emptyMap()
    }

    fun intercept(request: WebResourceRequest): WebResourceResponse? {
        if (request.method != "GET") return null
        val e = entries[request.url.toString()] ?: return null
        return try {
            val charset = if (e.mime.startsWith("text/") || e.mime.endsWith("javascript")) "utf-8" else null
            WebResourceResponse(e.mime, charset, assets.open(e.path)).apply {
                responseHeaders = mapOf(
                    "Access-Control-Allow-Origin" to "*",
                    "Cache-Control" to "max-age=31536000",
                )
            }
        } catch (ex: Exception) {
            null
        }
    }
}
