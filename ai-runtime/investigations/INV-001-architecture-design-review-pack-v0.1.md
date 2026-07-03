# Architecture Design Review Pack

**Version:** 0.1 (Draft)

**Classification:** Architecture Review Candidate

---

## 1. Review Objectives

The primary objectives of this architectural review are to:

-   Validate the conceptual soundness of the major architectural patterns, including data ownership, orchestration, and hardware synchronization strategies.
-   Assess the clarity and robustness of the defined system boundaries and responsibilities.
-   Challenge the assumptions made regarding data consistency, security enforcement, and event-driven workflows.
-   Evaluate the potential architectural risks related to coupling, complexity, and reliance on placeholder components.

---

## 2. Executive Architecture Summary

The Oskey platform is a cloud-native physical access control system designed for multi-tenant residential and commercial properties. The backend architecture is composed of modular, domain-oriented microservices running as serverless functions on Google Cloud Platform.

The system's design separates authoritative business data, which is stored in a primary cloud database, from read-optimized or hardware-specific data projections. This separation allows for a secure and scalable architecture where client-facing applications (mobile apps, administrative portals) and physical hardware devices interact with data models tailored to their specific needs.

A key architectural pattern is the use of orchestration services to manage complex, multi-step business processes, such as provisioning or revoking physical access. Changes to authoritative data trigger event-driven workflows that ensure consistency across the platform, including the asynchronous synchronization of credentials to physical hardware at building entry points. This event-driven approach decouples the core business logic from the real-time status of edge devices.

The platform enforces a clear separation between privileged administrative functions and runtime operational functions, with a robust Role-Based Access Control (RBAC) system governing access to capabilities.

---

## 3. Major Architectural Concepts

-   **Hierarchical Scoping:** The system models the real world through a strict data hierarchy (Organization > Entity > Property > Building > Unit). This structure is fundamental to tenancy, data isolation, and the application of scoped policies.

-   **Authoritative Source with Denormalized Projections:** The architecture maintains a single source of truth for core business entities (like users and buildings). This data is then denormalized into various read-optimized "projections" or "ledgers" to support specific, high-performance query patterns for different consumers (e.g., a user's view of their access rights vs. a building's view of all access).

-   **Orchestration Services:** Complex, multi-step business processes that span multiple domains (e.g., granting a user access to a building) are managed by dedicated orchestration services. These services act as coordinators, ensuring that all necessary steps (creating credentials, updating ledgers, notifying hardware) are executed in the correct order.

-   **Event-Driven Hardware Synchronization:** The core backend does not communicate directly with physical hardware. Instead, it publishes "intent" messages (e.g., "grant access," "revoke access") to a messaging bus. A separate, decoupled infrastructure layer consumes these messages and is responsible for synchronizing the state with the physical devices. This makes the core platform resilient to hardware connectivity issues.

-   **Separation of Administrative and Operational Planes:** The system provides two distinct functional planes: a privileged administrative plane for managing the platform's structure and tenancy, and an operational plane for handling real-time user and device interactions like making intercom calls or managing unit inhabitants.

---

## 4. Conceptual Architecture Layers

The backend services can be conceptually grouped into several distinct layers:

-   **Core Infrastructure Services:** Provides foundational, cross-cutting capabilities such as database abstractions, asynchronous task scheduling, and centralized user communications (email, SMS, push notifications).

-   **Identity & Configuration Services:** Manages user identity, authentication provider integration, and the platform-wide catalog of roles and permissions (RBAC).

-   **Domain Data Services:** A layer of services that are the authoritative owners for the primary business entities, such as Organizations, Buildings, Users, and third-party Suppliers.

-   **Workflow Orchestration Services:** A critical layer containing services that coordinate complex business processes across the different domain services. This includes the central Access Orchestration service and services for managing the lifecycle of people within a residential unit.

-   **Privileged Administrative Services:** A high-privilege, cross-cutting layer that provides a secure API surface for wide-scope administrative and data maintenance tasks, intended for use only by trusted internal operators.

---

## 5. System Responsibilities

-   **Identity System:** Responsible for managing user profiles, authentication, and user-centric data such as registered devices and notification preferences.

-   **Tenancy & Asset System:** Responsible for modeling the physical and logical hierarchy of the managed properties, from the top-level customer organization down to individual buildings and units.

-   **Access Orchestration System:** The central authority for provisioning and revoking physical access credentials. It ensures that when access is granted or removed, the change is consistently reflected across all relevant data ledgers and is synchronized with physical hardware.

-   **Hardware Management System:** Responsible for maintaining the backend representation of physical access control devices, including their configuration and cryptographic keys.

