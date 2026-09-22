**Title**: Letting a resident edit a guest invitation they already sent, from the iOS app through to the accesses sent to the door

**Context**: A resident who has invited a guest through the iOS app wants to change the invitation
afterwards (for example its dates) without deleting it and creating a new one. An invitation
carries access rights, so a change to it can matter for the access that is created from it and
sent onward to the building's door device. This PRD covers what exists today, end to end: how
guest invitations are created, listed, shown and deleted from the iOS screens; through the iOS
cloud SDK the app uses to talk to the backend; to the cloud backend functions those calls reach;
how the access created from an invitation is produced and published; and how the Node-IoT
middleware receives those accesses. The scope is to identify every real place in these
codebases that this change would touch, and to say plainly which of the needed pieces already
exist and which do not, so nothing is missed and nothing is invented.

**In-scope platforms**:
- iOS app (resident-facing)
  <!-- repo: ios-oskey-dev -->
  <!-- modules: iOS App -->
  <!-- directive: check where guest invitations are created, listed, shown and deleted in the UI, and which SDK calls those screens make; check whether any screen can already change an existing invitation -->
- iOS cloud SDK (the Swift package the iOS app uses to call the backend)
  <!-- repo: swift-cloud-kit-oskey-dev -->
  <!-- modules: OSKCloudKit -->
  <!-- directive: check how the guest-invitation service builds and sends its calls to the backend, and which backend invitation functions it does and does not call today -->
- Cloud backend
  <!-- repo: firebase-oskey-dev -->
  <!-- modules: user, core -->
  <!-- directive: check the real backend functions that create, list, edit, cancel, accept and delete user invitations and what each accepts and returns; check how an accepted invitation becomes an access and how that access is published onward -->
- Node-IoT (the middleware between the cloud and the Intercom)
  <!-- repo: node-iot-api-oskey-io -->
  <!-- modules: access_control_device -->
  <!-- directive: check how the accesses published by the backend are received, stored and served onward to the Intercom -->

**Explicitly out of scope**:
- Invitations from the "Mon Foyer" (my household) flow, which adds other residents or permanent
  guests to a unit (the unit invitations). Only the guest invitation a resident sends is in scope.
- The Intercom repository and its behaviour, the Android apps, and the Angular web portal.
- Push notifications and e-mail wording.

**Known constraints**:
- Nothing may be assumed about what an invitation can carry or how it can be changed beyond what
  the code shows. If the code shows no way to do something, say so plainly rather than inventing it.

**Acceptance criteria**:
- [ ] Every real place in the iOS app where a guest invitation is created, listed, shown or deleted is identified.
- [ ] The iOS cloud SDK service and the backend function each of those iOS actions ends up calling are identified, so the path UI → SDK → backend is traced for each existing guest-invitation action.
- [ ] The findings say whether the backend already has a function for changing an existing invitation, what it accepts, and whether the iOS SDK or the iOS app already calls it.
- [ ] The path from an accepted invitation to the access that is published, and on to how Node-IoT receives it, is traced with the real function and route names.
- [ ] The findings note which pieces of an "edit invitation" flow already exist and which would need real new code in each identified location, including whether an already-published access would need to be updated.
