#include "wifi_manager.h"
#include <WiFi.h>
#include "../config/config.h"
// ==============================================================
// wifi_manager.cpp — WiFi connection management
// ==============================================================
// --------------- Private state --------------------------------
static bool _connected = false;
// --------------- Public functions -----------------------------
void wifi_init() {
    Serial.println("[WiFi] Iniciando conexion...");
    Serial.print("[WiFi] SSID: ");
    Serial.println(WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES) {
        delay(WIFI_RECONNECT_DELAY_MS);
        retries++;
        Serial.print("[WiFi] Intento ");
        Serial.print(retries);
        Serial.print("/");
        Serial.println(WIFI_MAX_RETRIES);
    }
    if (WiFi.status() == WL_CONNECTED) {
        _connected = true;
        Serial.println("[WiFi] Conectado exitosamente.");
        Serial.print("[WiFi] Direccion IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("[WiFi] RSSI: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
    } else {
        _connected = false;
        Serial.println("[WiFi] ERROR: No se pudo conectar. Verificar credenciales.");
    }
}
void wifi_maintain() {
    if (WiFi.status() != WL_CONNECTED) {
        if (_connected) {
            // Just lost connection
            _connected = false;
            Serial.println("[WiFi] Conexion perdida. Reconectando...");
        }
        WiFi.reconnect();
    } else {
        _connected = true;
    }
}
bool wifi_isConnected() {
    return WiFi.status() == WL_CONNECTED;
}