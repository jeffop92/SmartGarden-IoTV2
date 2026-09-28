#include "sensors.h"
#include "../config/config.h"
#include <DHT.h>

// ==============================================================
// sensors.cpp — Soil moisture + pH sensor reading
// ==============================================================

// --------------- Private state --------------------------------

static SensorReading _lastReading = {0.0f, // soil
                                     0.0f, // ph
                                     0.0f, // temperatura
                                     0.0f, // humedad ambiente
                                     0,    // timestamp
                                     false};

static DHT dht(PIN_DHT, DHT_TYPE);

// --------------- Public functions -----------------------------

void sensors_init() {
  // Configure ADC pins as inputs
  pinMode(PIN_SOIL_MOISTURE, INPUT);
  pinMode(PIN_PH_SENSOR, INPUT);

  Serial.println();

  Serial.println("[Sensores] Pines ADC configurados.");
  Serial.print("[Sensores] Humedad del suelo -> GPIO ");
  Serial.println(PIN_SOIL_MOISTURE);

  Serial.print("[Sensores] Sensor de pH     -> GPIO ");
  Serial.println(PIN_PH_SENSOR);

  Serial.println("[Sensores] Lectura de sensores configurada.");

  // Initialize DHT22
  dht.begin();
  Serial.println("[Sensores] DHT22 inicializado.");
}

// --------------- Sensor reading -------------------------------

SensorReading sensors_read() {

  SensorReading reading;

  // ----------------------------------------------------------
  // DHT22
  // ----------------------------------------------------------

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // ----------------------------------------------------------
  // Soil moisture sensor
  // ----------------------------------------------------------

  int soilRaw = analogRead(PIN_SOIL_MOISTURE);

  // Convert ADC value to soil moisture percentage.
  //
  // Calibration:
  // 4095 ADC = 0 % (dry)
  // 2126 ADC = 100 % (maximum humidity reference)
  //
  // The relationship is inverse:
  // higher ADC = drier
  // lower ADC = wetter

  float soilPercent =
      100.0f * (SOIL_ADC_DRY - soilRaw) / (SOIL_ADC_DRY - SOIL_ADC_WET);

  // Limit percentage between 0 and 100
  soilPercent = constrain(soilPercent, 0.0f, 100.0f);

  // Save soil moisture percentage
  reading.soilMoisturePercent = soilPercent;

  // ----------------------------------------------------------
  // Serial output — DHT22
  // ----------------------------------------------------------

  if (isnan(temperature) || isnan(humidity)) {

    Serial.println("[DHT22] Error de lectura.");

  } else {

    Serial.print("[DHT22] Temperatura: ");
    Serial.print(temperature);
    Serial.print(" °C | Humedad: ");
    Serial.print(humidity);
    Serial.println(" %");
  }

  // ----------------------------------------------------------
  // Serial output — Soil moisture
  // ----------------------------------------------------------

  Serial.print("[Suelo] ADC: ");
  Serial.print(soilRaw);
  Serial.print(" | Humedad: ");
  Serial.print(soilPercent);
  Serial.println(" %");

  // ----------------------------------------------------------
  // Save sensor values
  // ----------------------------------------------------------

  reading.airTemperatureC = temperature;
  reading.airHumidityPercent = humidity;

  // pH sensor is not connected yet
  reading.phValue = 0.0f;

  reading.timestampMs = millis();

  reading.valid = true;

  _lastReading = reading;

  return reading;
}

// --------------- Last reading ---------------------------------

SensorReading sensors_getLastReading() { return _lastReading; }