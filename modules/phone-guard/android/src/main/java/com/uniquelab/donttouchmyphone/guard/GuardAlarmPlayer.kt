package com.uniquelab.donttouchmyphone.guard

import android.media.AudioAttributes
import android.media.MediaPlayer
import java.io.File

/** One-player owner used by guard preview or by GuardService. */
class GuardAlarmPlayer(private val onError: (String) -> Unit = {}) {
  private var player: MediaPlayer? = null

  @Synchronized
  fun play(path: String, looping: Boolean): Boolean {
    stop()
    if (!File(path).isFile) return false
    return runCatching {
      player = MediaPlayer().apply {
        setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build(),
        )
        setDataSource(path)
        isLooping = looping
        setOnCompletionListener { if (!looping) stop() }
        prepare()
        start()
      }
      true
    }.getOrElse {
      onError(it.message ?: "Audio playback error")
      stop()
      false
    }
  }

  @Synchronized
  fun stop() {
    val current = player
    player = null
    runCatching { current?.stop() }
    runCatching { current?.release() }
  }
}
