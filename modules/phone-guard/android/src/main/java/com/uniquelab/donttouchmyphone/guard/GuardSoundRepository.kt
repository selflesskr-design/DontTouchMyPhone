package com.uniquelab.donttouchmyphone.guard

import android.content.Context
import java.io.File

/** Storage dedicated to the phone-guard alarm sound and settings. */
class GuardSoundRepository(private val context: Context) {
  private val preferences = context.getSharedPreferences("phone_guard", Context.MODE_PRIVATE)
  val directory: File = File(context.filesDir, "phone_guard").apply { mkdirs() }

  fun title(): String = preferences.getString("alarm_title", null) ?: "Guard alarm sound"
  fun path(): String? = preferences.getString("alarm_path", null)
  fun source(): String = preferences.getString("alarm_source", null) ?: "none"
  fun hasSound(): Boolean = path()?.let { File(it).isFile && it.startsWith(directory.absolutePath) } == true
  fun selectedAudioFile() = File(directory, "guard_alarm_audio")
  fun recordingFile() = File(directory, "guard_alarm_recording.m4a")

  fun save(file: File, source: String, title: String) {
    val previous = path()
    if (previous != null && previous != file.absolutePath && File(previous).parentFile == directory) {
      runCatching { File(previous).delete() }
    }
    preferences.edit()
      .putString("alarm_path", file.absolutePath)
      .putString("alarm_source", source)
      .putString("alarm_title", cleanTitle(title))
      .apply()
  }

  fun delete() {
    path()?.let { stored -> if (File(stored).parentFile == directory) runCatching { File(stored).delete() } }
    preferences.edit().remove("alarm_path").remove("alarm_source").remove("alarm_title").apply()
  }

  fun saveSettings(sensitivity: String, delaySeconds: Int) {
    preferences.edit().putString("sensitivity", sensitivity).putInt("arming_delay", delaySeconds).apply()
  }

  fun sensitivity(): String = preferences.getString("sensitivity", null) ?: "HIGH"
  fun armingDelay(): Int = preferences.getInt("arming_delay", 5).takeIf { it in setOf(3, 5, 10) } ?: 5
  fun lastAlarmAt(): Long = preferences.getLong("last_alarm_at", 0L)
  fun recordAlarmNow() = preferences.edit().putLong("last_alarm_at", System.currentTimeMillis()).apply()
  fun guideAcknowledged(): Boolean = preferences.getBoolean("guide_acknowledged", false)
  fun setGuideAcknowledged(value: Boolean) = preferences.edit().putBoolean("guide_acknowledged", value).apply()

  /** "system" (follow device locale) or a supported language code such as "en", "ko", "es". */
  fun language(): String = preferences.getString("language", null) ?: "system"
  fun saveLanguage(value: String) = preferences.edit().putString("language", value).apply()

  private fun cleanTitle(value: String) = value.replace('\n', ' ').trim().take(40).ifBlank { "Guard alarm sound" }
}
