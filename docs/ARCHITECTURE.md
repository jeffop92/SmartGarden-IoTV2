# 1. Architecture Overview

SmartGarden-IoTV2 is a decentralized, IoT-enabled automation and monitoring platform designed for domestic crops. The system is split into three main parts: edge hardware, cloud middleware, and the presentation layer. These components interact to balance local autonomy with remote visibility:

* **Edge Hardware (ESP32 & Sensors/Relay)**: Reads local climate and soil conditions, executes local threshold-based irrigation logic, and toggles the physical water valve or pump. It functions autonomously at the edge and updates its status to the cloud.
* **Cloud Platform (Firebase Realtime Database)**: Acts as the central coordination database. It stores the live telemetry, logs the current controller mode (automatic vs. manual), and acts as a configuration interface.
* **Presentation Layer (Next.js Dashboard & Browser)**: Displays live telemetry and provides manual control options for the user. It reads and writes database nodes to change the system mode and trigger the pump.

# 2. High-Level Architecture Diagram

The ASCII diagram below illustrates the communication channels and data flow directions among the system components:

```text
 +-----------------------------------------------------------------------+
 |                           Perception Layer                            |
 |                                                                       |
 |   [ Sensors ]  ======(Readings)=====>  [ ESP32 ]                      |
 |   (DHT22, pH, Soil)                       ║                           |
 |                                           ║ (GPIO Output)             |
 |                                           ▼                           |
 |                                       [ Relay ]                       |
 |                                      (Water Pump)                     |
 +-------------------------------------------║---------------------------+
                                             ║
                                           (WiFi)
                                             ║
                                             ▼
 +-----------------------------------------------------------------------+
 |                             Network Layer                             |
 |                                                                       |
 |                              [ WiFi / HTTPS ]                         |
 +--------------------------------------║--------------------------------+
                                        ║
                                     (HTTPS)
                                        ║
                                        ▼
 +-----------------------------------------------------------------------+
 |                              Cloud Layer                              |
 |                                                                       |
 |                  [ Firebase Realtime Database (RTDB) ]                |
 |                                   ▲                                   |
 |                                   │ (Integrates with)                 |
 |                                   ▼                                   |
 |                  [ Firebase Authentication (Planned) ]                |
 +-----------------------------------▲-----------------------------------+
                                     │
                                  (HTTPS)
                                     │
                                     ▼
 +-----------------------------------------------------------------------+
 |                           Application Layer                           |
 |                                                                       |
 |                       [ Dashboard (Next.js) ]                         |
 |                                   ▲                                   |
 |                                   │ (HTTP / CSS / JS)                 |
 |                                   ▼                                   |
 |                             [ Web Browser ]                           |
 |                                   ▲                                   |
 |                                   │ (User Interactions)               |
 |                                   ▼                                   |
 |                       [ Authenticated User (Planned) ]                |
 +-----------------------------------------------------------------------+
```

# 3. Architectural Layers

The architecture is divided into four distinct layers, each handling specific tasks:

| Layer | Component Focus | Key Responsibilities |
| :--- | :--- | :--- |
| **Perception Layer** | Microcontroller, sensors, and actuators | Handles physical analog/digital input sampling, parses sensor data, and drives electrical signals to trigger relays. |
| **Network Layer** | WiFi connection and HTTPS requests | Manages wireless local connection maintenance, handles reconnections, and packages payloads into secure network requests. |
| **Cloud Layer** | Firebase Realtime Database and Auth | Maintains system state data, handles client query routing, and provides basic authorization filtering. |
| **Application Layer** | Next.js Dashboard, Browser runtime | Renders data visualizations, handles user login interfaces, and publishes manual control override configurations. |

# 4. Components

### ESP32
* **Purpose**: Serves as the central processing unit and controller at the edge.
* **Responsibilities**: Executes local automatic irrigation logic, periodically reads environmental and soil metrics, maintains WiFi connections, and handles database REST synchronization.
* **Inputs**: Digital and analog sensor values, HTTPS response payloads from the cloud database configuration node.
* **Outputs**: Logical output voltages to the pump relay, HTTPS request payloads containing telemetry.

### Sensors
* **Purpose**: Measure the chemical and physical environment of the crop.
* **Responsibilities**: Convert temperature, air humidity, soil moisture, and soil pH into digital or analog signals for the microcontroller.
* **Inputs**: Physical environmental parameters (heat, moisture, acidity).
* **Outputs**: Electrical signals (analog voltage levels and digital data packets).

### Relay
* **Purpose**: Switch electrical power to the physical water pump.
* **Responsibilities**: Connect or isolate the water pump power supply circuit based on the control signal from the microcontroller.
* **Inputs**: Logic control signal (HIGH/LOW voltage) from the microcontroller.
* **Outputs**: Electrical current path to the physical pump.

### Firebase Realtime Database
* **Purpose**: Coordinates system state and coordinates client interactions.
* **Responsibilities**: Stores the latest sensor readings, keeps track of manual control instructions, and updates all active clients immediately.
* **Inputs**: HTTPS GET, PUT, and POST requests from the microcontroller and the dashboard.
* **Outputs**: Telemetry and control status JSON documents.

### Firebase Authentication *(Planned / Not Implemented)*
* **Purpose**: Protect the user interface from unauthorized access.
* **Responsibilities**: Authenticates login requests, generates access tokens, and restricts dashboard configuration interactions to validated accounts.
* **Inputs**: Login credentials (email/password) provided through the user interface.
* **Outputs**: Authentication tokens and authorization validation.

