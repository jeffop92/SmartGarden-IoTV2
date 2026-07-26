# PROJECT_MEMORY — SmartGarden-IoTV2

> Single source of truth. Updated at every phase.

---

## Goal

Build an IoT monitoring system for a domestic vegetable garden.
The system reads soil moisture and pH data from physical sensors,
ships it to the cloud, and displays it on a web dashboard in real time.

---

## Architecture

```
ESP32 (Firmware)
  ├── Capacitive Soil Moisture Sensor
  └── PH-4502C Sensor
      ↓  WiFi / MQTT
AWS IoT Core
      ↓  Rule → Lambda trigger
AWS Lambda  (data processing / validation)
      ↓
Amazon DynamoDB  (time-series readings)
      ↓  REST / WebSocket
Next.js 15 Dashboard  (user-facing, in Spanish)
      ↓
User (browser)
```

---

## Technologies

| Layer      | Stack                                    |
|------------|------------------------------------------|
| Firmware   | C/C++ · PlatformIO · Arduino framework   |
| Protocol   | MQTT (TLS) · AWS IoT Core                |
| Processing | AWS Lambda (Node.js or Python)           |
| Database   | Amazon DynamoDB                          |
| Frontend   | Next.js 15 · React 19 · TypeScript · Tailwind CSS |
| DevOps     | Git · GitHub · GitHub Actions            |

**Forbidden:** Firebase, Docker, Kubernetes, Cognito, API Gateway, ECS, EC2, MongoDB, PostgreSQL, MySQL.

---

## Folder Structure

```
SmartGarden-IoTV2/
├── firmware/           # ESP32 source code (PlatformIO project)
│   ├── src/            # Main .cpp files: sensors, WiFi, MQTT
│   ├── include/        # Shared header files and constants
│   ├── lib/            # Vendored third-party libraries
│   └── config/         # Secrets & certs (gitignored)
├── cloud/              # AWS serverless resources
│   ├── lambda/         # Lambda function code
│   ├── iot-policies/   # AWS IoT Core JSON policies
│   └── dynamodb/       # Table schemas and query scripts
├── dashboard/          # Next.js 15 frontend (all UI in Spanish)
├── docs/               # Diagrams, schematics, hardware photos
│   ├── diagrams/
│   └── hardware/
├── scripts/            # Utility scripts (deploy, MQTT test, seed)
├── .github/
│   └── workflows/      # GitHub Actions CI/CD (future phases)
├── .gitignore
└── PROJECT_MEMORY.md   # this file
```

---

## Current Phase

**Phase 1 — Project Setup** COMPLETE

---

## Completed Work

- [x] Designed and created folder structure
- [x] Created `.gitignore` (secrets, certs, build artifacts excluded)
- [x] Created `PROJECT_MEMORY.md`
- [x] Initialized Git repository with initial commit

---

## Pending Work

- [ ] Phase 2 — Firmware: ESP32 sensor reading + MQTT publish
- [ ] Phase 3 — AWS IoT Core: thing, certificates, policy
- [ ] Phase 4 — AWS Lambda: ingest & write to DynamoDB
- [ ] Phase 5 — DynamoDB: table design
- [ ] Phase 6 — Next.js Dashboard: real-time data display
- [ ] Phase 7 — GitHub Actions: CI/CD pipeline

---

## Important Technical Decisions

| Decision | Rationale |
|---|---|
| PlatformIO over Arduino IDE | Better dependency management, CLI-friendly, CI-compatible |
| MQTT over HTTP | Lower latency, lower power consumption on ESP32 |
| DynamoDB single-table design | Cost-efficient, serverless-native, no SQL overhead |
| Next.js 15 App Router | Server Components reduce client bundle, built-in TypeScript |
| All UI text in Spanish | University project requirement |
