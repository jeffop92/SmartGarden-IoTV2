#include "sensors.h"
#include "../config/config.h"
// ==============================================================
// sensors.cpp — Soil moisture + pH sensor reading (stub for Phase 3)
// Full ADC reading and calibration deferred to Phase 5.
// ==============================================================
// --------------- Private state --------------------------------
static SensorReading _lastReading = {0.0f, 0.0f, 0, false};
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
}
SensorReading sensors_read() {
    // Stub — ADC reading and calibration implemented in Phase 5
    SensorReading reading;
    reading.soilMoisturePercent = 0.0f;
    reading.phValue             = 0.0f;
    reading.timestampMs         = millis();
    reading.valid               = false;
    _lastReading = reading;
    return reading;
}
SensorReading sensors_getLastReading() {
    return _lastReading;
}
#include <Arduino.h>
#include "../config/config.h"
#include "wifi_manager.h"
#include "mqtt_client.h"
#include "sensors.h"
// ==============================================================
// main.cpp — SmartGarden-IoTV2 Firmware Entry Point
// Phase 3: Firmware architecture foundation.
//   - Serial initialization
//   - WiFi connection (placeholder credentials)
//   - Module initialization with status messages
//   - Main loop scaffold (sensors + MQTT pending)
// ==============================================================
// --------------- Timing state ---------------------------------
static unsigned long _lastReadingMs  = 0;
static unsigned long _lastPublishMs  = 0;
// --------------- Arduino lifecycle ----------------------------
void setup() {
    // 1. Serial
    Serial.begin(SERIAL_BAUD_RATE);
    delay(500); // Allow USB serial to settle
    Serial.println();
    Serial.println("==============================================");
    Serial.print  ("  ");
    Serial.println(DEVICE_NAME);
    Serial.println("  SmartGarden-IoTV2 — Firmware v0.1.0");
    Serial.println("==============================================");
    // 2. Sensors (GPIO init only — no reading yet)
    Serial.println("[Setup] Inicializando sensores...");
    sensors_init();
    // 3. WiFi
    Serial.println("[Setup] Inicializando WiFi...");
    wifi_init();
    // 4. MQTT (stub — full init in Phase 4)
    Serial.println("[Setup] Inicializando cliente MQTT...");
    mqtt_init();
    // 5. Ready
    Serial.println("[Setup] Sistema listo.");
    Serial.print  ("[Setup] WiFi conectado: ");
    Serial.println(wifi_isConnected() ? "SI" : "NO");
    Serial.print  ("[Setup] MQTT conectado: ");
    Serial.println(mqtt_isConnected() ? "SI" : "NO");
    Serial.println("==============================================");
    Serial.println("[Loop] Iniciando bucle principal...");
}
void loop() {
    unsigned long now = millis();
    // Maintain WiFi connection
    wifi_maintain();
    // Maintain MQTT connection (stub — Phase 4)
    mqtt_maintain();
    // Sensor reading interval  (stub — Phase 5)
    if (now - _lastReadingMs >= READING_INTERVAL_MS) {
        _lastReadingMs = now;
        Serial.println("[Loop] Intervalo de lectura alcanzado (sensores pendientes - Fase 5).");
        // sensors_read() will be enabled in Phase 5
    }
    // MQTT publish interval  (stub — Phase 4)
    if (now - _lastPublishMs >= PUBLISH_INTERVAL_MS) {
        _lastPublishMs = now;
        Serial.println("[Loop] Intervalo de publicacion alcanzado (MQTT pendiente - Fase 4).");
        // mqtt_publish() will be enabled in Phase 4
    }
    // Small delay to avoid busy-looping
    delay(100);
}
