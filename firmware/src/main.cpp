#include "../config/config.h"
#include "firebase_client.h"
#include "irrigation.h"
#include "lcd.h"
#include "sensors.h"
#include "wifi_manager.h"
#include <Arduino.h>

// ==============================================================
// main.cpp — SmartGarden-IoTV2 Firmware Entry Point
// ==============================================================

// --------------- Timing state ---------------------------------
static unsigned long _lastReadingMs = 0;
static unsigned long _lastPublishMs = 0;
static unsigned long _lastControlMs = 0;

// Variables de estado del Dashboard
static bool _isManualMode = false;
static bool _manualPumpState = false;

// --------------- Arduino lifecycle ----------------------------

void setup() {
  // 1. Serial
  Serial.begin(SERIAL_BAUD_RATE);
  delay(500);
  Serial.println();
  Serial.println("==============================================");
  Serial.print("  ");
  Serial.println(DEVICE_NAME);
  Serial.println("  SmartGarden-IoTV2 — Firmware (Firebase)");
  Serial.println("==============================================");

  // 2. Módulos de Hardware
  Serial.println("[Setup] Inicializando hardware...");
  sensors_init();
  irrigation_init();
  lcd_init();

  pinMode(PIN_WATER_LEVEL, INPUT_PULLUP);

  // 3. Red y Nube
  Serial.println("[Setup] Inicializando red...");
  wifi_init();
  firebase_init();

  // 4. Ready
  Serial.println("[Setup] Sistema listo.");
  Serial.print("[Setup] WiFi conectado: ");
  Serial.println(wifi_isConnected() ? "SI" : "NO");
  Serial.println("==============================================");
  Serial.println("[Loop] Iniciando bucle principal...");
}

void loop() {
  unsigned long now = millis();

  // 1. Mantener WiFi activo
  wifi_maintain();

  // 2. Leer comandos manuales desde Firebase (cada 5 segundos para no saturar)
  if (now - _lastControlMs >= 5000) {
    _lastControlMs = now;
    if (wifi_isConnected()) {
      firebase_getManualControlState(_isManualMode, _manualPumpState);
    }
  }

  // 3. Leer sensores y ejecutar lógica de riego
  if (now - _lastReadingMs >= READING_INTERVAL_MS) {
    _lastReadingMs = now;

    // Tomar lecturas
    SensorReading reading = sensors_read();

    bool waterLevelOk = digitalRead(PIN_WATER_LEVEL) == LOW;

    // Ejecutar cerebro de riego
    irrigation_process(reading.soilMoisturePercent, _isManualMode,
                       _manualPumpState);
    // Actualizar información del LCD
    lcd_show(reading.soilMoisturePercent, reading.phValue,
             reading.airTemperatureC, reading.airHumidityPercent,
             irrigation_isPumpOn(), waterLevelOk);
  }

  // 4. Publicar datos a Firebase
  if (now - _lastPublishMs >= PUBLISH_INTERVAL_MS) {
    _lastPublishMs = now;

    if (wifi_isConnected()) {
      SensorReading reading = sensors_getLastReading();
      bool pumpStatus = irrigation_isPumpOn();

      if (firebase_publishReading(reading, pumpStatus)) {
        Serial.println("[Loop] Lectura enviada a Firebase correctamente.");
      }
    } else {
      Serial.println("[Loop] Sin WiFi. No se enviaron datos.");
    }
  }

  // Pequeño delay para estabilidad del RTOS
  delay(10);
}