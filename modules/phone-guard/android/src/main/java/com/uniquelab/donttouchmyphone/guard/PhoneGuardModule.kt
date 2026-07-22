package com.uniquelab.donttouchmyphone.guard

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.OpenableColumns
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class PhoneGuardModule : Module() {
  companion object {
    private const val PICK_GUARD_AUDIO_REQUEST = 5401
  }

  private val context get() = appContext.reactContext ?: throw IllegalStateException("React context unavailable")
  private val guardSoundStore by lazy { GuardSoundRepository(context) }
  private val guardPreviewPlayer by lazy {
    GuardAlarmPlayer { emit("audioError", "Could not play the guard alarm sound.") }
  }
  private val mainHandler = Handler(Looper.getMainLooper())

  private var mediaRecorder: MediaRecorder? = null
  private var guardRecording = false
  private var guardRecordingPath: String? = null

  override fun definition() = ModuleDefinition {
    Name("PhoneGuard")
    Events("onGuardEvent")
    GuardService.attachEventListener { type, message, remaining ->
      mainHandler.post { emit(type, message, countdown = remaining) }
    }

    Function("requestPermissions") { requestPermissions() }
    Function("getGuardStatus") { guardStatus() }
    Function("getGuardSoundInfo") { guardSoundInfo() }
    Function("startGuard") { sensitivity: String, delaySeconds: Int -> startGuard(sensitivity, delaySeconds) }
    Function("cancelGuardPreparation") { stopGuard() }
    Function("stopGuard") { stopGuard() }
    Function("stopAlarm") { stopGuard() }
    Function("importGuardSound") { pickGuardAudio() }
    Function("recordGuardSound") { startGuardSoundRecording() }
    Function("stopGuardSoundRecording") { stopGuardSoundRecording() }
    Function("previewGuardSound") { previewGuardSound() }
    Function("stopGuardSoundPreview") { guardPreviewPlayer.stop() }
    Function("deleteGuardSound") { deleteGuardSound() }
    Function("setGuardGuideAcknowledged") { acknowledged: Boolean -> guardSoundStore.setGuideAcknowledged(acknowledged) }
    Function("setGuardSettings") { sensitivity: String, delaySeconds: Int -> guardSoundStore.saveSettings(GuardSensitivityConfig.from(sensitivity).name, delaySeconds) }

    OnActivityResult { _, payload ->
      if (payload.requestCode == PICK_GUARD_AUDIO_REQUEST) handlePickedGuardAudio(payload.resultCode, payload.data)
    }
    OnDestroy { cleanup() }
  }

  private fun emit(type: String, message: String? = null, countdown: Int? = null) {
    val body = mutableMapOf<String, Any>("type" to type)
    message?.let { body["message"] = it }
    countdown?.let { body["countdown"] = it }
    sendEvent("onGuardEvent", body)
  }

  private fun hasPermission(permission: String) = Build.VERSION.SDK_INT < 23 || context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

  private fun requestPermissions() {
    ensureDefaultGuardSound()
    val permissions = mutableListOf(Manifest.permission.RECORD_AUDIO)
    if (Build.VERSION.SDK_INT >= 33) permissions.add(Manifest.permission.POST_NOTIFICATIONS)
    val missing = permissions.filter { !hasPermission(it) }.toTypedArray()
    if (missing.isNotEmpty()) appContext.currentActivity?.requestPermissions(missing, 4201)
  }

  /** Provisions the bundled siren as the guard alarm sound until the user records or imports their own. */
  private fun ensureDefaultGuardSound() {
    if (guardSoundStore.hasSound()) return
    runCatching {
      val destination = guardSoundStore.selectedAudioFile()
      context.assets.open("siren.mp3").use { input -> destination.outputStream().use { output -> input.copyTo(output) } }
      guardSoundStore.save(destination, "file", "Siren")
    }
  }

  private fun guardStatus() = mapOf(
    "state" to GuardService.currentState(),
    "countdown" to GuardService.currentCountdown(),
    "sensitivity" to guardSoundStore.sensitivity(),
    "armingDelaySeconds" to guardSoundStore.armingDelay(),
    "errorMessage" to GuardService.currentError(),
    "lastAlarmAt" to guardSoundStore.lastAlarmAt().toDouble(),
    "guideAcknowledged" to guardSoundStore.guideAcknowledged(),
  )

  private fun guardSoundInfo() = mapOf(
    "title" to guardSoundStore.title(),
    "source" to guardSoundStore.source(),
    "exists" to guardSoundStore.hasSound(),
  )

  private fun startGuard(sensitivity: String, delaySeconds: Int) {
    if (GuardService.isRunning()) { emit("serviceError", "Guard mode is already running."); return }
    if (!guardSoundStore.hasSound()) { emit("soundMissing", "Register a guard alarm sound first."); return }
    if (Build.VERSION.SDK_INT >= 33 && !hasPermission(Manifest.permission.POST_NOTIFICATIONS)) {
      appContext.currentActivity?.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 4204)
      emit("serviceError", "Allow the notification permission and try again.")
      return
    }
    if (mediaRecorder != null) { emit("serviceError", "Stop recording first."); return }
    guardPreviewPlayer.stop()
    val supported = (context.getSystemService(android.content.Context.SENSOR_SERVICE) as android.hardware.SensorManager)
      .getDefaultSensor(android.hardware.Sensor.TYPE_ACCELEROMETER) != null
    if (!supported) { emit("sensorUnavailable", "Motion detection is not available on this phone."); return }
    runCatching { GuardService.start(context, GuardSensitivityConfig.from(sensitivity).name, delaySeconds) }
      .onFailure { emit("serviceError", "Could not start guard mode. Please try again.") }
  }

  private fun stopGuard() {
    guardPreviewPlayer.stop()
    runCatching { GuardService.requestStop(context) }
      .onFailure { emit("serviceError", "Could not turn off guard mode.") }
  }

  private fun pickGuardAudio() {
    if (GuardService.isRunning()) { emit("serviceError", "Turn off guard mode before changing the sound."); return }
    if (mediaRecorder != null) { emit("serviceError", "Stop recording first."); return }
    val activity = appContext.currentActivity ?: run { emit("serviceError", "Reopen the screen and try again."); return }
    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = "audio/*"
      putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("audio/mpeg", "audio/mp3", "audio/mp4", "audio/aac", "audio/*"))
    }
    activity.startActivityForResult(intent, PICK_GUARD_AUDIO_REQUEST)
  }

  private fun handlePickedGuardAudio(resultCode: Int, data: Intent?) {
    if (resultCode != Activity.RESULT_OK) { emit("onGuardSoundChanged", "Sound selection cancelled."); return }
    val uri = data?.data ?: run { emit("audioError", "Could not open the selected file."); return }
    runCatching {
      val displayName = context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
        if (cursor.moveToFirst()) cursor.getString(0) else null
      } ?: "Guard alarm sound"
      val destination = guardSoundStore.selectedAudioFile()
      context.contentResolver.openInputStream(uri)?.use { input -> destination.outputStream().use { output -> input.copyTo(output) } }
        ?: error("Selected file could not be opened")
      guardSoundStore.save(destination, "file", displayName.substringBeforeLast('.'))
      emit("onGuardSoundChanged", "Guard alarm sound registered.")
    }.onFailure {
      runCatching { guardSoundStore.selectedAudioFile().delete() }
      emit("audioError", "Could not import the audio file.")
    }
  }

  @Suppress("DEPRECATION")
  private fun newRecorder() = if (Build.VERSION.SDK_INT >= 31) MediaRecorder(context) else MediaRecorder()

  private fun startGuardSoundRecording() {
    if (GuardService.isRunning()) { emit("serviceError", "Turn off guard mode before changing the sound."); return }
    if (!hasPermission(Manifest.permission.RECORD_AUDIO)) {
      appContext.currentActivity?.requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 4203)
      emit("audioError", "Allow the microphone permission and record again.")
      return
    }
    if (mediaRecorder != null) { emit("audioError", "Another recording is already in progress."); return }
    guardPreviewPlayer.stop()
    val output = guardSoundStore.recordingFile()
    runCatching {
      mediaRecorder = newRecorder().apply {
        setAudioSource(MediaRecorder.AudioSource.MIC)
        setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
        setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
        setAudioEncodingBitRate(128_000)
        setAudioSamplingRate(44_100)
        setOutputFile(output.absolutePath)
        prepare()
        start()
      }
      guardRecording = true
      guardRecordingPath = output.absolutePath
      emit("onGuardRecordingStateChanged", "Recording started")
    }.onFailure {
      runCatching { mediaRecorder?.release() }
      mediaRecorder = null
      guardRecording = false
      guardRecordingPath = null
      runCatching { output.delete() }
      emit("audioError", "Could not start recording.")
    }
  }

  private fun stopGuardSoundRecording() {
    if (!guardRecording) return
    val recorder = mediaRecorder ?: return
    val path = guardRecordingPath
    mediaRecorder = null
    guardRecording = false
    guardRecordingPath = null
    val stopped = runCatching { recorder.stop() }.isSuccess
    runCatching { recorder.release() }
    if (stopped && path != null) {
      guardSoundStore.save(File(path), "recording", "Recorded guard alarm sound")
      emit("onGuardSoundChanged", "Recorded guard alarm sound saved.")
    } else {
      path?.let { runCatching { File(it).delete() } }
      emit("audioError", "The recording was too short or could not be saved.")
    }
    emit("onGuardRecordingStateChanged", "Recording stopped")
  }

  private fun previewGuardSound() {
    if (GuardService.isRunning()) { emit("serviceError", "Can't preview while guard mode is active."); return }
    if (mediaRecorder != null) { emit("audioError", "Stop recording first."); return }
    val path = guardSoundStore.path()
    if (path == null || !guardPreviewPlayer.play(path, looping = false)) emit("soundMissing", "Register a guard alarm sound first.")
  }

  private fun deleteGuardSound() {
    if (GuardService.isRunning()) { emit("serviceError", "Turn off guard mode before deleting the sound."); return }
    guardPreviewPlayer.stop()
    guardSoundStore.delete()
    emit("onGuardSoundChanged", "Guard alarm sound deleted.")
  }

  private fun cleanup() {
    stopGuardSoundRecording()
    guardPreviewPlayer.stop()
  }
}
