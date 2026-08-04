#include "irrigation.h"
#include "../config/config.h"

// ==============================================================
// irrigation.cpp — Lógica de control de riego y relé
// ==============================================================

static bool _pumpState = false;

// Helpers internos para manejar el relé (lógica invertida o directa)
// Asumimos un módulo de relé estándar que se activa con LOW (muy común).
// Si tu relé se activa con HIGH, cambia HIGH por LOW y viceversa.
#define RELAY_ON  LOW
#define RELAY_OFF HIGH

static void setPump(bool state) {
    if (_pumpState != state) {
        _pumpState = state;
        digitalWrite(PIN_RELAY_PUMP, state ? RELAY_ON : RELAY_OFF);
        
        Serial.print("[Riego] Bomba de agua: ");
        Serial.println(state ? "ENCENDIDA" : "APAGADA");
    }
}

void irrigation_init() {
    Serial.println("[Riego] Inicializando relé...");
    pinMode(PIN_RELAY_PUMP, OUTPUT);
    
    // Iniciar con la bomba apagada por seguridad
    digitalWrite(PIN_RELAY_PUMP, RELAY_OFF);
    _pumpState = false;
    Serial.println("[Riego] Bomba lista (Apagada por defecto).");
}

bool irrigation_isPumpOn() {
    return _pumpState;
}

void irrigation_process(float currentMoisture, bool isManualMode, bool manualPumpState) {
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
