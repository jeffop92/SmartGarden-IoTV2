#pragma once
#include <Arduino.h>
#include "sensors.h"

// Inicializa la conexión con Firebase
void firebase_init();

// Sube una lectura de sensores a la ruta correspondiente en RTDB
bool firebase_publishReading(const SensorReading& reading, bool pumpIsOn);

// Lee el estado del control manual desde la nube
// Retorna true si la lectura fue exitosa
// isManual: true si el usuario ha forzado el control manual (sobrescribe automático)
// pumpState: true si la bomba debe encenderse (solo válido si isManual es true)
bool firebase_getManualControlState(bool &isManual, bool &pumpState);
