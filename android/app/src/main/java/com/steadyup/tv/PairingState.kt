package com.steadyup.tv

// Screen state is a pure function of server messages — a reducer, like Redux/Elm.
sealed class PairingState {
    object Connecting : PairingState()
    data class ShowCode(val code: String, val expiresInSec: Int) : PairingState()
    object Connected : PairingState()
    data class Problem(val sentence: String) : PairingState()
}

object PairingReducer {
    fun reduce(state: PairingState, msg: ServerMsg): PairingState = when (msg) {
        is ServerMsg.Code -> PairingState.ShowCode(msg.code, msg.expiresInSec)
        ServerMsg.Paired -> PairingState.Connected
        ServerMsg.PeerLeft -> if (state is PairingState.Connected) PairingState.Problem(Sentences.LOST) else state
        is ServerMsg.Error -> PairingState.Problem(msg.message)
        else -> state
    }

    fun connectionLost(state: PairingState): PairingState =
        if (state is PairingState.Connected) state else PairingState.Problem(Sentences.TRY_AGAIN)

    /** What the phone's QR opens: the phone page with the code filled in. */
    fun joinLink(webUrl: String, code: String) = "${webUrl.trimEnd('/')}/?code=$code"

    /** 123456 -> "123 456" so it is easy to read aloud. */
    fun spaced(code: String) = if (code.length == 6) "${code.substring(0, 3)} ${code.substring(3)}" else code
}
