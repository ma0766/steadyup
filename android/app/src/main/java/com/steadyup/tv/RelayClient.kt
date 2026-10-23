package com.steadyup.tv

import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit

// WebSocket client. Every connection says "hello" so the relay hands back a fresh code.
class RelayClient(
    private val url: String,
    private val onMessage: (ServerMsg) -> Unit,
    private val onLost: () -> Unit,
) {
    private val http = OkHttpClient.Builder().pingInterval(25, TimeUnit.SECONDS).build()
    private var socket: WebSocket? = null

    @Synchronized fun start() {
        socket?.cancel()
        socket = http.newWebSocket(Request.Builder().url(url).build(), object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                webSocket.send("""{"type":"hello","role":"tv"}""")
            }
            override fun onMessage(webSocket: WebSocket, text: String) = onMessage(ServerMsg.parse(text))
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.w(TAG, "socket failure: ${t.message}")
                if (webSocket === socket) onLost()
            }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                if (webSocket === socket) onLost()
            }
        })
    }

    fun send(text: String) { socket?.send(text) }
    fun close() { socket?.close(1000, null); socket = null }

    companion object { const val TAG = "SteadyUpPair" }
}
