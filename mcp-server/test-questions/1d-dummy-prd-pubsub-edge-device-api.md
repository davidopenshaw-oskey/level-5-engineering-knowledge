**Title**: New pubsub-routed API for pushing commands to edge devices

**Context**: We need a new API that lets the cloud backend push a new type of command down
to the physical Intercom edge devices via Pub/Sub, routed through the Node-IoT middleware.
This should reuse/extend the existing pubsub event-routing pattern already used for other
device commands, not invent a new transport mechanism. The scope is to identify the real,
existing pubsub routing path end to end (cloud → Node-IoT → device) so a new command type can
be added consistently with what's already there.

**In-scope platforms**:
- Cloud backend
  <!-- repo: firebase-oskey-dev -->
  <!-- modules: access_control_device -->
  <!-- directive: check the real existing pubsub publish path for device commands -->
- Node-iot, the middleware platform between cloud and Intercom
  <!-- repo: node-iot-api-oskey-io -->
  <!-- modules: access_control_device -->
  <!-- directive: check how pubsub messages are received and routed on to the device -->
- Android Intercom (physical building access device)
  <!-- repo: android-intercom-oskey-io -->
  <!-- modules: app -->
  <!-- directive: check how the device receives and acts on a routed command -->

**Acceptance criteria**:
- [ ] The real, existing end-to-end pubsub command path (cloud → Node-IoT → device) is
      identified, with the real topic/route names involved.
- [ ] Any place the new command type would need to plug into this existing pattern is noted.
