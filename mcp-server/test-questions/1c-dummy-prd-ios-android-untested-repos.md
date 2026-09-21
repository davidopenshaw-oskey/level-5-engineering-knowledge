**Title**: Adding the ownerNonResident inhabitantType — mobile app and physical Intercom device

**Context**: Following on from the ownerNonResident inhabitantType work already scoped for the Property Manager web portal and Cloud backend, this PRD covers how the same new inhabitantType should be represented and handled on the iOS app and the physical Android Intercom device. The scope of this PRD is to identify all real places in these two codebases where inhabitantType (or the existing tenant/owner/resident values) is read, displayed, or used to make an access decision, so a new ownerNonResident value can be added without breaking existing behavior.

**In-scope platforms**:
- iOS app
  <!-- repo: ios-oskey-dev -->
  <!-- modules: iOS App -->
  <!-- directive: check where inhabitantType (or tenant/owner/resident) is read, displayed, or used to gate a feature -->
- Android Intercom (physical building access device)
  <!-- repo: android-intercom-oskey-io -->
  <!-- modules: app -->
  <!-- directive: check how the Intercom Directory / access-decision logic uses inhabitantType today -->

**Explicitly out of scope**:
- Property Manager web portal and Cloud backend — already covered by a separate PRD.
- Real-time signalling/call-routing layer between the Intercom device and resident apps.

**Known constraints**:
- ownerNonResident must NOT receive "Mon Foyer" features — this exclusion already applies
  today and must be preserved.

**Acceptance criteria**:
- [ ] Every real place in the iOS app that reads or displays inhabitantType is identified.
- [ ] Every real place in the Android Intercom app's access-decision logic that reads
      inhabitantType (or a specific value like tenant/owner) is identified.
- [ ] The findings note whether adding ownerNonResident as a new value is a safe, additive
      change in each identified location, or would require real code changes.