### Dashboard
* **Purpose**: Provides a frontend user interface for system supervision.
* **Responsibilities**: Renders telemetry graphs, provides toggle buttons to manage irrigation modes, and exchanges data with Firebase.
* **Inputs**: Database telemetry datasets, user mouse and keyboard events.
* **Outputs**: Document Object Model (DOM) elements, database writes to control configuration nodes.

### Browser
* **Purpose**: Serves as the runtime platform for the Dashboard.
* **Responsibilities**: Executes frontend scripts, handles page layout styling, manages network cookies, and establishes secure connections.
* **Inputs**: HTML, CSS, JavaScript, and asset files.
* **Outputs**: Visual interface displayed on the user's screen, network traffic.

# 5. Communication Flow

### Telemetry Reading Lifecycle
1. **Acquisition**: The microcontroller reads analog pins (soil moisture and pH) and parses digital signals from the climate sensor.
2. **Local Processing**: Raw values are digitized and packaged into a sensor data payload.
3. **Data Publication**: The microcontroller opens a secure socket, formats an HTTPS request containing the telemetry payload in JSON format, and sends it to the database.
4. **Cloud Updates**: The database registers the request, overwrites the current telemetry node, and notifies active listeners.
5. **Dashboard Retrieval**: The dashboard web app queries the database node via HTTPS.
6. **Rendering**: The browser updates the user interface display with the new temperature, humidity, moisture, and pH levels.

### Manual Irrigation Command Flow
1. **User Action**: The user toggles the manual control mode or changes the water pump switch on the web interface.
2. **Command Update**: The dashboard writes the state change JSON payload directly to the control node in the database.
3. **Command Storage**: The database registers the update and saves the command values.
4. **Firmware Polling**: The microcontroller periodically queries the database control node via an HTTPS GET request.
5. **Actuator Execution**: The microcontroller reads the response. If manual override is enabled, the firmware bypasses the automatic moisture threshold check and drives the relay to match the database command state.

# 6. Separation of Responsibilities

Each system component is designed with strict functional boundaries.

### ESP32 Firmware
* **CAN**: Read analog/digital pins, execute edge logic, write to GPIO pins, reconnect to WiFi, and make HTTPS requests.
* **MUST NEVER**: Manage user account credentials, direct web traffic, store long-term database tables, or host administrative user interfaces.

### Sensors
* **CAN**: Sense physical metrics and output corresponding electrical signals.
* **MUST NEVER**: Control relays, open direct network connections, or run control automation algorithms.

### Relay
* **CAN**: Open or close the electrical supply line to the pump.
* **MUST NEVER**: Calculate thresholds, process data, or communicate with the network.

### Firebase Realtime Database
* **CAN**: Store system state data, authorize operations based on validation rules, and push state updates to database clients.
* **MUST NEVER**: Toggle GPIO lines directly, compile device binaries, or manage local edge controller loops.

### Firebase Authentication *(Planned / Not Implemented)*
* **CAN**: Verify user identities and sign authentication tokens.
* **MUST NEVER**: Manage irrigation control logic, store sensor readings, or communicate with the hardware relay.

### Dashboard
* **CAN**: Visualize sensor metrics, trigger manual command writes, and handle user navigation.
* **MUST NEVER**: Direct physical hardware pins without going through the database, or execute real-time protection safety algorithms for hardware.

### Browser
* **CAN**: Render UI elements, execute client-side scripts, and execute HTTPS requests.
* **MUST NEVER**: Control hardware actuators directly, or bypass secure network protocols.

# 7. Reliability Strategy

SmartGarden-IoTV2 relies on edge autonomy to protect plants during service outages.

* **WiFi Connection Loss**: The microcontroller continuously runs its local loop. The network manager handles reconnect attempts. While disconnected, automatic threshold irrigation operates normally at the edge, using the last-known moisture values and configurations. Telemetry publishing is suspended until connection is restored.
* **Firebase Database Outage**: The microcontroller catches HTTPS request failures and logs them. Automatic irrigation is unaffected because the automatic loop is processed locally at the edge. The dashboard will indicate a database connection failure.
* **Dashboard App Closed**: The system state continues to synchronize normally. The microcontroller publishes telemetry and checks database command nodes. If a manual pump action was left active, the microcontroller continues to execute that action until the dashboard is reopened and updated, or until a hardware limit is reached.

# 8. Security Overview

The security model of the current implementation focuses on protocol encryption, database rules, and credential isolation:

* **HTTPS Encryption**: All communications (microcontroller to database, dashboard to database, browser to dashboard) are encrypted using Transport Layer Security (TLS), preventing third-party eavesdropping.
* **Firebase Authentication *(Planned / Not Implemented)***: Intended to secure the dashboard and database from unauthorized configuration overrides.
* **Database Rules**: Access rules restrict read and write permissions to specific database paths. The microcontroller authenticates using a database secret token, while future client authentication will validate dashboard users.
* **Firmware Credentials**: WiFi details and the database secret are stored in a dedicated local configuration file on the developer's machine and compiled directly into the binary. These credentials are never stored in public version control repositories.

# 9. Repository Structure

The project directory is structured into distinct folders, dividing responsibilities as follows:

* `firmware/`: PlatformIO project containing the C++ codebase for the ESP32 (including sensors, WiFi manager, irrigation logic, and Firebase client configurations).
* `dashboard/`: Next.js 15 frontend application for user data visualization and manual toggle inputs.
* `cloud/`: Contains legacy AWS resources (AWS Lambda scripts, DynamoDB schemas, and IoT policies) from the pre-migration architecture.
* `docs/`: Holds project-related documents, hardware documentation, and architectural records.
* `scripts/`: Holds utility and helper scripts for environment setup or automated checks.