-   **Real-Time Communications System:** Responsible for orchestrating real-time call sessions initiated from physical intercom devices to residents' mobile applications.

-   **Administrative System:** Provides a secure, high-privilege interface for platform operators to perform wide-ranging administrative and data maintenance tasks.

---

## 6. Architectural Decisions

-   **Data Model:** The choice to use a primary authoritative data store (Firestore) with denormalized, read-optimized projections (in both Firestore and MongoDB) prioritizes read performance and consumer-specific data shapes over write simplicity.
-   **Orchestration:** The decision to centralize complex, multi-domain workflows into dedicated orchestration services suggests a preference for explicit, manageable business logic over scattered, implicit interactions.
-   **Hardware Integration:** The use of an event-driven, asynchronous model for hardware synchronization (via Pub/Sub) indicates a design choice that prioritizes resilience and decoupling of the core application from the state of edge devices.
-   **Security:** The separation of administrative and operational planes, coupled with a granular RBAC system, reflects a security-first approach to system capabilities.

---

## 7. Architectural Assumptions

-   It is assumed that a separate, non-evidenced service layer consumes messages from the Pub/Sub bus to project access control data into the hardware-facing MongoDB database.
-   It is assumed that a standard, shared mechanism (e.g., a gateway or middleware) is used to authenticate and authorize incoming API requests before they reach the individual service logic.
-   It is assumed that the data repair and synchronization functions within the administrative system are sufficient to manage any potential data consistency issues arising from the denormalization strategy.

---

## 8. Review Tasks

-   **Challenge Data Consistency:** Review the strategy for maintaining consistency between the authoritative data sources and their denormalized projections. Assess the risks of data drift and the robustness of the repair mechanisms.
-   **Validate Orchestration Atomicity:** Examine the multi-step orchestration workflows (e.g., access revocation). Challenge the atomicity of these operations and the strategy for compensation or rollback in case of partial failure.
-   **Review Authorization Enforcement:** Scrutinize the authorization model. Assess the clarity and auditability of how granular RBAC permissions are enforced at the API entry points versus within the business logic.
-   **Evaluate System Coupling:** Analyze the dependencies between the conceptual systems. Identify any tight coupling that could hinder independent development, deployment, or scalability.

---

## 9. Open Questions

1.  How is authentication and authorization enforced at the entry points of the serverless functions? Is there a shared middleware or gateway pattern, and how is it audited?
2.  What is the strategy for ensuring and monitoring the consistency of data between the authoritative Firestore collections and the denormalized projections, especially the hardware-facing MongoDB database?
3.  Given the cascading nature of deletion operations (e.g., removing a user revokes access, deletes pincodes, and updates hardware), what mechanisms are in place to ensure these multi-step transactions are atomic or safely compensatable in case of partial failure?
4.  What is the security model for the privileged administrative functions? What safeguards, beyond RBAC, are in place to prevent misuse and what level of audit logging is performed for these operations?
5.  What is the detailed architecture for the real-time media signaling and gateway layer that supports intercom calls? What are its scalability and reliability characteristics?

---

## 10. Evidence Strength

-   **Architectural Layers & System Responsibilities:** High confidence. The modular decomposition is strongly evidenced by the 12 distinct engineering profiles.
-   **Data Ownership & Orchestration:** High confidence. The patterns of authoritative sources, denormalized projections, and orchestration services are clearly and repeatedly evidenced across multiple modules and supporting architecture documents.
-   **Hardware Synchronization:** Medium confidence. The publishing of events from the core backend is confirmed. However, the consumption and processing of these events by the hardware-facing infrastructure is inferred from architecture documents, not from direct engineering evidence.
-   **Authorization Enforcement:** Medium confidence. The existence of a granular RBAC catalog is confirmed, but the precise mechanism for enforcing these permissions at API boundaries is not fully detailed in the provided evidence.

---

## 11. Traceability

-   The understanding of **Identity, Tenancy, and Asset Management** is primarily derived from the `user`, `organization`, `building`, `supplier`, and `settings` module profiles.
-   The **Access Orchestration** model is derived from the `core`, `unit_management`, and `admin` module profiles, supported by the `OSkey Backend Services & Data Architecture.md` document.
-   The **Hardware Integration and Real-Time Communication** concepts are derived from the `access_control_device`, `call`, and `tasks` module profiles, with significant context from the `Oskey Architecture.md` document.
-   The **Data Projection and Synchronization** strategy is a synthesis of evidence from nearly all modules, with the `core`, `admin`, and `call` modules providing the clearest examples of fan-out and the architecture documents confirming the use of MongoDB as a projection target.