package com.uniquelab.donttouchmyphone.guard

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import kotlin.math.acos
import kotlin.math.max
import kotlin.math.sqrt

/**
 * Manually started foreground service for motion guarding. It is intentionally START_NOT_STICKY:
 * process death, reboot, app launch, and notification taps never arm the phone automatically.
 * mediaPlayback is used because this service owns user-requested, repeating alarm playback.
 */
class GuardService : Service(), SensorEventListener {
  companion object {
    private const val CHANNEL_ID = "phone_guard"
    private const val NOTIFICATION_ID = 4201
    private const val ACTION_START = "com.uniquelab.donttouchmyphone.guard.START"
    private const val ACTION_STOP = "com.uniquelab.donttouchmyphone.guard.STOP"
    private const val EXTRA_SENSITIVITY = "sensitivity"
    private const val EXTRA_DELAY = "delay"

    @Volatile private var state = "IDLE"
    @Volatile private var countdown = 0
    @Volatile private var errorMessage = ""
    @Volatile private var eventListener: ((String, String?, Int?) -> Unit)? = null

    fun isRunning() = state != "IDLE"
    fun currentState() = state
    fun currentCountdown() = countdown
    fun currentError() = errorMessage
    fun attachEventListener(listener: (String, String?, Int?) -> Unit) { eventListener = listener }

    fun start(context: Context, sensitivity: String, delaySeconds: Int) {
      val intent = Intent(context, GuardService::class.java).setAction(ACTION_START)
        .putExtra(EXTRA_SENSITIVITY, sensitivity)
        .putExtra(EXTRA_DELAY, delaySeconds)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent) else context.startService(intent)
    }

    fun requestStop(context: Context) {
      if (!isRunning()) return
      context.startService(Intent(context, GuardService::class.java).setAction(ACTION_STOP))
    }

    private fun publish(next: String, message: String? = null, remaining: Int? = null) {
      state = next
      if (remaining != null) countdown = remaining
      if (next != "ERROR") errorMessage = "" else errorMessage = message.orEmpty()
      eventListener?.invoke("onGuardStateChanged", message, remaining)
    }

