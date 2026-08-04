#include "firebase_client.h"
#include "../config/config.h"
#include <FirebaseESP32.h>

// ==============================================================
// firebase_client.cpp — Comunicación con Firebase RTDB
// ==============================================================

// Instancias de Firebase
static FirebaseData fbdo;
static FirebaseAuth auth;
static FirebaseConfig config;

static bool _firebaseReady = false;

void firebase_init() {
    Serial.println("[Firebase] Configurando cliente...");
    
    // Configurar Host y Autenticación (Secreto de Base de Datos / Legacy Token)
    config.database_url = FIREBASE_HOST;
    config.signer.tokens.legacy_token = FIREBASE_AUTH;
    
    // Optimizar buffers para el ESP32
    fbdo.setBSSLBufferSize(1024, 1024);
    fbdo.setResponseSize(1024);
    
    // Inicializar Firebase
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);
    
    _firebaseReady = true;
    Serial.println("[Firebase] Inicialización completa.");
}

bool firebase_publishReading(const SensorReading& reading, bool pumpIsOn) {
    if (!_firebaseReady) return false;
    if (!reading.valid) return false;
    
    FirebaseJson json;
    json.set("soilMoisture", reading.soilMoisturePercent);
    json.set("ph", reading.phValue);
    json.set("temperature", reading.airTemperatureC);
    json.set("humidity", reading.airHumidityPercent);
    json.set("pumpIsOn", pumpIsOn);
    json.set("timestamp", String(millis())); // Timestamp temporal basado en uptime
    
    // Ruta en RTDB: /smartgarden/sensors/current
    if (Firebase.setJSON(fbdo, "/smartgarden/sensors/current", json)) {
        return true;
    } else {
        Serial.print("[Firebase] Error al enviar lectura: ");
        Serial.println(fbdo.errorReason());
        return false;
    }
}

bool firebase_getManualControlState(bool &isManual, bool &pumpState) {
    if (!_firebaseReady) return false;
    
    // Leemos el nodo de control en una sola petición para evitar bloqueos
    // Ruta: /smartgarden/control
    // Estructura esperada: { "isManual": true, "pumpState": false }
    
    if (Firebase.getJSON(fbdo, "/smartgarden/control")) {
        FirebaseJson &json = fbdo.jsonObject();
        FirebaseJsonData jsonData;
        
        json.get(jsonData, "isManual");
        if (jsonData.success) {
            isManual = jsonData.boolValue;
        }
        
        json.get(jsonData, "pumpState");
        if (jsonData.success) {
            pumpState = jsonData.boolValue;
        }
        
        return true;
    } else {
        // Fallará silenciosamente si no hay conexión o si el nodo no existe en Firebase
        return false;
    }
}
