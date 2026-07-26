package com.uniquelab.donttouchmyphone.guard

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.Toast

/** Home-screen widget mirroring guard status with a tap-to-toggle action, independent of the RN app process. */
class GuardWidgetProvider : AppWidgetProvider() {
  companion object {
    private const val ACTION_TOGGLE = "com.uniquelab.donttouchmyphone.guard.WIDGET_TOGGLE"

    fun updateAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(ComponentName(context, GuardWidgetProvider::class.java))
      if (ids.isEmpty()) return
      val views = buildViews(context)
      ids.forEach { id -> manager.updateAppWidget(id, views) }
    }

    private fun buildViews(context: Context): RemoteViews {
      val repository = GuardSoundRepository(context)
      val strings = localizedResources(context, repository.language())
      val running = GuardService.isRunning()
      val statusText = when (GuardService.currentState()) {
        "ARMING" -> strings.getString(R.string.notif_arming_title)
        "CALIBRATING" -> strings.getString(R.string.notif_calibrating_title)
        "ALARMING" -> strings.getString(R.string.notif_alarming_title)
        "ARMED" -> strings.getString(R.string.notif_armed_title)
        else -> strings.getString(R.string.widget_status_off)
      }
      val views = RemoteViews(context.packageName, R.layout.guard_widget)
      views.setTextViewText(R.id.widget_status, statusText)
      views.setTextViewText(R.id.widget_toggle, strings.getString(if (running) R.string.widget_turn_off else R.string.widget_turn_on))
      val toggleIntent = Intent(context, GuardWidgetProvider::class.java).setAction(ACTION_TOGGLE)
      val pendingIntent = PendingIntent.getBroadcast(context, 0, toggleIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
      return views
    }
  }

  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    val views = buildViews(context)
    appWidgetIds.forEach { id -> appWidgetManager.updateAppWidget(id, views) }
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action != ACTION_TOGGLE) return
    val repository = GuardSoundRepository(context)
    when {
      GuardService.isRunning() -> GuardService.requestStop(context)
      !repository.hasSound() -> {
        val strings = localizedResources(context, repository.language())
        Toast.makeText(context, strings.getString(R.string.widget_sound_missing), Toast.LENGTH_LONG).show()
      }
      else -> GuardService.start(context, repository.sensitivity(), repository.armingDelay())
    }
    updateAll(context)
  }
}
