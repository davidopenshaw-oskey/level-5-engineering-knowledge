# What's new in your next database copy: a briefing (2026-10-01)

Plain-language summary for explaining the T-130 work to the wiki team. The precise version, with every field name and count, is `2026-10-01-extraction-update-t130-swift-calls.md`. Hand them that file as the reference.

## The one-sentence version

The iOS app's code is now connected **method to method**: inside the app, and from the app into the shared Swift kits it uses. Your "which function runs when the user taps X?" questions can now be followed down to the kit method that does the work, and from there to the Firebase function it calls.

## What you asked for, and what you get

**1. "Link the app's methods to the kit methods they call."** Done.
- Before: the database only knew that the app *used a kit type* (for example, "this screen uses `OSKCKUserInvitesService`"), not *which method* it called.
- Now: a new link type, **`PACKAGE_METHOD_CALL`**, connects each app call to the exact kit method. There are 404 of them.
- Your test case works: tapping **Invite a guest**, then sending, reaches `OSKInviteGuestViewModel.sendUserInvitation`, which calls `OSKCKUserInvitesService.userSendInvitation` in the cloud kit.

**2. "Most in-app call links had no target."** Fixed, by adding new links alongside the old ones.
- The old links are still there, unchanged, so nothing you already rely on moved.
- New links that do have a target: about 1,280 inside the iOS app, plus the four kits (BLE, cloud, UI, WebRTC) and node-iot.
- From your test method, links with a target went from **1 to 5**; from the invite-guest screen, **2 to 9**.

## A worked example you can show them (Invite a guest)

| Step | From | To | Link |
|---|---|---|---|
| 1 | App: `OSKInviteGuestViewModel.sendUserInvitation` | Cloud kit: `OSKCKUserInvitesService.userSendInvitation` | `PACKAGE_METHOD_CALL` (new) |
| 2 | Cloud kit, the call inside that method (line 37) | Firebase function `user::createUserInvitation` | `HTTP_API_CALL` (already existed) |

The quick-code flow works the same way: `OSKPinCodeGenerationViewModel.generatePinCode` → `OSKCKPinCodeService.generatePinCode` → Firebase `core::createQuickcode`.

**Be upfront about one gap.** Step 1 lands on the kit method's *definition*. Step 2 starts from a *call inside* that method. The database has no link from "a method" to "the calls inside it" yet, so a single automatic graph walk stops between steps 1 and 2. The wiki can still join the two (both carry the same file and method name), and it's on our list to add the link.

## Things they should do or know

- **Take a fresh copy.** Nothing they cite changes: no fact IDs changed and every existing link is identical. Only additions.
- **Queries that filter on link type by name** need `PACKAGE_METHOD_CALL` added. `INTRA_REPO_CALL_DECLARED` now also covers Swift and node-iot.
- **Button actions are now attributable.** Most iOS calls (about 17,200 of 17,400) now record which view property or method they sit in, such as a SwiftUI `body`. Before, two-thirds had no caller name.
- **Data-quality note:** about a quarter of Swift "property" facts are really local variables inside functions. A new field, `propertyScope`, lets them filter to real type members.
- **Protocol targets:** some links point at a protocol's declared method rather than the class that implements it. Those are flagged (`memberTargetIsProtocolRequirement = true`).
- **Coming shortly (in progress):** call descriptions will also name the resolved target class and kit, so text search finds callers from the kit side. That changes the description text of about 2,300 Swift call facts. IDs stay the same.

## Not done yet (so they don't assume it is)

- The Android app (Kotlin) still has the old gap. It's next, using the same approach.
- The method → calls-inside-it link described above.
- Very heavily used components, e.g. the UI kit's `OSKUIExpanded`, called from 79 places, make graph walks large. We're designing how walks should handle them.
