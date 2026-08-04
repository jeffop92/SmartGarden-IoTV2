# 1. Project Overview

SmartGarden-IoTV2 is an IoT-enabled environmental monitoring and automated irrigation system designed specifically for domestic horticultural crops. The project aims to provide home gardeners and small-scale cultivators with a reliable, resource-efficient, and easy-to-manage solution for sustaining plant health.

Developed within an academic thesis context, the project explores the integration of low-cost embedded systems, cloud computing, and real-time databases. It addresses the challenges of traditional manual plant watering—such as under-watering, over-watering, and lack of visibility into environmental conditions—by utilizing a localized microcontroller and a centralized real-time database to automate and monitor soil and climate parameters.

# 2. Project Scope

The boundaries of the SmartGarden-IoTV2 project are defined as follows:

### Included Features
* **Sensor Telemetry Data Collection**: Continuous measurement of ambient temperature, relative humidity, soil moisture, and soil pH levels.
* **Local Automated Control**: Autonomous activation and deactivation of a water pump based on predefined sensor thresholds on the microcontroller.
* **Remote Manual Control**: Ability to toggle manual control mode and force the water pump's state directly from a web application dashboard.
* **Real-time Synchronization**: Instant synchronization of telemetry data and command instructions between the microcontroller and the web dashboard using a centralized database.
* **Network Resilience**: Automatic detection of connection loss and periodic retry logic to restore WiFi connectivity without manual intervention.

### Excluded Features
* **Automated Chemical or pH Regulation**: The system is designed strictly to monitor pH levels, not to dispense neutralizing solutions.
* **Multi-zone/Multi-valve Management**: The system controls a single water pump/solenoid valve output and does not support independent scheduling for multiple zones.
* **Crop Classification or Automated Seeding/Harvesting**: The hardware is focused solely on environmental telemetry and irrigation.
* **Image Recognition or Disease Diagnostics**: The project does not include cameras or computer vision algorithms.
* **Enterprise Features**: The system does not include user authentication, multi-tenant workspace management, billing modules, inventory control, or supply chain integration.

> [!IMPORTANT]
> SmartGarden-IoTV2 is strictly a domestic IoT-based monitoring and irrigation controller. It is not an Enterprise Resource Planning (ERP) platform, nor is it a commercial agricultural management system.

# 3. System Objectives

The SmartGarden-IoTV2 system is designed around the following primary objectives:

* **Monitoring**: Provide constant visibility of environmental variables (air temperature and relative humidity) and soil status (pH and moisture content) to help users keep track of the cultivation conditions.
* **Automatic Irrigation**: Maintain plant hydration autonomously at the edge. When the capacitive soil moisture reading falls below a set threshold, the microcontroller automatically triggers the water pump, turning it off once soil moisture levels recover.
* **Manual Irrigation**: Offer a remote manual override capability through the web dashboard, giving the user direct control over the water pump's activation state regardless of the current sensor readings.
* **Historical Visualization**: Record telemetry data over time to allow users to view trends and analyze the environmental history of their crops.
* **Decision Support**: Present real-time and historical datasets in a clear, digestible format, enabling cultivators to make informed decisions regarding optimal watering thresholds, environmental positioning, and soil conditions.

# 4. Technologies

The following table summarizes the technological stack of the SmartGarden-IoTV2 project:

| Layer | Technology / Component | Purpose |
| :--- | :--- | :--- |
| **Firmware** | C/C++ (PlatformIO / Arduino Framework) | Microcontroller logic, sensor reading, and network request handling. |
| **Backend** | Firebase Realtime Database REST API | Serverless API endpoints for reading and writing device state. |
| **Database** | Firebase Realtime Database | Real-time JSON database for telemetry storage and control configurations. |
| **Frontend** | Next.js 15 (React 19, TypeScript) | Web dashboard for telemetry monitoring and manual control override. |
| **Protocols** | HTTPS (REST) | Secure communication protocol used for data transmission between the ESP32 and Firebase. |
| **Development Tools** | PlatformIO, Node.js / npm, Git | Environment for firmware compilation, dependency management, and source control. |

