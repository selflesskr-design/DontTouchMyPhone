package com.uniquelab.donttouchmyphone.guard

import android.content.Context
import android.content.res.Configuration
import android.content.res.Resources
import java.util.Locale

/** Resources scoped to the user's chosen app language ("system", "en", "ko", "es"). */
fun localizedResources(context: Context, language: String): Resources {
  if (language == "system") return context.resources
  val config = Configuration(context.resources.configuration)
  config.setLocale(Locale(language))
  return context.createConfigurationContext(config).resources
}
