#pragma once
// ==============================================================
// SmartGarden-IoTV2 — Central Configuration
// IMPORTANT: Do NOT commit real credentials to version control.
//            Copy this file and fill in values locally,
//            or use firmware/config/secrets.h (gitignored).
// ==============================================================
// ----------------------------------------------------------
// WiFi
// ----------------------------------------------------------
#define WIFI_SSID "Celerity_Palacio"
#define WIFI_PASSWORD "1104184674@"
// Reconnection settings
#define WIFI_RECONNECT_DELAY_MS 5000 // ms between reconnect attempts
#define WIFI_MAX_RETRIES 10          // max attempts before reboot
// ----------------------------------------------------------
// Firebase Realtime Database
// ----------------------------------------------------------
#define FIREBASE_HOST "https://smart-garden-60bf2-default-rtdb.firebaseio.com/"
#define FIREBASE_AUTH "ZfWknAl30lfHZsG8tMjWdslCFk31WbUzfthEL0hQ"
// ----------------------------------------------------------
// Sensor GPIO Pins  (ESP32 ADC1 — use GPIO 32-39 for analog)
// ----------------------------------------------------------
#define PIN_SOIL_MOISTURE 32 // ADC1_CH6 — Capacitive soil moisture sensor
#define PIN_PH_SENSOR 35     // ADC1_CH7 — PH-4502C analog output
#define PIN_DHT 4
#define DHT_TYPE DHT22
// ----------------------------------------------------------
// Sensor Reading Intervals
// ----------------------------------------------------------
#define READING_INTERVAL_MS 20000 // Read sensors every 20 seconds
#define PUBLISH_INTERVAL_MS 60000 // Publish MQTT every 60 seconds
// ----------------------------------------------------------
// Soil Moisture Calibration
// Raw ADC values from capacitive sensor (12-bit, 0-4095)
// Dry:  value measured in open air
// Wet:  value measured fully submerged
// ----------------------------------------------------------
#define SOIL_ADC_DRY 4095
#define SOIL_ADC_WET 2126
// ----------------------------------------------------------
// pH Calibration (PH-4502C)
// The module outputs 0-5V mapped to pH 0-14.
// ESP32 ADC reads 0-3.3V → use voltage divider or level-shift.
// pH = (ADC_VOLTAGE - OFFSET) / SLOPE
// ----------------------------------------------------------
#define PH_CALIBRATION_SLOPE -5.70f  // Adjust after calibration
#define PH_CALIBRATION_OFFSET 21.34f // Adjust after calibration
#define PH_SAMPLES 10                // Averaged readings per measurement
// ----------------------------------------------------------
// System
// ----------------------------------------------------------
#define SERIAL_BAUD_RATE 115200
#define DEVICE_NAME "SmartGarden-ESP32-01"

// ----------------------------------------------------------
// Irrigation / L298N
// ----------------------------------------------------------

// L298N IN1 controla la bomba.
// IN2 está conectado físicamente a GND.
// GPIO 23 = HIGH (~3.3 V) -> bomba ON
// GPIO 23 = LOW (0 V)    -> bomba OFF
#define PIN_L298N_IN1 23

#define MOISTURE_THRESHOLD 30.0f

// ----------------------------------------------------------
// LCD 16x2 I2C
// ----------------------------------------------------------
#define PIN_LCD_SDA 21
#define PIN_LCD_SCL 22

// ----------------------------------------------------------
// Water level sensor
// ----------------------------------------------------------
#define PIN_WATER_LEVEL 16

// ----------------------------------------------------------
// Status LED
// ----------------------------------------------------------
#define PIN_STATUS_LED 15

// ----------------------------------------------------------
// NTP Settings (for historical path YYYY-MM-DD)
// ----------------------------------------------------------
#define NTP_SERVER "pool.ntp.org"
#define NTP_GMT_OFFSET_SEC -18000 // -5 hours for GMT-5
#define NTP_DAYLIGHT_OFFSET_SEC 0
