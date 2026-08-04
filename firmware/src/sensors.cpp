#include "sensors.h"
#include "../config/config.h"
#include <DHT.h>

// ==============================================================
// sensors.cpp — Soil moisture + pH sensor reading (stub for Phase 3)
// Full ADC reading and calibration deferred to Phase 5.
// ==============================================================
// --------------- Private state --------------------------------
static SensorReading _lastReading = {
    0.0f,   // soil
    0.0f,   // ph
    0.0f,   // temperatura
    0.0f,   // humedad ambiente
    0,      // timestamp
    false
};
static DHT dht(PIN_DHT, DHT_TYPE);
// --------------- Public functions -----------------------------
void sensors_init() {
    // Configure ADC pins as inputs
    pinMode(PIN_SOIL_MOISTURE, INPUT);
    pinMode(PIN_PH_SENSOR, INPUT);
    // ESP32 ADC is 12-bit by default (0–4095), 3.3V reference
    // analogReadResolution(12);  // already default
    // analogSetAttenuation(ADC_11db); // allows 0–3.3V range
    Serial.println("[Sensores] Pines ADC configurados.");
    Serial.print("[Sensores] Humedad del suelo -> GPIO ");
    Serial.println(PIN_SOIL_MOISTURE);
    Serial.print("[Sensores] Sensor de pH     -> GPIO ");
    Serial.println(PIN_PH_SENSOR);
    Serial.println("[Sensores] Lectura de sensores pendiente (Fase 5).");
    dht.begin();
Serial.println("[Sensores] DHT22 inicializado.");
}
SensorReading sensors_read() {
    // Stub — ADC reading and calibration implemented in Phase 5

    SensorReading reading;

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    int soilRaw = analogRead(PIN_SOIL_MOISTURE);
    reading.soilMoisturePercent = soilRaw;

    if (isnan(temperature) || isnan(humidity)) {
    Serial.println("[DHT22] Error de lectura.");
}
else {
    Serial.print("[DHT22] Temperatura: ");
    Serial.print(temperature);
    Serial.print(" °C | Humedad: ");
    Serial.print(humidity);
    Serial.println(" %");
}

    Serial.print("[Suelo] ADC: ");
    Serial.println(soilRaw);
    // Asigna los valores del DHT a la estructura de lectura
    reading.airTemperatureC = temperature;
    reading.airHumidityPercent = humidity;

    reading.phValue             = 0.0f;
    reading.timestampMs         = millis();
    reading.valid               = true;

    _lastReading = reading;
    return reading;
}
SensorReading sensors_getLastReading()
{
    return _lastReading;
}