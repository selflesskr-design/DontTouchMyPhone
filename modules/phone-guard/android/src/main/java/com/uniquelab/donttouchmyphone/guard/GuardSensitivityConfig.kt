package com.uniquelab.donttouchmyphone.guard

enum class GuardSensitivityConfig(
  val accelerationDelta: Float,
  val tiltDegrees: Float,
  val jerkThreshold: Float,
  val consecutiveSamples: Int,
  val sustainedMillis: Long,
) {
  LOW(3.4f, 24f, 5.5f, 4, 650L),
  NORMAL(2.2f, 16f, 3.8f, 3, 450L),
  HIGH(1.2f, 9f, 2.5f, 3, 300L);

  companion object {
    fun from(value: String) = entries.firstOrNull { it.name == value.uppercase() } ?: NORMAL
  }
}
