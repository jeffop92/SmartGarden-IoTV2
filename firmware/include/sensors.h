#pragma once
#include <Arduino.h>
// ==============================================================
// sensors.h — Soil moisture and pH sensor reading
// (Implementation deferred to Phase 5 — Sensor Reading)
// ==============================================================
/**
 * @brief Struct that holds one complete set of sensor readings.
 */
struct SensorReading {
    float soilMoisturePercent;  // 0.0 – 100.0 %
    float phValue;              // 0.0 – 14.0
    unsigned long timestampMs;  // millis() at time of reading
    bool  valid;                // true if reading was successful
};
/**
 * @brief Initialize sensor GPIO pins and ADC configuration.
 *        Call once from setup().
 */
void sensors_init();
/**
 * @brief Take a new reading from both sensors.
 *
 * @return SensorReading struct with all values populated.
 */
SensorReading sensors_read();
/**
 * @brief Return the last reading without taking a new one.
 */
SensorReading sensors_getLastReading();