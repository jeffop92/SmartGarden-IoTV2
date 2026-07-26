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
#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"
// Reconnection settings
#define WIFI_RECONNECT_DELAY_MS   5000   // ms between reconnect attempts
#define WIFI_MAX_RETRIES          10     // max attempts before reboot
// ----------------------------------------------------------
// MQTT / AWS IoT Core
// (Will be completed in Phase 4 — AWS IoT Core integration)
// ----------------------------------------------------------
#define MQTT_BROKER_HOST   "YOUR_AWS_IOT_ENDPOINT.iot.us-east-1.amazonaws.com"
#define MQTT_BROKER_PORT   8883          // TLS port
#define MQTT_CLIENT_ID     "smartgarden-esp32-01"
#define MQTT_TOPIC_PUBLISH "smartgarden/sensors/readings"
#define MQTT_TOPIC_STATUS  "smartgarden/sensors/status"
#define MQTT_KEEPALIVE_S   60            // seconds
// ----------------------------------------------------------
// Sensor GPIO Pins  (ESP32 ADC1 — use GPIO 32-39 for analog)
// ----------------------------------------------------------
#define PIN_SOIL_MOISTURE  34   // ADC1_CH6 — Capacitive soil moisture sensor
#define PIN_PH_SENSOR      35   // ADC1_CH7 — PH-4502C analog output
// ----------------------------------------------------------
// Sensor Reading Intervals
// ----------------------------------------------------------
#define READING_INTERVAL_MS   30000  // Read sensors every 30 seconds
#define PUBLISH_INTERVAL_MS   60000  // Publish MQTT every 60 seconds
// ----------------------------------------------------------
// Soil Moisture Calibration
// Raw ADC values from capacitive sensor (12-bit, 0-4095)
// Dry:  value measured in open air
// Wet:  value measured fully submerged
// ----------------------------------------------------------
#define SOIL_ADC_DRY    2800   // Calibrate with your sensor
#define SOIL_ADC_WET     900   // Calibrate with your sensor
// ----------------------------------------------------------
// pH Calibration (PH-4502C)
// The module outputs 0-5V mapped to pH 0-14.
// ESP32 ADC reads 0-3.3V → use voltage divider or level-shift.
// pH = (ADC_VOLTAGE - OFFSET) / SLOPE
// ----------------------------------------------------------
#define PH_CALIBRATION_SLOPE    -5.70f   // Adjust after calibration
#define PH_CALIBRATION_OFFSET   21.34f  // Adjust after calibration
#define PH_SAMPLES              10      // Averaged readings per measurement
// ----------------------------------------------------------
// System
// ----------------------------------------------------------
#define SERIAL_BAUD_RATE   115200
#define DEVICE_NAME        "SmartGarden-ESP32-01"