# 5. Final Architectural Decisions

The architecture of SmartGarden-IoTV2 is based on the following final engineering decisions:

* **Firebase Realtime Database as the Core Integration Layer**: The database acts as a single source of truth and communication medium. Telemetry is written directly to the database, and manual commands are fetched directly from it.
* **Direct HTTPS Communication**: The ESP32 utilizes direct HTTPS REST requests to send and receive data, avoiding the need for dedicated middle-tier APIs.
* **Local Edge Autonomy**: The automatic irrigation decision logic is executed directly on the ESP32 microcontroller rather than in the cloud. This guarantees that basic plant care functions continue normally even if WiFi connectivity is lost.
* **Passive Control Dashboard**: The web frontend serves exclusively as a monitoring and configuration control interface. It has no direct control over the physical relay and only signals intent by updating database fields.
* **No MQTT or AWS IoT Core**: The system functions entirely without MQTT broker infrastructures or AWS IoT Core subscriptions.

### Migration Note
The project was migrated from a legacy architecture that utilized AWS IoT Core, MQTT messaging, X.509 client certificates, AWS Lambda functions, and DynamoDB tables. Transitioning to Firebase Realtime Database simplified the firmware communication stack, removed certificate storage overhead on the ESP32, and provided out-of-the-box real-time updates for the dashboard.

# 6. Project Philosophy

The design and development of SmartGarden-IoTV2 are governed by the following core principles:

* **Local Autonomy**: Edge devices must remain self-reliant for critical operations. A loss of internet connection should never lead to crop failure; therefore, automatic threshold-based watering must run independently at the hardware level.
* **Cloud Synchronization**: Cloud integrations are used to mirror state and allow user override. Telemetry is updated periodically when online, and control signals are polled to synchronize local behaviors with user inputs.
* **Modularity**: Codebases for both firmware and frontend are divided into distinct, low-coupled modules (e.g., separating WiFi connectivity, sensor retrieval, database client calls, and irrigation algorithms) to improve maintainability and debugging efficiency.
* **Scalability**: The hierarchical data structures in the database allow for seamless expansion. Additional sensor nodes or control configurations can be added to the JSON tree without requiring changes to the core message processing architecture.
* **Separation of Responsibilities**: Each component has a singular purpose: the ESP32 manages physical sensors and actuators; the database stores states and coordinates updates; and the web dashboard presents data and collects user actions.

# 7. Current Project Status

The following list defines the implementation progress of the SmartGarden-IoTV2 system across its codebase:

### Implemented
* **WiFi Connectivity Management**: Solid reconnection loop logic on the ESP32.
* **Firebase HTTPS Client**: ESP32 REST communications to post telemetry and fetch control parameters.
* **Local Automatic Irrigation Logic**: Threshold evaluations and relay actuator controls on the ESP32.
* **Main Firmware Orchestration**: The scheduling loop in the microcontroller's entry point.
* **DHT22 Telemetry Retrieval**: Integration and reading of ambient temperature and relative humidity.
* **Raw Soil Moisture Reading**: Acquisition of raw ADC values from the capacitive sensor.
* **Frontend Project Setup**: Directory structure, Tailwind CSS configuration, and basic Next.js page routing structure.

### In Progress
* **Dashboard Interface Development**: Implementation of UI layouts and components to read real-time state from Firebase and write manual override controls.

### Planned
* **pH Sensor Calibration & Reading**: Transitioning from a static stub value to active reading and calculation of pH using calibration equations.
* **Soil Moisture ADC Calibration**: Scaling the raw ADC measurements to percentage ranges utilizing dry and wet calibration limits.
* **Historical Telemetry Logging**: Database indexing for historical data points and corresponding line chart visualizations on the frontend.
* **Cloud Frontend Deployment**: Hosting the Next.js web application on a public production cloud environment.