    private fun event(type: String, message: String? = null) = eventListener?.invoke(type, message, null)
  }

  private val handler = Handler(Looper.getMainLooper())
  private lateinit var sensorManager: SensorManager
  private lateinit var repository: GuardSoundRepository
  private lateinit var player: GuardAlarmPlayer
  private var accelerometer: Sensor? = null
  private var listenerRegistered = false
  private var sensitivity = GuardSensitivityConfig.NORMAL
  private var calibrationEndsAt = 0L
  private val calibrationSum = FloatArray(3)
  private var calibrationSamples = 0
  private val baseline = FloatArray(3)
  private val gravity = FloatArray(3)
  private val previousRaw = FloatArray(3)
  private var hasPrevious = false
  private var baselineMagnitude = SensorManager.GRAVITY_EARTH
  private var calibrationNoise = 0f
  private var violationSamples = 0
  private var violationStartedAt = 0L
  private var stopping = false

  override fun onCreate() {
    super.onCreate()
    sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
    repository = GuardSoundRepository(this)
    player = GuardAlarmPlayer { fail("Could not play the alarm sound.") }
    accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopGuard(if (state == "ALARMING") "alarmStopped" else "guardStopped")
      return START_NOT_STICKY
    }
    if (intent?.action != ACTION_START || state != "IDLE") return START_NOT_STICKY
    if (!repository.hasSound()) { fail("Register a guard alarm sound first."); return START_NOT_STICKY }
    if (accelerometer == null) { fail("Motion detection is not available on this phone."); return START_NOT_STICKY }

    sensitivity = GuardSensitivityConfig.from(intent.getStringExtra(EXTRA_SENSITIVITY) ?: "NORMAL")
    val delaySeconds = intent.getIntExtra(EXTRA_DELAY, 5).coerceIn(3, 10)
    repository.saveSettings(sensitivity.name, delaySeconds)
    startInForeground()
    publish("ARMING", "Arming countdown started.", delaySeconds)
    scheduleArming(delaySeconds)
    return START_NOT_STICKY
  }

  private fun scheduleArming(seconds: Int) {
    countdown = seconds
    val tick = object : Runnable {
      override fun run() {
        if (state != "ARMING") return
        publish("ARMING", null, countdown)
        updateNotification()
        if (countdown <= 0) beginCalibration() else {
          countdown -= 1
          handler.postDelayed(this, 1_000)
        }
      }
    }
    handler.post(tick)
  }

  private fun beginCalibration() {
    publish("CALIBRATING", "Calibrating the current position.", 0)
    calibrationSamples = 0
    calibrationNoise = 0f
    calibrationSum.fill(0f)
    calibrationEndsAt = System.currentTimeMillis() + 1_500
    listenerRegistered = sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME)
    if (!listenerRegistered) fail("Could not start the motion sensor.") else updateNotification()
  }

  override fun onSensorChanged(event: SensorEvent) {
    if (event.sensor.type != Sensor.TYPE_ACCELEROMETER || stopping) return
    val now = System.currentTimeMillis()
    val raw = event.values
    if (state == "CALIBRATING") {
      for (index in 0..2) calibrationSum[index] += raw[index]
      val magnitude = magnitude(raw)
      calibrationNoise += kotlin.math.abs(magnitude - SensorManager.GRAVITY_EARTH)
      calibrationSamples += 1
      if (now >= calibrationEndsAt && calibrationSamples >= 10) finishCalibration()
      return
    }
    if (state != "ARMED") return

    if (!hasPrevious) {
      raw.copyInto(previousRaw, endIndex = 3)
      raw.copyInto(gravity, endIndex = 3)
      hasPrevious = true
      return
    }
    for (index in 0..2) gravity[index] = 0.88f * gravity[index] + 0.12f * raw[index]
    val accelDelta = kotlin.math.abs(magnitude(raw) - baselineMagnitude)
    val jerk = sqrt((0..2).sumOf { index ->
      val difference = (raw[index] - previousRaw[index]).toDouble()
      difference * difference
    }).toFloat()
    raw.copyInto(previousRaw, endIndex = 3)
    val tilt = angleDegrees(gravity, baseline)
    val adjustedAcceleration = sensitivity.accelerationDelta + calibrationNoise * 3f
    val violates = accelDelta > adjustedAcceleration || jerk > sensitivity.jerkThreshold || tilt > sensitivity.tiltDegrees

    if (violates) {
      if (violationSamples == 0) violationStartedAt = now
      violationSamples += 1
      if (violationSamples >= sensitivity.consecutiveSamples && now - violationStartedAt >= sensitivity.sustainedMillis) triggerAlarm()
    } else {
      violationSamples = max(0, violationSamples - 1)
      if (violationSamples == 0) violationStartedAt = 0L
    }
  }

  private fun finishCalibration() {
    if (calibrationSamples <= 0) { fail("Could not calibrate the current position."); return }
    for (index in 0..2) {
      baseline[index] = calibrationSum[index] / calibrationSamples
      gravity[index] = baseline[index]
      previousRaw[index] = baseline[index]
    }
    baselineMagnitude = magnitude(baseline)
    calibrationNoise = (calibrationNoise / calibrationSamples).coerceAtMost(1.2f)
    hasPrevious = true
    violationSamples = 0
    publish("ARMED", "Watching for phone movement.")
    event("calibrated")
    updateNotification()
  }

  private fun triggerAlarm() {
    if (state != "ARMED") return
    val path = repository.path()
    if (path == null || !player.play(path, looping = true)) { fail("Could not play the alarm sound."); return }
    repository.recordAlarmNow()
    publish("ALARMING", "Motion detected.")
    event("motionDetected")
    event("alarmStarted")
    updateNotification()
  }

  private fun fail(message: String) {
    publish("ERROR", message)
    event("serviceError", message)
    handler.postDelayed({ stopGuard("guardStopped") }, 250)
  }

  private fun stopGuard(eventType: String) {
    if (stopping) return
    stopping = true
    handler.removeCallbacksAndMessages(null)
    if (listenerRegistered) runCatching { sensorManager.unregisterListener(this) }
    listenerRegistered = false
    player.stop()
    val wasAlarming = state == "ALARMING"
    state = "IDLE"
    countdown = 0
    event(if (wasAlarming) "alarmStopped" else eventType)
    eventListener?.invoke("onGuardStateChanged", "Guard mode was turned off.", 0)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE) else @Suppress("DEPRECATION") stopForeground(true)
    stopSelf()
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
  override fun onBind(intent: Intent?): IBinder? = null
  override fun onTaskRemoved(rootIntent: Intent?) { /* Explicitly keep a manually armed session alive. */ }
  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    if (listenerRegistered) runCatching { sensorManager.unregisterListener(this) }
    player.stop()
    listenerRegistered = false
    state = "IDLE"
    countdown = 0
    super.onDestroy()
  }

  private fun startInForeground() {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else startForeground(NOTIFICATION_ID, notification)
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(CHANNEL_ID, "Phone Guard", NotificationManager.IMPORTANCE_LOW).apply {
      description = "Shows the status of a guard session you started yourself."
      setSound(null, null)
      enableVibration(false)
    }
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }

  private fun updateNotification() = getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, buildNotification())

  private fun buildNotification(): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val contentIntent = launchIntent?.let { PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE) }
    val stopIntent = PendingIntent.getService(this, 2, Intent(this, GuardService::class.java).setAction(ACTION_STOP), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val (title, text, action) = when (state) {
      "ARMING" -> Triple("Preparing to guard", "Watching starts from the current position in ${countdown}s.", "Cancel")
      "CALIBRATING" -> Triple("Calibrating guard mode", "Don't move the phone.", "Cancel")
      "ALARMING" -> Triple("Motion detected", "The alarm is playing on repeat.", "Stop alarm")
      else -> Triple("Guard mode is active", "Watching for phone movement.", "Turn off guard")
    }
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(this, CHANNEL_ID) else @Suppress("DEPRECATION") Notification.Builder(this)
    return builder.setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle(title).setContentText(text)
      .setContentIntent(contentIntent).setOngoing(true).setCategory(Notification.CATEGORY_SERVICE)
      .addAction(Notification.Action.Builder(null, action, stopIntent).build()).build()
  }

  private fun magnitude(values: FloatArray): Float = sqrt(values.take(3).sumOf { (it * it).toDouble() }).toFloat()
  private fun angleDegrees(first: FloatArray, second: FloatArray): Float {
    val denominator = magnitude(first) * magnitude(second)
    if (denominator < 0.001f) return 0f
    val dot = (0..2).sumOf { (first[it] * second[it]).toDouble() }.toFloat()
    return Math.toDegrees(acos((dot / denominator).coerceIn(-1f, 1f)).toDouble()).toFloat()
  }
}
