
#pragma once

// ==============================================================
// SmartGarden-IoTV2 — Central Configuration
// ==============================================================

// --------------------------------------------------------------
// WiFi
// --------------------------------------------------------------
#define WIFI_SSID "CELERITY_PALACIO"
#define WIFI_PASSWORD "1104184674@"

#define WIFI_RECONNECT_DELAY_MS 5000
#define WIFI_MAX_RETRIES 10

// --------------------------------------------------------------
// Firebase Realtime Database
// --------------------------------------------------------------
#define FIREBASE_HOST "https://smart-garden-60bf2-default-rtdb.firebaseio.com/"
#define FIREBASE_AUTH "ZfWknAl30lfHZsG8tMjWdslCFk31WbUzfthEL0hQ"

// --------------------------------------------------------------
// Sensor GPIO Pins
// --------------------------------------------------------------
#define PIN_SOIL_MOISTURE 32 // Sensor capacitivo de humedad
#define PIN_PH_SENSOR 35     // Sensor PH-4502C, salida PO
#define PIN_DHT 4
#define DHT_TYPE DHT22

// --------------------------------------------------------------
// Sensor Reading Intervals
// --------------------------------------------------------------
#define READING_INTERVAL_MS 20000
#define PUBLISH_INTERVAL_MS 15000

// --------------------------------------------------------------
// Soil Moisture Calibration
// Calibración experimental provisional
// ADC seco = 2495; ADC húmedo = 1200
// --------------------------------------------------------------
#define SOIL_ADC_DRY 2495
#define SOIL_ADC_WET 1200

// --------------------------------------------------------------
// pH Calibration — PH-4502C
// Interpolación lineal por tramos
// Valores ADC promedio medidos experimentalmente
// --------------------------------------------------------------
#define PH_ADC_401 1935.93f
#define PH_ADC_686 1653.35f
#define PH_ADC_918 1386.30f

#define PH_SAMPLES 10

// --------------------------------------------------------------
// System
// --------------------------------------------------------------
#define SERIAL_BAUD_RATE 115200
#define DEVICE_NAME "SmartGarden-ESP32-01"

// --------------------------------------------------------------
// Irrigation / L298N
// --------------------------------------------------------------
#define PIN_L298N_IN1 23

// IN1 HIGH = bomba encendida
// IN1 LOW  = bomba apagada
// IN2 conectado a GND según el montaje documentado
#define MOISTURE_THRESHOLD_ON 50.0f
#define MOISTURE_THRESHOLD_OFF 60.0f
// --------------------------------------------------------------
// LCD 16x2 I2C
// --------------------------------------------------------------
#define PIN_LCD_SDA 21
#define PIN_LCD_SCL 22

// --------------------------------------------------------------
// Water Level Sensor
// --------------------------------------------------------------
#define PIN_WATER_LEVEL 16

// --------------------------------------------------------------
// Status LED
// --------------------------------------------------------------
#define PIN_STATUS_LED 15

// --------------------------------------------------------------
// NTP Settings
// --------------------------------------------------------------
#define NTP_SERVER "pool.ntp.org"
#define NTP_GMT_OFFSET_SEC -18000
#define NTP_DAYLIGHT_OFFSET_SEC 0
