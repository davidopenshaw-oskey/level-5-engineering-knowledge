# Oskeky firestore architecture

**version:** 2.0.0
**location:** level-5 phases 1, 2

© [Year] Oskey SAS. All rights reserved

**What changed from v1, 2026-09-05:** v1 (retired, kept for history — see its own retirement note) mixed two genuinely different kinds of content: durable architectural principles (this file, unchanged in substance) and a collection-by-collection, method-by-method narrative of what the code does (removed here). That narrative was machine-generated from older prompts, has not been regenerated since, and duplicates — less reliably and less currently — what Phase 1's own facts and call-graph already capture directly from the real source (see `governance/roadmap/facts-serving-strategy/14-inbound-outbound-surface-graph-tasklist.md` task 4 for the graph that now answers "what does this call, what does it read/write" deterministically). This file keeps only the content Phase 1 can never produce on its own: the *why* behind the design, not the *what* of the current implementation. A v3 covering the removed ground is intended once the real regeneration pipeline (post-merge, post-rejoin-check scripts) exists — not yet built.

This document is a companion document to `Oskey Architecture.md`. Its objective is to state the durable design principles behind Oskey's data architecture — why Firestore, MongoDB, and Pub/Sub each exist and what role each plays — not to enumerate current collections, fields, or methods, which drift with the code and are better answered by the live facts index and call-graph.

## Glossary

- PGO, the Oskey Property Manager Portal, used by Property Managers
- PM, the Property Manager. A user of the PGO
- Oskey users, Oskey App users. These users use the Oskey app to access buildings, share invitations and quickcodes ( if they are residents )
- non app users, non-app users, similar to oskey users, but they have no app downloaded. they can be created by a PM or a residentAdmin

## Data Storage Philosophy, Design and Principles

Within Firestore, OSkey adopts the principles of Least Privilege and Client-Scoped Data Isolation (Security-First Design).

Data duplication within Firestore is intentional. Rather than representing redundant storage, duplicated documents provide security boundaries and isolated views optimised for specific consumers.

For example, OSkey Mobile App users interact only with data contained within their authorised /users hierarchy. They never directly access organisation, property or other tenant-owned collections.

Firestore therefore represents the authoritative business data store for the platform.

### Firestore as the System of Record

Firestore is the authoritative source for business entities including:

organisations
buildings
units
users
suppliers
invitations
access configuration
business workflows

Business services perform validation and orchestration against Firestore before any downstream systems are updated.

### MongoDB as the Hardware Projection Store

MongoDB is not a second system of record.

Instead, it acts as a projection database optimised for hardware communication.

Access Controllers (ACDs), intercoms and other edge devices require a denormalised, hardware-friendly representation of access information.

Relevant Firestore changes are transformed into hardware projections and synchronised into MongoDB.

Hardware therefore consumes projections rather than authoritative business data.

### Pub/Sub as the Synchronisation Backbone

OSkey uses Pub/Sub to decouple business workflows from downstream processing.

Business events generated from Firestore updates may publish messages for asynchronous processing.

Consumers may include:

hardware synchronisation
activity aggregation
notification processing
audit updates
projection generation

This architecture allows business operations to complete independently of hardware or background processing.

### Edge Device Activity Flow

OSkey also supports a reverse data flow from physical Access Control Devices back into the platform.

When an ACD processes an entry event, such as a PIN attempt, SecureBLE unlock, rejected access, door event, call event or supplier/non-app-user activity, the device sends the activity event to the hardware-facing backend.

These events are first handled by the edge/middleware layer and are then processed back into Firestore as business-visible activity records.

This reverse flow allows OSkey to maintain auditability and operational visibility without allowing edge devices to write directly into Firestore.

Activity events may be written into consumer-specific Firestore views, such as:

- user activity records
- supplier staff activity records
- non-app-user activity records
- building activity records
- activity aggregates
- audit or reporting projections

This preserves the same architectural principle used elsewhere in the platform:

Edge devices produce activity signals.

Middleware validates and processes those signals.

Firestore stores the business-visible activity record.

Client applications consume only authorised activity views.

### Architectural Principle

Firestore owns business truth.

Pub/Sub transports business and synchronisation events.

MongoDB serves hardware projections and hardware-facing exchange.

Edge devices do not write directly to Firestore.

Activity flows from edge devices back through the middleware layer before becoming authorised Firestore activity records.

No downstream projection becomes authoritative.
