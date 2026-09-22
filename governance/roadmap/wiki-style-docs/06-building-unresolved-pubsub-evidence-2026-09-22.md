# Building unresolved Pub/Sub edge evidence

## Scope and provenance

This bounded, read-only check examined only the four unresolved
`PUBSUB_TOPIC_BINDING` edges incident to `firebase-oskey-dev` / `building` and
the supplied staging configuration export. Reproducible SQL is
`building-unresolved-pubsub-evidence.sql`.

The database sources are current facts from run `20260911_080454-00e1d9fd`,
commit `00e1d9fd568fab1bdcd1ad81e76b40d6b38ad4a3`, extracted **2026-09-11
08:06:19 UTC**. All four graph edges were generated **2026-09-21 17:29:15
UTC**. The independently supplied staging export (`staging-oskey-io`) was
extracted **2026-09-21 06:50:31 UTC** using read-only `gcloud` listing.

## Per-edge evidence

| Edge | Available database endpoint evidence | Configuration comparison | Remaining uncertainty |
|---:|---|---|---|
| 53785 | Source fact resolves: `building_intercom` external hook at `building_intercom.controller.ts:62`, expression `{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}`. Target repo is `unknown`; target fact reference is null. Edge says topic resolution is `partial`. | The staging export **verifiably contains** topic `accessControlDevice_intercomEntries`, subscription of the same name, and a push delivery to `/v1/access-control-devices/pubsub/intercom-entries` on the Node IoT staging service (dead-letter topic `dead_letters`). This is a name-level candidate match to the environment-variable expression. | The export does not reveal the environment variable's value or establish that this source invocation publishes to that topic; it also supplies no database target fact. Do not treat the config binding as a resolved graph edge. |
| 53786 | Source fact resolves: `building_intercom_message_publisher.service.ts:24`, external hook expression `intercomDoc.accessControlDeviceId`. Target repo/ref are `unknown`/null. Topic resolution is `unsupported`. | No matching configuration can be identified: this expression is an access-control-device ID, not a topic name. | Publisher/topic selection and consumer are unestablished; missing database target fact reference remains. |
| 53787 | Source fact resolves: same service at line 56, expression `intercomDoc.accessControlDeviceId`; target repo/ref absent; resolution `unsupported`. | No identifiable configuration match for the same reason. | Same uncertainty as 53786; the two distinct call sites must not be collapsed merely because their expressions match. |
| 53788 | Source fact resolves: same service at line 64, expression `intercomId`; target repo/ref absent; resolution `unsupported`. | No identifiable configuration match: `intercomId` is not a configured topic name. | Publisher/topic selection and consumer are unestablished; missing database target fact reference remains. |

## Interpretation

The staging file verifies a **configuration relationship** for its explicit
topic, subscription, and delivery endpoint. It does not fill any missing
`cross_repo_edges` fact reference, and it cannot by itself prove a runtime
connection from a database source fact to that binding. In particular, the
first edge is a plausible naming match, not a database-resolved endpoint; the
other three have no topic-level match in the inspected export.

No production configuration, source code, architecture documents, recursive
graph expansion, or database mutation was used. The remaining gap is runtime
or extraction evidence that maps each source expression/call to a concrete
topic and endpoint fact.
