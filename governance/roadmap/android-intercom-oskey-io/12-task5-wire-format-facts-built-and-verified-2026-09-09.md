# Task 5 — Domain-Specific "Wire Format" Facts Built and Verified

**Status: DONE, 2026-09-09.** Three new fact types added to `01-extract-ast-evidence.ts`, each spot-checked against real, known-correct data before being called done.

## Real, first finding that changed the scope: WebRTC event names needed no new fact type at all

`01-standing-principles-...md` anticipated WebRTC signaling event/message-type names as one of three wire-format candidates. Checked directly: `OSKSignalingEvents` (the real enum holding all 24 event names + their real string values) is **already fully captured by Task 4's generic enum extraction** — full member list, full constructor-arg string values, no gap. No separate fact type was built for this. The real, genuinely new value turned out to be one level down: the actual call **sites** where a specific event gets listened for or emitted — the direct analog to the TS pipeline's own proven `firestore_path_touched` win (a generic fact existed; resolving the real touch point is what mattered for retrieval).

## What got built

**1. `ast-ble-gatt-constants.json`** — every `val NAME: UUID = UUID.fromString("...")` found structurally (no hardcoded module/file name), classified into `service`/`characteristic`/`descriptor`/`unknown` from the real, observed naming convention (`GATT_SERVICE_*`/`GATT_CHAR_*`/`GATT_CCC_*`). 22 real constants found, matching a manual count of `kotlin-ble-kit-oskey-io/OSKUUIDTable.kt` exactly.

**2. `ast-usb-wire-constants.json`** — every `const val` whose initializer is a `hex_literal`, including the real trailing inline comment where present. Spot-checked `DEVICE_OPEN_DOOR_COMMAND: Byte = 0x01 // open door command` — correctly extracted `hexValue: "0x01"`, `declaredType: "Byte"`, `comment: "open door command"`. These comments are the *only* place in the codebase that states what a given byte value physically does (opens the door, controls the motor, etc.) — real, otherwise-unrecoverable business meaning, worth the extra effort to capture.

**3. `ast-webrtc-signaling-touchpoints.json`** — real call sites of `.on(...)`/`.emit(...)` on a socket, with direction, the resolved event expression, and caller context.

## Real bug found and fixed: `.emit` is genuinely ambiguous in this codebase

An unfiltered first version found 67 "emitter" touchpoints. Before trusting that number, checked it directly: **Kotlin Coroutines' `Flow.emit()`** (an unrelated, purely in-process mechanism — `signalingState.emit(SignalingState.ConnectSuccess)`) uses the exact same method name as socket.io's real wire-protocol send. A direct repo-wide grep found **exactly one** real `socketIO?.emit(...)` call in the entire codebase — the other 66 matches were Flow emissions with zero relationship to the wire protocol.

`.on` has no such ambiguity (Kotlin Coroutines has no `.on()` method) and was left unfiltered. For `.emit` specifically, fixed by requiring the real, verified receiver-naming convention (contains `"socket"`, case-insensitive) — checked against the actual single real case before trusting it, not assumed. Final, verified result: 1 real emitter, 13 real listeners (down from an unfiltered 80), every one of the 14 spot-checked and correct.

## The general lesson, worth carrying into Task 6 and beyond

A structurally-detected pattern (matching on method name alone) can be real and precise for one direction (`.on`) and badly ambiguous for another (`.emit`) in the exact same codebase, for a reason with nothing to do with tree-sitter or Kotlin's grammar — it's a real naming collision between two unrelated real APIs (socket.io and Kotlin Coroutines) that happen to share a common English verb as a method name. Worth checking for the same shape of ambiguity in USB/BLE naming too before assuming those two fact types are equally clean (both were checked and found precise this time, but that was verified, not assumed).
