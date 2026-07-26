#pragma once
#include <Arduino.h>
// ==============================================================
// mqtt_client.h — MQTT publishing to AWS IoT Core
// (Implementation deferred to Phase 4 — AWS IoT Core)
// ==============================================================
/**
 * @brief Initialize the MQTT client and TLS configuration.
 *        Certificates are loaded from SPIFFS or flash.
 *        Call after wifi_init().
 */
void mqtt_init();
/**
 * @brief Publish a sensor reading payload to the MQTT broker.
 *
 * @param topic   MQTT topic string
 * @param payload JSON payload string
 * @return true   if published successfully
 */
bool mqtt_publish(const char* topic, const char* payload);
/**
 * @brief Maintain the MQTT connection (reconnect if dropped).
 *        Call this periodically from the main loop.
 */
void mqtt_maintain();
/**
 * @brief Returns true if currently connected to the MQTT broker.
 */
bool mqtt_isConnected();