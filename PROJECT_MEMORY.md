# PROJECT_MEMORY — SmartGarden-IoTV2

> Single source of truth. Updated at every phase.

---

## Goal

Build an IoT monitoring system for a domestic vegetable garden.
The system reads soil moisture and pH data from physical sensors,
ships it to the cloud, and displays it on a web dashboard in real time.

---

## Architecture

```text
ESP32 (Firmware)
  ├── Capacitive Soil Moisture Sensor
  └── PH-4502C Sensor
        ↓ WiFi / MQTT

AWS IoT Core
        ↓

AWS Lambda (Data Processing & Validation)
        ↓

Amazon DynamoDB (Sensor Readings)

        ↑
AWS Lambda (Data Query API)
        ↑

Next.js 15 Dashboard (User Interface - Spanish)
        ↓

User (Browser)
```

---

## Technologies

| Layer      | Stack                                    |
|------------|------------------------------------------|
| Firmware   | C/C++ · PlatformIO · Arduino framework   |
| Protocol   | MQTT (TLS) · AWS IoT Core                |
| Processing | AWS Lambda                                   |
| Database   | Amazon DynamoDB                          |
| Frontend   | Next.js 15 · React 19 · TypeScript · Tailwind CSS |


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
├── dashboard/          # Next.js 15 frontend (Next.js App Router)
│   ├── src/
│   │   ├── app/        # App Router: layout, pages, global CSS
│   │   ├── components/ # Reusable React components
│   │   │   ├── ui/     # Atomic UI elements
│   │   │   └── layout/ # Header, footer, navigation
│   │   ├── lib/        # Utility functions and helpers
│   │   └── types/      # TypeScript type definitions
│   ├── public/         # Static assets
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── .prettierrc
│   └── package.json
├── docs/               # Diagrams, schematics, hardware photos
│   ├── diagrams/
│   └── hardware/
├── scripts/            # Utility scripts (deploy, MQTT test, seed)
├── .gitignore
└── PROJECT_MEMORY.md   # this file
```

---

## Current Phase

**Phase 2 — Next.js Dashboard Setup** COMPLETE

---

## Completed Work

**Phase 1 — Project Setup**
- [x] Designed and created folder structure
- [x] Created `.gitignore` (secrets, certs, build artifacts excluded)
- [x] Created `PROJECT_MEMORY.md`
- [x] Initialized Git repository with initial commit

**Phase 2 — Next.js Dashboard Setup**
- [x] Scaffolded Next.js 15.5 with React 19, TypeScript, Tailwind CSS 4, ESLint
- [x] Installed and configured Prettier + prettier-plugin-tailwindcss
- [x] Created App Router folder structure (components/ui, components/layout, lib, types)
- [x] Written minimal root layout with Spanish locale and SEO metadata
- [x] Written temporary home page: "SmartGarden IoT v2" + "Proyecto en construcción"
- [x] Verified production build compiles without errors (`✓ Compiled successfully`)

---

## Pending Work

- [ ] Phase 3 — Firmware: ESP32 sensor reading + MQTT publish
- [ ] Phase 4 — AWS IoT Core: thing, certificates, policy
- [ ] Phase 5 — AWS Lambda: ingest & write to DynamoDB
- [ ] Phase 6 — DynamoDB: table design
- [ ] Phase 7 — Next.js Dashboard: real-time data display

---

## Important Technical Decisions

| Decision | Rationale |
|---|---|
| PlatformIO over Arduino IDE | Better dependency management, CLI-friendly, CI-compatible |
| MQTT over HTTP | Lower latency, lower power consumption on ESP32 |
| DynamoDB single-table design | Cost-efficient, serverless-native, no SQL overhead |
| Next.js 15 App Router | Server Components reduce client bundle, built-in TypeScript |
| Tailwind CSS v4 | New CSS-first config, zero JS config file, faster builds |
| prettier-plugin-tailwindcss | Enforces consistent class ordering automatically |
| All UI text in Spanish | University project requirement |
