# 1. Purpose

This document establishes the permanent development guidelines and engineering rules for the SmartGarden-IoTV2 project. The objective is to ensure that the repository remains clean, modular, resilient, and structurally consistent throughout its lifecycle.

These rules are strict, mandatory, and must be followed by every contributor to this project, including software developers, hardware integration engineers, and AI coding assistants. No code modifications, library updates, or configuration changes may bypass these standards.

# 2. Development Workflow

All contributions to the SmartGarden-IoTV2 project must follow the structured workflow outlined below. The implementation of code changes must never begin before obtaining explicit user approval.

| Phase | Name | Objectives | Required Output / Prerequisite |
| :--- | :--- | :--- | :--- |
| **1** | **Audit** | Review the existing codebase, configuration files, and documentation to understand current implementations. | Complete understanding of related components and dependencies. |
| **2** | **Proposal** | Design the logical approach for the task, identifying affected components and potential architectural impacts. | Structured list of proposed changes. |
| **3** | **Explanation** | Explain the proposed approach, documenting the rationale, risks, and alternatives. | Written explanation presented to the user. |
| **4** | **User Approval** | Review the proposal with the user to ensure it aligns with expectations and requirements. | **Explicit user sign-off** before any code modification. |
| **5** | **Implementation** | Write, refactor, or integrate the approved code changes according to the standards. | Complete, clean code satisfying the approved scope. |
| **6** | **Verification** | Test and validate the functionality on target hardware or simulators and verify system integration. | Test execution logs, walkthrough files, and validation proof. |

# 3. Repository Rules

To prevent code degradation, developers must respect the project's folder layout and system boundaries:

* **Preserve Modular Architecture**: Keep firmware files and dashboard pages decoupled. Components must interact exclusively through database states.
* **Reuse Existing Code**: Check for helper functions and definitions in config profiles, sensor interfaces, and library wrappers before adding new code.
* **Avoid Duplicate Functionality**: Do not write redundant utility functions. For example, use the existing network reconnection wrapper rather than implementing custom reconnect loops.
* **Keep Responsibilities Separated**: Embedded firmware handles hardware readings and direct controls. The database stores states. The dashboard handles user presentations and manual triggers.
* **Maintain Folder Organization**:
  * Firmware code must reside in `firmware/`.
  * Frontend dashboard pages and components must reside in `dashboard/`.
  * Legacy assets remain in `cloud/`.
  * Documentation belongs in `docs/`.

# 4. Architecture Protection Rules

The following core architectural boundaries must never be breached:

* **No AWS IoT Core**: Do not reintroduce AWS IoT Core packages, endpoints, or policies.
* **No MQTT Protocol**: The firmware must communicate using HTTPS REST calls. Do not install MQTT client libraries or use Publish/Subscribe message brokers.
* **No Firebase Realtime Database Replacements**: Firebase Realtime Database (RTDB) remains the central synchronization service. Do not substitute it with other cloud databases.
* **Preserve Local Edge Autonomy**: All automatic irrigation decision-making must run on the ESP32. Do not move irrigation decision logic to the cloud database or the dashboard application.
* **Preserve Interface Decoupling**: The web dashboard must remain a passive supervisor. It must never command the hardware relay directly or bypass the Firebase database nodes.

# 5. Coding Standards

To ensure the codebase remains maintainable, all contributors must apply these programming rules:

* **Readability and Maintainability**: Prioritize clean, expressive code over clever optimization. Use clear comments to explain the purpose of non-obvious configurations or math formulas.
* **Consistent Naming**: Follow standard conventions. In the firmware, use snake_case or camelCase consistently depending on the module pattern. In the frontend, use standard React/TypeScript camelCase and PascalCase guidelines.
* **Small, Reusable Modules**: Break down large functions into smaller, single-purpose routines. Do not bundle unconnected logic into the main orchestration file.
* **Public Function Documentation**: Document all public functions, headers, and endpoints. Explain their purpose, inputs, outputs, and any expected preconditions.
* **Complexity Minimization**: Avoid deep conditional nesting, redundant loops, and unneeded external library installations. Rely on standard embedded and frontend libraries.

# 6. Documentation Rules

Maintaining an accurate record of the project structure is critical. Any architectural, hardware, or database schema modifications must be updated in the following documents whenever applicable:

* `PROJECT_MEMORY.md`: The central status document. Update it to reflect major phase completions, migration milestones, and current development steps.
* `docs/PROJECT_CONTEXT.md`: The project definition document. Update it to reflect changes in project scope, system objectives, or technologies.
* `docs/ARCHITECTURE.md`: The design document. Update it to reflect changes in components, data transmission patterns, or reliability strategies.

Documentation updates must be completed alongside the corresponding code implementation to prevent documentation drift.

# 7. Testing Rules

Every contribution must be verified before completion. Developers must prove that their changes do not break existing operations:

* **Local Verification**: Firmware updates must compile cleanly without warnings using PlatformIO, and the dashboard must build without errors.
* **Interface Testing**: Verify database operations. Ensure the ESP32 successfully posts telemetry nodes and retrieves manual commands under various simulated network conditions.
* **Expected Validation Process**:
  1. Verify the code compiles locally.
  2. Deploy and run the system.
  3. Validate real-time communications by checking logs on the microcontroller serial interface and verifying values in the database console.
  4. Document the verification steps and outcomes in a walkthrough log.

# 8. Change Management

All changes to the core system architecture must be handled systematically:

* **Documentation Precedence**: For major changes (such as database path restructures or new hardware integrations), the project memory and architectural documentation must be updated and approved *before* implementation starts.
* **Incremental Commits**: Commit changes in logical, modular units. Do not bundle unrelated updates into a single code commit.
* **Restoration and Safety**: When modifying critical routines (like connection management or actuator safety loops), ensure backup logic exists to prevent system lockups or hardware damage.

# 9. AI Assistant Guidelines

AI coding assistants must adhere to the following rules to ensure safe and accurate repository interactions:

* **Read First**: Always read the existing documentation (`PROJECT_MEMORY.md`, `docs/PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md`, and `docs/DEVELOPMENT_RULES.md`) before analyzing code or writing proposals.
* **No Architectural Assumptions**: Rely strictly on documented configurations. Never assume that external brokers, third-party authentication packages, or databases are available unless explicitly stated.
* **No Feature Invention**: Implement only the features requested in the task. Do not add speculative code, placeholders, or auxiliary features.
* **Justify Refactoring**: Do not delete or rename existing code files or modules without explaining the logical necessity to the user.
* **Explain Before Writing**: Provide a clear, high-level summary of proposed code modifications before applying changes.
* **Wait for Approval**: Always wait for explicit user approval before using file-modification tools or running compilation and upload scripts.
