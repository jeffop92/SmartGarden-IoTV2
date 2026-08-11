#include "firebase_client.h"
#include "../config/config.h"
#include <FirebaseESP32.h>
#include <time.h>

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

static String getLocalDateString() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 1000)) {
        return "";
    }
    char buffer[16];
    strftime(buffer, sizeof(buffer), "%Y-%m-%d", &timeinfo);
    return String(buffer);
}

bool firebase_publishReading(const SensorReading& reading, bool pumpIsOn) {
    if (!_firebaseReady) return false;
    if (!reading.valid) return false;
    
    // Reutilizar el mismo objeto FirebaseJson para ahorrar memoria
    FirebaseJson json;
    json.set("soilMoisture", reading.soilMoisturePercent);
    json.set("ph", reading.phValue);
    json.set("temperature", reading.airTemperatureC);
    json.set("humidity", reading.airHumidityPercent);
    json.set("pumpIsOn", pumpIsOn);
    json.set("timestamp", String(millis())); // Timestamp temporal basado en uptime
    
    bool currentSuccess = false;
    bool historySuccess = false;
    
    // Operación 1: Actualizar lectura actual en /smartgarden/sensors/current
    if (Firebase.setJSON(fbdo, "/smartgarden/sensors/current", json)) {
        currentSuccess = true;
    } else {
        Serial.print("[Firebase] Error al enviar lectura actual: ");
        Serial.println(fbdo.errorReason());
    }
    
    // Operación 2: Añadir registro histórico en /smartgarden/history/YYYY-MM-DD/
    String dateStr = getLocalDateString();
    if (dateStr.length() > 0) {
        String historyPath = "/smartgarden/history/" + dateStr;
        if (Firebase.pushJSON(fbdo, historyPath.c_str(), json)) {
            historySuccess = true;
        } else {
            Serial.print("[Firebase] Error al enviar lectura historica: ");
            Serial.println(fbdo.errorReason());
        }
    } else {
        Serial.println("[Firebase] Error: NTP no sincronizado. Omitiendo almacenamiento historico.");
    }
    
    // Advertencias si falla alguna de las operaciones de manera independiente
    if (currentSuccess && !historySuccess) {
        Serial.println("[Firebase] ADVERTENCIA: Actualizacion de lectura actual exitosa pero fallo el almacenamiento historico.");
    } else if (!currentSuccess && historySuccess) {
        Serial.println("[Firebase] ADVERTENCIA: Almacenamiento historico exitoso pero fallo la actualizacion de lectura actual.");
    }
    
    return currentSuccess && historySuccess;
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
