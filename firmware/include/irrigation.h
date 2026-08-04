#pragma once
#include <Arduino.h>

// Inicializa el pin del relé
void irrigation_init();

// Devuelve true si la bomba está actualmente encendida
bool irrigation_isPumpOn();

// Procesa la lógica del riego
// currentMoisture: Nivel de humedad de suelo actual (0-100%)
// isManualMode: Si está en true, obedece a manualPumpState. Si está en false, es automático.
// manualPumpState: Estado que el usuario solicita desde el Dashboard
void irrigation_process(float currentMoisture, bool isManualMode, bool manualPumpState);
