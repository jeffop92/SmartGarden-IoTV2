#include "irrigation.h"
#include "../config/config.h"

// ==============================================================
// irrigation.cpp — Lógica de control de riego y L298N
// ==============================================================

static bool _pumpState = false;

// Helper interno para controlar la bomba mediante el L298N
// IN1 del L298N recibe HIGH (~3.3 V) para encender la bomba.
// IN1 recibe LOW (0 V) para apagarla.
#define PUMP_ON HIGH
#define PUMP_OFF LOW

static void setPump(bool state) {
  if (_pumpState != state) {
    _pumpState = state;
    digitalWrite(PIN_L298N_IN1, state ? PUMP_ON : PUMP_OFF);

    Serial.print("[Riego] Bomba de agua: ");
    Serial.println(state ? "ENCENDIDA" : "APAGADA");
  }
}

void irrigation_init() {
  Serial.println("[Riego] Inicializando L298N...");
  pinMode(PIN_L298N_IN1, OUTPUT);

  // Iniciar con la bomba apagada por seguridad
  digitalWrite(PIN_L298N_IN1, PUMP_OFF);
  _pumpState = false;
  Serial.println("[Riego] Bomba lista (Apagada por defecto).");
}

bool irrigation_isPumpOn() { return _pumpState; }

void irrigation_process(float currentMoisture, bool isManualMode,
                        bool manualPumpState) {
  if (isManualMode) {
    // MODO MANUAL: Responde ciegamente a la orden del Dashboard
    setPump(manualPumpState);
  } else {
    // MODO AUTOMÁTICO: Basado en las lecturas de los sensores
    if (currentMoisture < MOISTURE_THRESHOLD) {
      setPump(true); // Muy seco, regar
    } else {
      setPump(false); // Suficiente humedad, detener
    }
  }
}
