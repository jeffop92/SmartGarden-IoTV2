# PROJECT_MEMORY — SmartGarden-IoTV2 (Firebase Migration)

> Single source of truth. Updated at every phase.

---

## Goal

Migrar el sistema de monitoreo y control de riego en tiempo real de AWS IoT Core a Firebase Realtime Database para cultivos hortícolas domésticos (Tesis).
El sistema lee la humedad del suelo, pH y datos ambientales (DHT22), envía los datos a Firebase mediante HTTPS, permite el control del riego manual desde un Dashboard y mantiene el control automático en el ESP32.

---

## Arquitectura (Nueva)

```text
ESP32 (Firmware)
  ├── Sensor Capacitivo Humedad del Suelo
  ├── Sensor de pH (PH-4502C)
  ├── Sensor DHT22 (Temperatura y Humedad)
  └── Relé (Bomba/Electroválvula)
        ↓ WiFi / HTTPS
        
Firebase Realtime Database
        ↑
        ↓
Dashboard Web (Next.js 15)
        ↓
Usuario (Navegador)
```

---

## Technologies

| Layer      | Stack                                    |
|------------|------------------------------------------|
| Firmware   | C/C++ · PlatformIO · Arduino framework   |
| Protocol   | HTTPS (REST)                             |
| Database   | Firebase Realtime Database               |
| Frontend   | Next.js 15 · React 19 · TypeScript       |


**Eliminado:** AWS IoT Core, MQTT, PubSubClient, Certificados X.509, AWS Lambda, DynamoDB.

---

## Folder Structure

```
SmartGarden-IoTV2/
├── firmware/           # ESP32 source code (PlatformIO project)
│   ├── src/            # Main .cpp files: sensors, WiFi, firebase_client, controller, irrigation
│   ├── include/        # Shared header files
│   ├── lib/            # Vendored libraries (Firebase ESP32 Client, ArduinoJson)
│   └── config/         # config.h (Firebase credentials, WiFi)
├── dashboard/          # Next.js 15 frontend
├── docs/               # Diagrams, schematics, hardware photos
├── scripts/            # Utility scripts
├── .gitignore
└── PROJECT_MEMORY.md   # this file
```

---

## Auditoría y Módulos Reutilizables

Tras analizar la base del proyecto existente en `firmware/`:
- **Reutilizables:**
  - `main.cpp`: Lógica principal y bucle (`loop`). Se adaptará a Firebase y a la nueva lógica de riego.
  - `wifi_manager.cpp` / `.h`: Totalmente reutilizable (gestión de conexión WiFi).
  - `sensors.cpp` / `.h`: Lecturas del DHT22 y configuración inicial del ADC. Se debe completar con la lógica de calibración.
  - `config.h`: Constantes, pines, tiempos. Se quitarán los datos de AWS MQTT y se pondrán los de Firebase.
- **Para Eliminar:**
  - `aws_certs.cpp` / `.h`: No se usarán certificados X.509.
  - `mqtt_client.cpp` / `.h`: Se reemplazará por HTTPS hacia Firebase.
  - Dependencia `knolleary/PubSubClient` en `platformio.ini`.
- **Nuevos Módulos (Propuestos):**
  - `firebase_client.cpp` / `.h`: Para gestionar los POST/PUT/GET a Firebase Realtime Database usando la librería oficial de Firebase para ESP32 de mobizt.
  - `irrigation.cpp` / `.h`: Para alojar la lógica del control automático del riego y el control del relé.

---

## Plan de Trabajo Paso a Paso

1. **Paso 1:** Auditoría inicial y actualización de la documentación (`PROJECT_MEMORY.md`). (Completado)
2. **Paso 2:** Limpieza del proyecto (Eliminar AWS/MQTT, actualizar `platformio.ini`, limpiar `config.h`).
3. **Paso 3:** Implementación del cliente de Firebase (`firebase_client.cpp/.h`).
4. **Paso 4:** Implementación de la lógica de riego (`irrigation.cpp/.h`).
5. **Paso 5:** Integración final en `main.cpp` (Sensores -> Lógica -> Firebase).
6. **Paso 6:** Pruebas y validación del Firmware.
7. **Paso 7:** Desarrollo del Dashboard Web conectado a Firebase.
