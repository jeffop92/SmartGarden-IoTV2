#include "mqtt_client.h"
#include "../config/config.h"
// ==============================================================
// mqtt_client.cpp — MQTT client (stub for Phase 3)
// Full implementation deferred to Phase 4 (AWS IoT Core).
// TLS certificates, WiFiClientSecure and PubSubClient
// will be configured in that phase.
// ==============================================================
void mqtt_init() {
    // Stub — will be implemented in Phase 4
    Serial.println("[MQTT] Modulo MQTT pendiente (Fase 4 - AWS IoT Core).");
}
bool mqtt_publish(const char* topic, const char* payload) {
    // Stub — will be implemented in Phase 4
    (void)topic;
    (void)payload;
    return false;
}
void mqtt_maintain() {
    // Stub — will be implemented in Phase 4
}
bool mqtt_isConnected() {
    // Stub — will be implemented in Phase 4
    return false;
}