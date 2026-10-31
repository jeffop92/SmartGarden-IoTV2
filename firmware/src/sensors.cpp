#include "sensors.h"
#include "../config/config.h"
#include <Arduino.h>
#include <DHT.h>
#include <math.h>

// ==============================================================
// SmartGarden-IoTV2 — Lectura y calibración de sensores
// Sensores: humedad del suelo, pH y DHT22
// ==============================================================

// ---------------- Estado privado -------------------------------

static SensorReading _lastReading = {
    0.0f, // Humedad del suelo (%)
    0.0f, // pH
    0.0f, // Temperatura del aire (°C)
    0.0f, // Humedad del aire (%)
    0,    // Timestamp
    false // Estado de validez
};

static DHT dht(PIN_DHT, DHT_TYPE);

// ---------------- Calibración de pH ----------------------------
// Los valores ADC se obtuvieron experimentalmente.
// El ADC disminuye cuando aumenta el pH.

static float calcularPH(float adcPromedio) {

  // No extrapolar fuera del rango calibrado.
  if (adcPromedio > PH_ADC_401 || adcPromedio < PH_ADC_918) {
    return NAN;
  }

  // Tramo 1: pH 4.01 a pH 6.86
  if (adcPromedio >= PH_ADC_686) {
    return 4.01f + (PH_ADC_401 - adcPromedio) * (6.86f - 4.01f) /
                       (PH_ADC_401 - PH_ADC_686);
  }

  // Tramo 2: pH 6.86 a pH 9.18
  return 6.86f + (PH_ADC_686 - adcPromedio) * (9.18f - 6.86f) /
                     (PH_ADC_686 - PH_ADC_918);
}

// ---------------- Inicialización -------------------------------

void sensors_init() {

  pinMode(PIN_SOIL_MOISTURE, INPUT);
  pinMode(PIN_PH_SENSOR, INPUT);

  // Resolución ADC de 12 bits: 0 a 4095.
  analogReadResolution(12);

  dht.begin();

  Serial.println();
  Serial.println("================================================");
  Serial.println("       SMARTGARDEN-IOTV2 | SENSORES");
  Serial.println("================================================");

  Serial.printf("[INIT] Humedad del suelo : GPIO %d\n", PIN_SOIL_MOISTURE);

  Serial.printf("[INIT] Sensor de pH      : GPIO %d\n", PIN_PH_SENSOR);

  Serial.printf("[INIT] DHT22             : GPIO %d\n", PIN_DHT);

  Serial.printf("[INIT] ADC seco          : %d\n", SOIL_ADC_DRY);

  Serial.printf("[INIT] ADC humedo        : %d\n", SOIL_ADC_WET);

  Serial.printf("[INIT] Muestras de pH    : %d\n", PH_SAMPLES);

  Serial.println("[INIT] Sensores inicializados.");
  Serial.println("================================================");
}

// ---------------- Lectura de sensores --------------------------

SensorReading sensors_read() {

  SensorReading reading = {};

  // ----------------------------------------------------------
  // 1. DHT22 — Temperatura y humedad del aire
  // ----------------------------------------------------------

  float temperature = dht.readTemperature();
  float airHumidity = dht.readHumidity();

  bool dhtValid = !isnan(temperature) && !isnan(airHumidity);

  if (dhtValid) {

    reading.airTemperatureC = temperature;
    reading.airHumidityPercent = airHumidity;

    Serial.printf("[AIRE] Temperatura: %.2f °C | Humedad: %.2f %%\n",
                  temperature, airHumidity);

  } else {

    reading.airTemperatureC = 0.0f;
    reading.airHumidityPercent = 0.0f;

    Serial.println("[ERROR][DHT22] No se pudo leer temperatura/humedad.");
  }

  // ----------------------------------------------------------
  // 2. Humedad del suelo — GPIO32
  // ----------------------------------------------------------

  int soilRaw = analogRead(PIN_SOIL_MOISTURE);

  // Conversión lineal:
  // SOIL_ADC_DRY  = 0 %
  // SOIL_ADC_WET  = 100 %

  float soilPercent =
      100.0f * (SOIL_ADC_DRY - soilRaw) / (float)(SOIL_ADC_DRY - SOIL_ADC_WET);

  // Limitar el resultado al rango de 0 a 100 %.
  soilPercent = constrain(soilPercent, 0.0f, 100.0f);

  reading.soilMoisturePercent = soilPercent;

  Serial.printf("[SUELO] ADC: %d | Humedad estimada: %.1f %%\n", soilRaw,
                soilPercent);

  // ----------------------------------------------------------
  // 3. Sensor de pH PH-4502C — GPIO35
  // ----------------------------------------------------------

  long sumaADC = 0;

  for (int i = 0; i < PH_SAMPLES; i++) {
    sumaADC += analogRead(PIN_PH_SENSOR);
    delay(10);
  }

  float phADC = sumaADC / (float)PH_SAMPLES;
  float phValue = calcularPH(phADC);

  if (!isnan(phValue)) {

    reading.phValue = phValue;

    Serial.printf("[PH] ADC promedio: %.2f | pH calculado: %.2f\n", phADC,
                  phValue);

  } else {

    // 0 indica que no hay un valor de pH válido.
    reading.phValue = 0.0f;

    Serial.printf("[AVISO][PH] ADC promedio: %.2f | "
                  "Fuera del rango calibrado (pH 4.01-9.18). "
                  "pH no disponible.\n",
                  phADC);
  }

  // ----------------------------------------------------------
  // 4. Estado de la lectura
  // ----------------------------------------------------------

  reading.timestampMs = millis();

  // Se conserva el criterio general anterior:
  // la estructura de lectura se genera en cada ciclo.
  reading.valid = true;

  _lastReading = reading;

  Serial.println("[SENSORES] ----------------------------------------");

  return reading;
}

// ---------------- Última lectura -------------------------------

SensorReading sensors_getLastReading() { return _lastReading; }
