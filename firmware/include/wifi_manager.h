#pragma once
#include <Arduino.h>
// ==============================================================
// wifi_manager.h — WiFi connection management
// ==============================================================
/**
 * @brief Initialize and connect to WiFi network.
 *        Uses credentials from config/config.h.
 *        Blocks until connected or max retries exceeded.
 */
void wifi_init();
/**
 * @brief Check connection and reconnect if dropped.
 *        Call this periodically from the main loop.
 */
void wifi_maintain();
/**
 * @brief Returns true if the ESP32 is currently connected to WiFi.
 */
bool wifi_isConnected();
