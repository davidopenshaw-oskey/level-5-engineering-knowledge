**Title**: Adding the nonOnwerResident inhabitantType

**Context**: Currently the PGO supports adding a tenant or owner as a person living in a buildings unit by the Property Manager. We need a new inhabitantType in the Oskey system. The name of the new inhabitantType will be ownerNonResident. The scope of this PRD is to cover all aspects of adding a new inhabitantType for the ownerNonResident without breaking the existing flows around inhabitantType. 


**In-scope platforms**:
- Property Manager web portal
  <!-- repo: angular-app-oskey-io -->
  <!-- modules: features -->
  <!-- directive: manages the building units, onboarding owners, tenants and now ownerNonResidents -->
- Cloud backend
  <!-- repo: firebase-oskey-dev -->
  <!-- modules: core -->
  <!-- directive: building, users, organization, core, unit_management modules are the primary areas to consider-->

**Explicitly out of scope**:
- Real-time signalling/call-routing layer between the Intercom device and resident apps —
  deferred to a later phase.
- Android app, which is not yet onboarded.

**Planned follow-on work (next phase, not in this release)**:
- Linking a unit to a nonOwnerResident in the PGO.
- Fixing the onboarding flows to ensure nonOwnerResident gets the right accesses.
- iOS and Android: a whole new section for nonOwnerResidents to manage LLD and LCD tenants.
- Allowing an ownerNonResident to be added to the INtercom Directory when they do not currently have LLD or LCD tenants inhabiting the unit.

**Known constraints**:
- ownerNonResident must NOT receive "Mon Foyer" features — this exclusion already applies
  today and must be preserved.


**Acceptance criteria**:
- [ ] ownerNonResident can be added as an inhabitantType by the Property Manager without
      breaking existing tenant/owner/resident flows.
- [ ] ownerNonResident does not receive Mon Foyer features.
- [ ] ownerNonResident can receive accesses to the building in future releases downstream work
- [ ] The ownerNonResident data model must not preclude the planned follow-on work above
      (linking a unit to a nonOwnerResident, onboarding-flow access fixes, iOS/Android LLD/LCD
      management, INtercom Directory) — this task should not require rework once those phases begin.
