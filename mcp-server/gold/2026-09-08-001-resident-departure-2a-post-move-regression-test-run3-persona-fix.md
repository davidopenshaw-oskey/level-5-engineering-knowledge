# Agent PRD — resident-departure-2a-post-move-regression-test-run3-persona-fix

## MetaData

**Status:** Test run — atomic-prd-agent proof of concept<br>
**Persona:** `atomic-prd-agent` (governance/roadmap/mcp-direction/atomic-prd-agent-skills.md)<br>
**Model:** gemini-3.5-flash (Vertex AI, test-ai-oskey-io/global)<br>
**Snapshot freshness:** evidence below reflects:<br>
• <a id="cite-repo-1"></a>angular-app-oskey-io @ 2026-09-02 ([R1](#repo-1))<br>
• <a id="cite-repo-2"></a>firebase-oskey-dev @ 2026-09-02 ([R2](#repo-2))<br>
• <a id="cite-repo-3"></a>node-iot-api-oskey-io @ 2026-09-02 ([R3](#repo-3))<br>
**Tool calls made:** search_facts: 26, walk_cluster: 4, get_graph_neighbors: 1<br>
**Turns used:** 32 of 100<br>
**Run duration:** 2m 58s<br>
**Token usage:** 107,700 input, 2,356 output, 7,328 thinking, 98,235 cached (117,384 total)<br>
**Approx. document cost:** <a id="cite-cost"></a>[$0.1161](#cost-detail)

---

## Business Request

In the PGO there is a residents profile card. On this card we would like to add a departure date.

This represents a date and time in the future for when a resident is going to leave the building - eg: end of rental contract.

When the date is triggered, the system needs to remove the accesses for this resident to the specific building and all doors the resident has access to.

On completion, next to the departure date, a field/label should display the date & time confirming when the system removed the access.

Within the Oskey landscape, there is already a schedule tasks facility.

The accesses must be removed from the edge devices (intercoms, digicoms, where applicable).

The corpus currently supports generating a PRD for this work from the PGO, thru cloud and node-iot.

The corpus cannot provide the PRD for the edge devices, but can suggest the work needed up to and the return from the node-iot repo.

---

## User Stories

- As a Property Manager, I want set a departure date and time for a resident on their profile card, so that the system can automatically revoke their building and door accesses when they leave.

- As a Property Manager, I want view the confirmation date and time of access removal next to the departure date, so that verify that the resident's accesses have been successfully revoked by the system.

---

## Technical Proposal

- <a id="cite-1"></a>Update the resident data models (OSKOrganizationResidentBase) to include departureDate (Timestamp/Date), accessRemovedDate (Timestamp/Date), and departureTaskId (string) fields.<br>(see [#1](#evidence-1))

- <a id="cite-2"></a><a id="cite-3"></a>Update the frontend resident details component (OSKOrganizationInhabitantDetailsComponent) and its template to display a date-time picker for the departure date and a read-only confirmation label for the access removed date.<br>(see [#2](#evidence-2), [#3](#evidence-3))

- <a id="cite-4"></a><a id="cite-5"></a>Update the frontend inhabitant service (OSKOrganizationInhabitantService) to pass the new departureDate field when calling the updateResident method, which invokes the 'organization-updateOrganizationResident' Firebase Callable function.<br>(see [#4](#evidence-4), [#5](#evidence-5))

- <a id="cite-6"></a><a id="cite-7"></a><a id="cite-8"></a>In the backend resident service (OSKOrganizationResidentsService.updateResident), when a resident is updated with a new departure date, cancel any existing scheduled departure task and schedule a new task using OSKTaskSchedulerService.<br>(see [#6](#evidence-6), [#7](#evidence-7), [#8](#evidence-8))

- <a id="cite-9"></a>Define a new task type 'removeResidentAccessTask' in the scheduled tasks models (OSKTScheduledTaskPayload).<br>(see [#9](#evidence-9))

- <a id="cite-10"></a>Update the task handler service (OSKTaskHandlerService.handleTask) to route the 'removeResidentAccessTask' to a new execution method in the resident service.<br>(see [#10](#evidence-10))

- <a id="cite-11"></a><a id="cite-12"></a>Implement executeResidentDeparture in OSKOrganizationResidentsService to delete the resident's accesses for the building using OSKAccessService.deleteAccessById, which automatically publishes delete messages to all edge devices (ACDs) via OSKAccessMessagePublisherService.publishMessageToAllACDs.<br>(see [#11](#evidence-11), [#12](#evidence-12))

- <a id="cite-13"></a><a id="cite-14"></a>On the edge device side (node-iot repo), the access controller (OSKAccessControlDeviceAccessController.deleteAccess) handles the deletion of the access record from the local database.<br>(see [#13](#evidence-13), [#14](#evidence-14))

---

## Acceptance Criteria

- [ ] The Property Manager can set a departure date and time in the future for a resident on their profile card in the PGO.

- [ ] The departure date and time are saved to the resident's document in the database.

- [ ] When the departure date is set or updated, any existing scheduled departure task for the resident is canceled, and a new task is scheduled.

- [ ] When the departure date is triggered, the scheduled task executes and removes all accesses for the resident to the specific building and all authorized doors.

- [ ] The access removal automatically propagates to the edge devices (intercoms, digicoms) via Pub/Sub messages.

- [ ] Upon successful completion of the access removal, the system updates the resident's profile card to display the exact date and time when the accesses were removed.

- [ ] If the departure date is cleared by the Property Manager, any scheduled departure task is canceled and the departure date field is cleared.

---

## Constraints

- <a id="cite-15"></a><a id="cite-16"></a>Access removal must be performed per building and per user, ensuring all accesses associated with the resident's user ID in that building are deleted.<br>(see [#15](#evidence-15), [#16](#evidence-16))

- <a id="cite-17"></a><a id="cite-18"></a>Access deletion must publish a delete message to all associated Access Control Devices (ACDs) using the Delete operation of OSKAccessMessageOperation.<br>(see [#17](#evidence-17), [#18](#evidence-18))

- Task scheduling and cancellation must use the existing Google Cloud Tasks integration provided by OSKTaskSchedulerService.<br>(see [#7](#evidence-7), [#8](#evidence-8))

- <a id="cite-19"></a>Edge device access deletion must update the local MongoDB database on the device by pulling the deleted access ID from the accesses array.<br>(see [#19](#evidence-19))

---

## Evidence Used

### Repos

- <a id="repo-1"></a>[**R1**](#cite-repo-1) `angular-app-oskey-io@8345d222a7f9879282de7b0a49f63f4771bdc1b2` (extracted 2026-09-02) [↩](#cite-repo-1)
- <a id="repo-2"></a>[**R2**](#cite-repo-2) `firebase-oskey-dev@00e1d9fd568fab1bdcd1ad81e76b40d6b38ad4a3` (extracted 2026-09-02) [↩](#cite-repo-2)
- <a id="repo-3"></a>[**R3**](#cite-repo-3) `node-iot-api-oskey-io@a6cba122c0dcc02b75c3d26a39e10f2407d22144` (extracted 2026-09-02) [↩](#cite-repo-3)

### Fact-Ids

- <a id="evidence-1"></a>[**#1**](#cite-1) `type_alias|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|#1` [↩](#cite-1)
- <a id="evidence-2"></a>[**#2**](#cite-2) `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent` [↩](#cite-2)
- <a id="evidence-3"></a>[**#3**](#cite-3) `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-card-content|#1` [↩](#cite-3)
- <a id="evidence-4"></a>[**#4**](#cite-4) `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|OSKOrganizationInhabitantService|updateResident|#1` [↩](#cite-4)
- <a id="evidence-5"></a>[**#5**](#cite-5) `firebase_callable_call|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|organization-updateOrganizationResident|#1` [↩](#cite-5)
- <a id="evidence-6"></a>[**#6**](#cite-6) `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|updateResident|#1` [↩](#cite-6)
- <a id="evidence-7"></a>[**#7**](#cite-7) `service_method|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService|scheduleTask|#1` [↩](#cite-7)
- <a id="evidence-8"></a>[**#8**](#cite-8) `service_method|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService|cancelTask|#1` [↩](#cite-8)
- <a id="evidence-9"></a>[**#9**](#cite-9) `type_alias|tasks|functions/src/modules/tasks/models/tasks.model.ts|OSKTScheduledTaskPayload|#1` [↩](#cite-9)
- <a id="evidence-10"></a>[**#10**](#cite-10) `service_method|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService|handleTask|#1` [↩](#cite-10)
- <a id="evidence-11"></a>[**#11**](#cite-11) `service_method|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService|deleteAccessById|#1` [↩](#cite-11)
- <a id="evidence-12"></a>[**#12**](#cite-12) `service_method|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService|publishMessageToAllACDs|#1` [↩](#cite-12)
- <a id="evidence-13"></a>[**#13**](#cite-13) `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController|deleteAccess|#1` [↩](#cite-13)
- <a id="evidence-14"></a>[**#14**](#cite-14) `mongo_operation|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|accessControlDeviceAccesses|updateOne|#4` [↩](#cite-14)
- <a id="evidence-15"></a>[**#15**](#cite-15) `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKUserAccessesController.default.deleteAllAccessesPerBuilding|deleteAppUserResident|userId,accessBuildingId|#1` [↩](#cite-15)
- <a id="evidence-16"></a>[**#16**](#cite-16) `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKBuildingAccessesController.default.deletePerUser|deleteAppUserResident|accessBuildingId,userId|#1` [↩](#cite-16)
- <a id="evidence-17"></a>[**#17**](#cite-17) `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|deleteAccessById|userId,buildingId,{
                    accessId,
                    creationDate: currentUserAccesses?.creationDate,
                    operation: OSKAccessMessageOperation.Delete,
                },accessToRemove.authorizedDoors|#1` [↩](#cite-17)
- <a id="evidence-18"></a>[**#18**](#cite-18) `enum_declaration|core|functions/src/modules/core/modules/access/models/functions/access_messages.model.ts|OSKAccessMessageOperation|#1` [↩](#cite-18)
- <a id="evidence-19"></a>[**#19**](#cite-19) `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|this._mongoDBService.updateOne|deleteAccess|this._mongoDBName,collections.accessControlDeviceAccesses,{
                    accessControlDeviceId,
                },{
                    $pull: {
                        accesses: { accessId: accessEntryToDelete.access.accessId },
                    },
                    $set: {
                        modificationDate: timestamp,
                    },
                }|#1` [↩](#cite-19)

### Audit Trail

455 fact(s) gathered but not cited in this document — click a repo to expand:

<details>
<summary>angular-app-oskey-io (53)</summary>

<sub>

- <a id="evidence-20"></a>**#20** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/types/onboarding-document.type.ts|OSKInhabitantOnboardingDocument|expiryDateActivationCode|#1`

- <a id="evidence-21"></a>**#21** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/types/onboarding-document.type.ts|OSKInhabitantOnboardingDocument|expiryDateSms|#1`

- <a id="evidence-22"></a>**#22** `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|updateResidentDialog|#1`

- <a id="evidence-24"></a>**#24** `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|deleteResident|#1`

- <a id="evidence-28"></a>**#28** `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|updateResident|#1`

- <a id="evidence-29"></a>**#29** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|this.router.navigateByUrl|deleteResident|`/organization/${this.organizationId}/entities/${this.entityId}/properties/${this.propertyId}/inhabitants/inhabitant-list`|#1`

- <a id="evidence-30"></a>**#30** `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|OSKOrganizationInhabitantService|deleteResident|#1`

- <a id="evidence-31"></a>**#31** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/types/onboarding-card.type.ts|OSKInhabitantOnboardingCard|contactDetails|#1`

- <a id="evidence-41"></a>**#41** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/types/onboarding-card.type.ts|OSKInhabitantOnboardingCard|lastName|#1`

- <a id="evidence-43"></a>**#43** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|dialogRef.afterClosed|deleteResident||#1`

- <a id="evidence-151"></a>**#151** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|this.inhabitantService.deleteResident|deleteResident|this.organizationId,this.residentId|#1`

- <a id="evidence-153"></a>**#153** `type_alias|core|hosting/web-app/src/app/core/types/access/access.type.ts|OSKAccess|#1`

- <a id="evidence-160"></a>**#160** `angular_injectable|features|hosting/web-app/src/app/features/portals/user/account/services/account/account.service.ts|OSKAccountService`

- <a id="evidence-161"></a>**#161** `type_alias|core|hosting/web-app/src/app/core/types/access/access.type.ts|OSKAccessBase|#1`

- <a id="evidence-164"></a>**#164** `type_alias|core|hosting/web-app/src/app/core/types/access/user-access.type.ts|OSKUserAccess|#1`

- <a id="evidence-175"></a>**#175** `type_alias|core|hosting/web-app/src/app/core/types/access/access-rights.type.ts|OSKOneTimeAccess|#1`

- <a id="evidence-275"></a>**#275** `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent`

- <a id="evidence-276"></a>**#276** `source_class|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent`

- <a id="evidence-277"></a>**#277** `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|OSKCreateOrganizationInhabitantComponent`

- <a id="evidence-278"></a>**#278** `source_class|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|OSKCreateOrganizationInhabitantComponent`

- <a id="evidence-279"></a>**#279** `source_class|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent`

- <a id="evidence-280"></a>**#280** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|Component|anon|{
  selector: 'osk-organization-inhabitants-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    RouterLink,
    OSKTranslatePipe,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatSortModule
  ],
  templateUrl: './organization-inhabitants-list.component.html',
  styleUrl: './organization-inhabitants-list.component.scss'
}|#1`

- <a id="evidence-281"></a>**#281** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|Component|anon|{
  selector: 'osk-organization-inhabitant-details',
  standalone: true,
  imports: [
    MatCardModule,
    OSKTranslatePipe,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './organization-inhabitant-details.component.html',
  styleUrl: './organization-inhabitant-details.component.scss'
}|#1`

- <a id="evidence-282"></a>**#282** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|ng-container|#2`

- <a id="evidence-283"></a>**#283** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|ng-container|#3`

- <a id="evidence-284"></a>**#284** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-option|#2`

- <a id="evidence-285"></a>**#285** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|ng-container|#8`

- <a id="evidence-286"></a>**#286** `angular_route|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/organization-inhabitants.routes.ts|details/:residentId|#1`

- <a id="evidence-287"></a>**#287** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-tab|#1`

- <a id="evidence-288"></a>**#288** `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/buildings/organization-building-details/organization-building-details.component.ts|OSKOrganizationBuildingDetailsComponent`

- <a id="evidence-289"></a>**#289** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|ng-container|#1`

- <a id="evidence-290"></a>**#290** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-option|#1`

- <a id="evidence-291"></a>**#291** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-tab-group|#1`

- <a id="evidence-292"></a>**#292** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|ng-container|#4`

- <a id="evidence-293"></a>**#293** `angular_component|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/users/features/organization-user-details/organization-user-details.component.ts|OSKOrganizationUserDetailsComponent`

- <a id="evidence-294"></a>**#294** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.html|OSKOrganizationInhabitantsListComponent|ng-container|#5`

- <a id="evidence-295"></a>**#295** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-tab|#2`

- <a id="evidence-296"></a>**#296** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-card|#1`

- <a id="evidence-297"></a>**#297** `angular_template_composition|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.html|OSKOrganizationInhabitantDetailsComponent|mat-select|#1`

- <a id="evidence-298"></a>**#298** `angular_injectable|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|OSKOrganizationInhabitantService`

- <a id="evidence-304"></a>**#304** `source_class|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|OSKOrganizationInhabitantService`

- <a id="evidence-315"></a>**#315** `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|OSKOrganizationInhabitantService|createResident|#1`

- <a id="evidence-335"></a>**#335** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts|OSKDocumentListResponse|residents|#1`

- <a id="evidence-340"></a>**#340** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|this.inhabitantService.updateResident|updateResident|residentDTO|#1`

- <a id="evidence-344"></a>**#344** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|this.updateResident|updateResidentDialog||#2`

- <a id="evidence-348"></a>**#348** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|this.firebaseHttps.call|updateResident|'organization-updateOrganizationResident',data|#1`

- <a id="evidence-349"></a>**#349** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|this.updateResident|updateResidentDialog||#1`

- <a id="evidence-350"></a>**#350** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|this.router.navigateByUrl|updateResident|`/organization/${this.organizationId}/entities/${this.entityId}/properties/${this.propertyId}/inhabitants/inhabitant-list`|#1`

- <a id="evidence-351"></a>**#351** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|this.snackBar.open|updateResident|this.translate.instant('portals.organization.residents.details.successMessage'),'OK',{
            duration: 5000
          }|#1`

- <a id="evidence-352"></a>**#352** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|this.translate.instant|updateResident|'portals.organization.residents.details.successMessage'|#1`

- <a id="evidence-353"></a>**#353** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|this.pmpResidentDocuemnt|updateResidentDialog||#2`

- <a id="evidence-371"></a>**#371** `type_alias|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/types/onboarding-document.type.ts|OSKInhabitantOnboardingDocument|#1`

- <a id="evidence-406"></a>**#406** `type_alias|core|hosting/web-app/src/app/core/types/building/building-door.type.ts|OSKRawIotActivityPayload|#1`

</sub>

</details>

<details>
<summary>firebase-oskey-dev (382)</summary>

<sub>

- <a id="evidence-23"></a>**#23** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|_deleteOnboardingInhabitant|#1`

- <a id="evidence-25"></a>**#25** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|deleteResident|#1`

- <a id="evidence-26"></a>**#26** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentResponse|residentId|#1`

- <a id="evidence-27"></a>**#27** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|_deleteResidentFromOrganization|#1`

- <a id="evidence-32"></a>**#32** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|onboardingCard.contactDetails.email.trim|createAppUserResident||#1`

- <a id="evidence-33"></a>**#33** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKGetOrganizationResidentDetailsRequestData|residentId|#1`

- <a id="evidence-34"></a>**#34** `permission_candidate|settings|functions/src/modules/settings/modules/role/data/composite_role.data.ts|v1.org.residents.delete|#1`

- <a id="evidence-35"></a>**#35** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKResidentsDocumentDeleteRequest|residentId|#1`

- <a id="evidence-36"></a>**#36** `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|deleteResident|#1`

- <a id="evidence-37"></a>**#37** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|deleteAppUserResident|#1`

- <a id="evidence-38"></a>**#38** `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|getResidentDetails|#1`

- <a id="evidence-39"></a>**#39** `permission_candidate|settings|functions/src/modules/settings/modules/role/data/composite_roles_translated.data.ts|v1.org.residents.delete|#1`

- <a id="evidence-40"></a>**#40** `controller_method|organization|functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts|OSKOrganizationResidentsController|delete|#1`

- <a id="evidence-42"></a>**#42** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|checkInhabitantTypeAndDeleteAllInhabitantresident|#1`

- <a id="evidence-44"></a>**#44** `controller_method|organization|functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts|OSKOrganizationResidentsController|update|#1`

- <a id="evidence-45"></a>**#45** `source_class|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService`

- <a id="evidence-46"></a>**#46** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|scheduleDate.getTime|scheduleTask||#1`

- <a id="evidence-47"></a>**#47** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService.logger.logInfo|scheduleTask|`[TaskScheduler] Scheduling task of type ${payload.taskType} for ${scheduleDate.toISOString()}`|#1`

- <a id="evidence-48"></a>**#48** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService.tasksClient.createTask|scheduleTask|{ parent, task }|#1`

- <a id="evidence-49"></a>**#49** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService.logger.logInfo|scheduleTask|`[TaskScheduler] Successfully created task: ${response.name}`|#1`

- <a id="evidence-50"></a>**#50** `exported_symbol|tasks|functions/src/modules/tasks/index.ts|./services/task_scheduler.service|#1`

- <a id="evidence-51"></a>**#51** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|Buffer.from|scheduleTask|JSON.stringify(payload)|#1`

- <a id="evidence-52"></a>**#52** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|Math.floor|scheduleTask|scheduleDate.getTime() / 1000|#1`

- <a id="evidence-53"></a>**#53** `source_file|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|functions/src/modules/tasks/services/task_scheduler.service.ts`

- <a id="evidence-54"></a>**#54** `call_expression|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|OSKTaskSchedulerService.scheduleTask|onMaintenanceRefreshPincodes|scheduleDate,payload,targetUrl|#1`

- <a id="evidence-55"></a>**#55** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|scheduleDate.toISOString|scheduleTask||#1`

- <a id="evidence-56"></a>**#56** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService.logger.logError|scheduleTask|'[TaskScheduler] Failed to schedule task',{ error }|#1`

- <a id="evidence-57"></a>**#57** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|Buffer.from(JSON.stringify(payload)).toString|scheduleTask|'base64'|#1`

- <a id="evidence-58"></a>**#58** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|JSON.stringify|scheduleTask|payload|#1`

- <a id="evidence-59"></a>**#59** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKIntercomCommunicationService.executeScheduledActivation|handleTask|payload.data|#1`

- <a id="evidence-60"></a>**#60** `call_expression|user|functions/src/modules/user/index.ts|pubsub.schedule('00 00 * * *').onRun|getScheduledFunctionTriggers|async () => OSKUserService.onDeleteAccount()|#1`

- <a id="evidence-61"></a>**#61** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService.tasksClient.queuePath|scheduleTask|PROJECT_ID!,LOCATION_ID!,QUEUE_TASK_NAME!|#1`

- <a id="evidence-62"></a>**#62** `call_expression|user|functions/src/modules/user/index.ts|pubsub.schedule|getScheduledFunctionTriggers|'00 00 * * *'|#1`

- <a id="evidence-63"></a>**#63** `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|../../../../../tasks/services/task_scheduler.service|#1`

- <a id="evidence-64"></a>**#64** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKIntercomCommunicationService.executeScheduledDeactivation|handleTask|payload.data|#1`

- <a id="evidence-65"></a>**#65** `imports_dependency|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|../models/tasks.model|#1`

- <a id="evidence-66"></a>**#66** `function_declaration|user|functions/src/modules/user/index.ts|getScheduledFunctionTriggers|#1`

- <a id="evidence-67"></a>**#67** `imports_dependency|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|../../../../tasks/services/task_scheduler.service|#1`

- <a id="evidence-68"></a>**#68** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|processedMessage.doorInfos.map|executeScheduledDeactivation|async ({ accessControlDeviceId }) => {
            try {
                const mostRecentConfig =
                    await OSKAccessControlDeviceConfigController.default.getMostRecent(accessControlDeviceId);

                if (mostRecentConfig && mostRecentConfig.homeScreen?.message?.communicationId === communicationId) {
                    const { message, ...homeScreenWithoutMessage } = mostRecentConfig.homeScreen || {};
                    const newConfig = {
                        ...mostRecentConfig,
                        homeScreen: homeScreenWithoutMessage,
                        creationDate: Timestamp.now(),
                        modificationDate: Timestamp.now(),
                    };
                    await OSKAccessControlDeviceConfigController.default.save(newConfig);
                }
            } catch (err) {
                OSKIntercomCommunicationService.default.logger.logError(
                    `[Task] Failed to remove message from device ${accessControlDeviceId} during deactivation`,
                    { error: err }
                );
            }
        }|#1`

- <a id="evidence-69"></a>**#69** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKIntercomCommunicationService.upsertIntercomState|executeScheduledDeactivation|organizationId,buildingId,[],{ preemptActiveMessages: false, deactivateCommunicationId: communicationId }|#1`

- <a id="evidence-70"></a>**#70** `service_method|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKIntercomCommunicationService|executeScheduledDeactivation|#1`

- <a id="evidence-71"></a>**#71** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|Promise.all|executeScheduledDeactivation|configRemovalPromises|#1`

- <a id="evidence-72"></a>**#72** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKAccessControlDeviceConfigController.default.save|executeScheduledDeactivation|newConfig|#1`

- <a id="evidence-73"></a>**#73** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|Timestamp.now|executeScheduledDeactivation||#1`

- <a id="evidence-74"></a>**#74** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.cancelTask|executeScheduledActivation|taskId|#1`

- <a id="evidence-75"></a>**#75** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|Timestamp.now|executeScheduledDeactivation||#2`

- <a id="evidence-76"></a>**#76** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKIntercomCommunicationService.default.logger.logInfo|executeScheduledDeactivation|`[Task] Communication ${communicationId} is missing or not 'active'. Ignoring deactivation.`|#1`

- <a id="evidence-77"></a>**#77** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKAccessControlDeviceConfigController.default.getMostRecent|executeScheduledDeactivation|accessControlDeviceId|#1`

- <a id="evidence-78"></a>**#78** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKIntercomCommunicationService.default.logger.logError|executeScheduledDeactivation|`[Task] Failed to remove message from device ${accessControlDeviceId} during deactivation`,{ error: err }|#1`

- <a id="evidence-79"></a>**#79** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.cancelTask(taskId).catch|executeScheduledActivation|() => {}|#1`

- <a id="evidence-80"></a>**#80** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.cancelTask(msg.deactivationTaskId).catch|deleteIntercomCommunication|() => {}|#1`

- <a id="evidence-81"></a>**#81** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.cancelTask(deactivationTaskId).catch|createIntercomCommunication|() => {}|#1`

- <a id="evidence-82"></a>**#82** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKIntercomCommunicationService._updateDeviceConfigWithMessage|executeScheduledActivation|buildingId,doorId,{
                        communicationId: processedMessage!.communicationId,
                        homeInfos: processedMessage!.homeInfos,
                        schedule: processedMessage!.schedule,
                        priority: processedMessage!.priority,
                    }|#1`

- <a id="evidence-83"></a>**#83** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.cancelTask(msg.activationTaskId).catch|deleteIntercomCommunication|() => {}|#1`

- <a id="evidence-84"></a>**#84** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.cancelTask(activationTaskId).catch|createIntercomCommunication|() => {}|#1`

- <a id="evidence-85"></a>**#85** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKIntercomCommunicationService._notifyResidents|executeScheduledActivation|organizationId,organization?.name || '',buildingId,processedMessage.buildingName,processedMessage.communicationId,processedMessage.homeInfos|#1`

- <a id="evidence-86"></a>**#86** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKIntercomCommunicationService.default.logger.logError|executeScheduledActivation|`[Task] Failed to update config for door ${doorId} during activation`,{ error: err }|#1`

- <a id="evidence-87"></a>**#87** `service_method|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKIntercomCommunicationService|executeScheduledActivation|#1`

- <a id="evidence-88"></a>**#88** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKIntercomCommunicationService.upsertIntercomState|executeScheduledActivation|organizationId,buildingId,[],{
                preemptActiveMessages: true,
                activateCommunicationId: communicationId,
            }|#1`

- <a id="evidence-89"></a>**#89** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.cancelTask|deleteIntercomCommunication|msg.deactivationTaskId|#1`

- <a id="evidence-90"></a>**#90** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.cancelTask|deleteIntercomCommunication|msg.activationTaskId|#1`

- <a id="evidence-91"></a>**#91** `source_class|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService`

- <a id="evidence-92"></a>**#92** `api_contract|tasks|functions/src/modules/tasks/index.ts|handleTask|#1`

- <a id="evidence-93"></a>**#93** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|String|handleTask|error|#1`

- <a id="evidence-94"></a>**#94** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService.logger.logInfo|handleTask|'[TaskHandler] stars task traitement:'|#1`

- <a id="evidence-95"></a>**#95** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService.logger.logInfo|handleTask|'[TaskHandler] Handling deactivateIntercomCommunicationTask',{ data: payload.data }|#1`

- <a id="evidence-96"></a>**#96** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService.logger.logInfo|handleTask|'[TaskHandler] Handling refreshPincodeTask',{
                        userId: payload.data.userId,
                    }|#1`

- <a id="evidence-97"></a>**#97** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService.logger.logInfo|handleTask|`[TaskHandler] Received task: ${payload.taskType}`,{ payload }|#1`

- <a id="evidence-98"></a>**#98** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService.logger.logInfo|handleTask|'[TaskHandler] headers',{ headers: req.headers }|#1`

- <a id="evidence-99"></a>**#99** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService.logger.logInfo|handleTask|'[TaskHandler] Handling activateIntercomCommunicationTask',{ data: payload.data }|#1`

- <a id="evidence-100"></a>**#100** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|res.status(200).send|handleTask|'Task processed successfully.'|#1`

- <a id="evidence-101"></a>**#101** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|res.status|handleTask|200|#1`

- <a id="evidence-102"></a>**#102** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService.logger.logWarning|handleTask|`[TaskHandler] Unknown task type: ${unknownPayload.taskType ?? 'undefined'}`|#1`

- <a id="evidence-103"></a>**#103** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|res.status(500).send|handleTask|'Task processing failed.'|#1`

- <a id="evidence-104"></a>**#104** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService.logger.logError|handleTask|'[TaskHandler] Unauthorized attempt to call task handler.'|#1`

- <a id="evidence-105"></a>**#105** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKTaskHandlerService.logger.logError|handleTask|'[TaskHandler] Error processing task',{ error: errorDetails }|#1`

- <a id="evidence-106"></a>**#106** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|OSKPincodeRefreshWorkerService.executePincodeRefresh|handleTask|payload.data|#1`

- <a id="evidence-107"></a>**#107** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|res.status|handleTask|500|#1`

- <a id="evidence-108"></a>**#108** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|res.status|handleTask|403|#1`

- <a id="evidence-109"></a>**#109** `exported_symbol|tasks|functions/src/modules/tasks/index.ts|./services/task_handler.service|#1`

- <a id="evidence-110"></a>**#110** `call_expression|tasks|functions/src/modules/tasks/services/task_handler.service.ts|res.status(403).send|handleTask|'Forbidden'|#1`

- <a id="evidence-111"></a>**#111** `source_class|core|functions/src/modules/core/modules/storage/services/storage.service.ts|OSKStorageService`

- <a id="evidence-112"></a>**#112** `source_file|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/index.ts|functions/src/modules/access_control_device/api/node-iot-api/index.ts`

- <a id="evidence-113"></a>**#113** `source_file|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts`

- <a id="evidence-114"></a>**#114** `source_class|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|OSKNodeIoTAPIService`

- <a id="evidence-115"></a>**#115** `imports_dependency|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/controllers/access_control_device.controllers.ts|../services/node_iot_api.service|#1`

- <a id="evidence-116"></a>**#116** `service_method|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|OSKNodeIoTAPIService|post|#1`

- <a id="evidence-117"></a>**#117** `service_method|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|OSKNodeIoTAPIService|token|#1`

- <a id="evidence-118"></a>**#118** `source_file|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/models/access_control_device.model.ts|functions/src/modules/access_control_device/api/node-iot-api/models/access_control_device.model.ts`

- <a id="evidence-119"></a>**#119** `source_file|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/controllers/access_control_device.controllers.ts|functions/src/modules/access_control_device/api/node-iot-api/controllers/access_control_device.controllers.ts`

- <a id="evidence-120"></a>**#120** `controller_method|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/controllers/access_control_device.controllers.ts|OSKAccessControlDeviceController|register|#1`

- <a id="evidence-121"></a>**#121** `service_method|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|OSKNodeIoTAPIService|url|#1`

- <a id="evidence-122"></a>**#122** `imports_dependency|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/controllers/access_control_device_public_keys.controllers.ts|../services/node_iot_api.service|#1`

- <a id="evidence-123"></a>**#123** `source_file|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/models/access_control_device_config.model.ts|functions/src/modules/access_control_device/api/node-iot-api/models/access_control_device_config.model.ts`

- <a id="evidence-124"></a>**#124** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|this.url|post|path|#1`

- <a id="evidence-125"></a>**#125** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|Math.floor|token|Date.now() / 1000|#1`

- <a id="evidence-126"></a>**#126** `imports_dependency|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|axios|#1`

- <a id="evidence-127"></a>**#127** `exported_symbol|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/index.ts|./models/access_control_device.model|#1`

- <a id="evidence-128"></a>**#128** `controller_method|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/controllers/access_control_device.controllers.ts|OSKAccessControlDeviceController|unregister|#1`

- <a id="evidence-129"></a>**#129** `imports_dependency|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|../models/jwt_payload.model|#1`

- <a id="evidence-130"></a>**#130** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|Date.now|token||#1`

- <a id="evidence-131"></a>**#131** `imports_dependency|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|@oskey/core/logger|#1`

- <a id="evidence-132"></a>**#132** `exported_symbol|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/index.ts|./controllers/access_control_device.controllers|#1`

- <a id="evidence-133"></a>**#133** `service_method|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|OSKNodeIoTAPIService|delete|#1`

- <a id="evidence-134"></a>**#134** `exported_symbol|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/index.ts|./models/access_control_device_config.model|#1`

- <a id="evidence-135"></a>**#135** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|axios.default.post|post|url,body,{
                headers: { authorization: `Bearer ${token}` },
            }|#1`

- <a id="evidence-136"></a>**#136** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|Error|token|`Unable to generate token using service account: ${serviceAccount}`|#1`

- <a id="evidence-137"></a>**#137** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKAccessService.deleteAccessById|createNonAppUserResident|nonAppUserId,buildingId,accessId|#2`

- <a id="evidence-138"></a>**#138** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|_deleteNonAppUserResident|#1`

- <a id="evidence-139"></a>**#139** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKAccessService.deleteAccessById|createNonAppUserResident|nonAppUserId,buildingId,accessId|#1`

- <a id="evidence-140"></a>**#140** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKAccessService.deleteAccessById|removeInhabitant|inhabitantId,buildingId,user.inhabitantAccessId|#1`

- <a id="evidence-141"></a>**#141** `permission_candidate|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|v1.org.residents.delete|#1`

- <a id="evidence-142"></a>**#142** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKBuildingAccessesController.default.deletePerUser|_deleteNonAppUserResident|accessBuildingId,nonAppUserId|#1`

- <a id="evidence-143"></a>**#143** `permission_error|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|permission-denied|#2`

- <a id="evidence-144"></a>**#144** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKNonAppUserAccessController.default.delete|_deleteNonAppUserResident|buildingId,unitId,nonAppUserId,accessBuildingId|#1`

- <a id="evidence-145"></a>**#145** `permission_error|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|permission-denied|#5`

- <a id="evidence-146"></a>**#146** `permission_error|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|permission-denied|#3`

- <a id="evidence-147"></a>**#147** `permission_error|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|permission-denied|#4`

- <a id="evidence-148"></a>**#148** `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|OSKAccessService.deleteAccessById|removeInhabitantFromUnit|request.inhabitantToRemoveId,request.buildingId,inhabitantToRemove.inhabitantAccessId|#1`

- <a id="evidence-149"></a>**#149** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService.deleteAppUserResident|deleteResident|residentDoc|#1`

- <a id="evidence-150"></a>**#150** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService._deleteNonAppUserResident|deleteResident|residentDoc|#1`

- <a id="evidence-152"></a>**#152** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKConsolidatedRolesController.default.checkUserPermissions|deleteResident|organizationUser.roles,rolesToCheck|#1`

- <a id="evidence-154"></a>**#154** `source_class|user|functions/src/modules/user/modules/user_access/services/user_access.service.ts|OSKUserAccessService`

- <a id="evidence-155"></a>**#155** `source_class|core|functions/src/modules/core/modules/access/services/access_utils.service.ts|OSKAccessUtilsService`

- <a id="evidence-156"></a>**#156** `type_alias|core|functions/src/modules/core/modules/access/models/access_method.model.ts|OSKAccessMethod|#1`

- <a id="evidence-157"></a>**#157** `source_class|core|functions/src/modules/core/modules/access/services/access_update.service.ts|OSKAccessUpdateService`

- <a id="evidence-158"></a>**#158** `type_alias|core|functions/src/modules/core/modules/access/models/functions/access_messages.model.ts|OSKAccessMessageSetup|#1`

- <a id="evidence-159"></a>**#159** `service_method|core|functions/src/modules/core/modules/access/services/access_utils.service.ts|OSKAccessUtilsService|setupAccess|#1`

- <a id="evidence-162"></a>**#162** `type_alias|core|functions/src/modules/core/modules/access/models/functions/access_messages.model.ts|OSKAccessMessage|#1`

- <a id="evidence-163"></a>**#163** `source_class|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService`

- <a id="evidence-165"></a>**#165** `source_class|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService`

- <a id="evidence-167"></a>**#167** `model_property|user|functions/src/modules/user/modules/user_access/models/documents/user_access_document.model.ts|OSKUserAccess|personalization|#1`

- <a id="evidence-168"></a>**#168** `source_class|admin|functions/src/modules/admin/modules/admin_maintenance/db_accesses/services/db_accesses.service.ts|OSKDbAccessService`

- <a id="evidence-169"></a>**#169** `source_class|access_control_device|functions/src/modules/access_control_device/services/access_control_device.service.ts|OSKAccessControlDeviceService`

- <a id="evidence-170"></a>**#170** `type_alias|core|functions/src/modules/core/modules/access/models/functions/access_messages.model.ts|OSKAccessMessageInsert|#1`

- <a id="evidence-171"></a>**#171** `type_alias|access_control_device|functions/src/modules/access_control_device/models/messages/access_control_device_message.model.ts|OSKKey|#1`

- <a id="evidence-172"></a>**#172** `source_class|access_control_device|functions/src/modules/access_control_device/services/access_control_device_public_keys.service.ts|OSKAccessControlDevicePublicKeysService`

- <a id="evidence-173"></a>**#173** `function_declaration|user|functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts|isTypeOSKQuickcodeAccess|#1`

- <a id="evidence-174"></a>**#174** `source_class|building|functions/src/modules/building/modules/building_accesses/services/building_access.service.ts|OSKBuildingAccessService`

- <a id="evidence-176"></a>**#176** `type_alias|core|functions/src/modules/core/modules/access/models/functions/access_messages.model.ts|OSKAccessMessageUpdate|#1`

- <a id="evidence-177"></a>**#177** `type_alias|user|functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts|OSKAccess|#1`

- <a id="evidence-178"></a>**#178** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKUserAccessesController.default.save|deleteAccessById|userId,buildingId,updatedAccesses|#1`

- <a id="evidence-179"></a>**#179** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKBuildingAccessesController.default.deletePerUser|deleteAccessById|buildingId,userId|#1`

- <a id="evidence-180"></a>**#180** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKUserPincodeController.default.delete|deleteAccessById|pincodeDoc.pincode,userId|#1`

- <a id="evidence-181"></a>**#181** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService.logger.logInfo|deleteAccessById|`Successfully deleted access of user with userId: ${userId} and accessId: ${accessId}`,{ userId, accessId }|#1`

- <a id="evidence-182"></a>**#182** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKUserDeviceAccessControlDeviceTokenController.default.deleteAllByTokenId|deleteAccessById|userId,tokenId|#1`

- <a id="evidence-183"></a>**#183** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKUserPincodeController.default.getByAccessId|deleteAccessById|userId,accessId|#1`

- <a id="evidence-184"></a>**#184** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|currentUserAccesses.accesses.find|deleteAccessById|(access: OSKAccess) => access.accessId === accessId|#1`

- <a id="evidence-185"></a>**#185** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKUserAccessesController.default.deleteAllAccessesPerBuilding|deleteAccessById|userId,buildingId|#1`

- <a id="evidence-186"></a>**#186** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService._removeAccessIdFromUserInvitations|deleteAccessById|userId,accessId,buildingId,accessToRemove.unitId|#1`

- <a id="evidence-187"></a>**#187** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKBuildingUnitInhabitantController.default.update|deleteAccessById|buildingId,accessToRemove.unitId,userId,{ inhabitantAccessId: '' }|#1`

- <a id="evidence-188"></a>**#188** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService.logger.logError|deleteAccessById|`No document found for user with id ${userId} and building with id ${buildingId}`,{ userId, buildingId }|#1`

- <a id="evidence-189"></a>**#189** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|currentUserAccesses.accesses.filter|deleteAccessById|(access: OSKAccess) => access.accessId !== accessId|#1`

- <a id="evidence-190"></a>**#190** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKUserAccessesController.default.getPerBuilding|deleteAccessById|userId,buildingId|#1`

- <a id="evidence-191"></a>**#191** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService.logger.logError|deleteAccessById|'Error in deleting access by id!',{ error }|#1`

- <a id="evidence-192"></a>**#192** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|deleteAccessById|pincodeDoc.pincode,buildingId|#1`

- <a id="evidence-193"></a>**#193** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService.logger.logError|deleteAccessById|'Access not found in deleteAccessById!'|#1`

- <a id="evidence-195"></a>**#195** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKBuildingUnitInhabitantController.default.get|deleteAccessById|buildingId,accessToRemove.unitId,userId|#1`

- <a id="evidence-196"></a>**#196** `call_expression|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts|OSKAccessService.deleteAccessById|removeUserAccesses|requestData.userId,userAccess.buildingId,access.accessId|#1`

- <a id="evidence-197"></a>**#197** `call_expression|admin|functions/src/modules/admin/modules/admin_users/services/admin_user_access.service.ts|OSKAccessService.deleteAccessById|removeUserAccessAccesses|requestData.userId,requestData.userAccess.buildingId,accessId|#1`

- <a id="evidence-198"></a>**#198** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|createAccess|userId,buildingId,{
                    operation: OSKAccessMessageOperation.Insert,
                    accessId: newAccess.accessId,
                    accessRights: newAccess.accessRights,
                    creationDate: newAccess.creationDate,
                    isMainAccess: newAccess.isMainAccess,
                },newAccess.authorizedDoors,{ category: 'oskUser' }|#1`

- <a id="evidence-199"></a>**#199** `call_expression|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|OSKAccessController.default._publishMessage|publishMessage|topicName,accessControlDeviceId,payload|#1`

- <a id="evidence-200"></a>**#200** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|createAccess|staffId,buildingId,{
                    operation: OSKAccessMessageOperation.Insert,
                    accessId: newAccess.accessId,
                    accessRights: newAccess.accessRights,
                    creationDate: newAccess.creationDate,
                    isMainAccess: newAccess.isMainAccess,
                },newAccess.authorizedDoors,{ category: 'supplierStaff', supplierId: supplierId }|#1`

- <a id="evidence-201"></a>**#201** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessController.default.publishMessage|publishMessageAccessUpdateToACD|buildingDoorACD.accessControlDeviceId,payload|#1`

- <a id="evidence-202"></a>**#202** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService.logger.logInfo|publishMessageToAllACDs|'publishMessageToAllACDs',{
            userId,
            buildingId,
            accessMessageOptions,
            doors,
            userContext,
        }|#1`

- <a id="evidence-204"></a>**#204** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService.publishMessageAccessUpdateToACD|publishMessageToAllACDs|userId,buildingId,door.doorId,accessMessageOptions,accessControlDevice,userContext|#1`

- <a id="evidence-205"></a>**#205** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService.publishMessageAccessInsertToACD|publishMessageToAllACDs|userId,buildingId,door.doorId,accessMessageOptions,accessControlDevice,userContext|#1`

- <a id="evidence-206"></a>**#206** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessController.default.publishMessage|publishMessageAccessInsertToACD|buildingDoorACD.accessControlDeviceId,payload|#1`

- <a id="evidence-207"></a>**#207** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|createAccess|nonAppUserId,buildingId,{
                    operation: OSKAccessMessageOperation.Insert,
                    accessId: newAccess.accessId,
                    accessRights: newAccess.accessRights,
                    creationDate: newAccess.creationDate,
                    isMainAccess: newAccess.isMainAccess,
                },newAccess.authorizedDoors,{ category: 'nonAppUser', buildingId, unitId }|#1`

- <a id="evidence-208"></a>**#208** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService.setupPubsubAccess|publishMessageAccessUpdateToACD|userId,buildingId,doorId,accessMessageOptions,userContext|#1`

- <a id="evidence-210"></a>**#210** `call_expression|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|updateAccess|userId,buildingId,{
                operation: OSKAccessMessageOperation.Update,
                accessId: updatedAccess.accessId,
                accessRights: updatedAccess.accessRights,
                creationDate: updatedAccess.creationDate,
                isMainAccess: updatedAccess.isMainAccess,
            },updatedAccess.authorizedDoors,{ category: 'oskUser' }|#1`

- <a id="evidence-211"></a>**#211** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|accessMethods.push|getAccessMethods|{
                    pincode: pincode.pincode,
                    type: 'pincode',
                }|#2`

- <a id="evidence-212"></a>**#212** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessController.default.publishMessage|publishMessageAccessRecreateToACD|acdId,payload|#1`

- <a id="evidence-213"></a>**#213** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|accessMethods.push|getAccessMethods|{
                    pincode: pincode.pincode,
                    type: 'pincode',
                }|#1`

- <a id="evidence-215"></a>**#215** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|activeDeviceAccess.forEach|getAccessMethods|(doc) => {
                accessMethods.push({
                    deviceId: doc.deviceId,
                    type: doc.type,
                });
            }|#1`

- <a id="evidence-217"></a>**#217** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|accessMethods.push|getAccessMethods|{
                    pincode: pincode.pincode,
                    type: 'pincode',
                }|#3`

- <a id="evidence-218"></a>**#218** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessController.default.publishMessage|publishMessageAccessDeleteToACD|buildingDoorACD.accessControlDeviceId,payload|#1`

- <a id="evidence-220"></a>**#220** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|accessMethods.push|getAccessMethods|{
                    deviceId: doc.deviceId,
                    type: doc.type,
                }|#1`

- <a id="evidence-221"></a>**#221** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService.setupPubsubAccess|publishMessageAccessInsertToACD|userId,buildingId,doorId,accessMessageOptions,userContext|#1`

- <a id="evidence-222"></a>**#222** `service_method|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService|publishMessageAccessDeleteToACD|#1`

- <a id="evidence-223"></a>**#223** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService.publishMessageAccessDeleteToACD|publishMessageToAllACDs|userId,buildingId,door.doorId,accessMessageOptions,accessControlDevice|#1`

- <a id="evidence-224"></a>**#224** `service_method|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService|publishMessageAccessUpdateToACD|#1`

- <a id="evidence-225"></a>**#225** `service_method|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService|publishMessageAccessInsertToACD|#1`

- <a id="evidence-226"></a>**#226** `service_method|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|OSKAccessMessagePublisherService|publishMessageAccessRecreateToACD|#1`

- <a id="evidence-227"></a>**#227** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|accessMessageOptions.creationDate.toDate|publishMessageAccessDeleteToACD||#1`

- <a id="evidence-228"></a>**#228** `call_expression|core|functions/src/modules/core/modules/access/services/access_update.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|removeDoorFromUserAccesses|access.userId,buildingId,{
                        operation: OSKAccessMessageOperation.Update,
                        accessId: updatedAccess.accessId,
                        accessRights: updatedAccess.accessRights,
                        creationDate: updatedAccess.creationDate,
                        isMainAccess: updatedAccess.isMainAccess,
                    },updatedAccess.authorizedDoors|#1`

- <a id="evidence-229"></a>**#229** `call_expression|supplier|functions/src/modules/supplier/modules/supplierStaff/services/supplier_staff.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|_deleteAccessSideEffects|staffId,buildingId,{
                operation: OSKAccessMessageOperation.Delete,
                accessId: access.accessId,
                creationDate: access.creationDate,
            },access.authorizedDoors|#1`

- <a id="evidence-230"></a>**#230** `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|_deleteAccessSideEffects|nonAppUserId,buildingId,{
                operation: OSKAccessMessageOperation.Delete,
                accessId: access.accessId,
                creationDate: access.creationDate,
            },access.authorizedDoors,{ category: 'nonAppUser', buildingId, unitId }|#1`

- <a id="evidence-231"></a>**#231** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|new Date().toISOString|publishMessageAccessDeleteToACD||#1`

- <a id="evidence-232"></a>**#232** `call_expression|core|functions/src/modules/core/modules/access/services/access_update.service.ts|OSKAccessMessagePublisherService.publishMessageToAllACDs|removeAccessControlDeviceFromUserAccessesDoor|access.userId,buildingId,{
                        operation: OSKAccessMessageOperation.Update,
                        accessId: updatedAccess.accessId,
                        accessRights: updatedAccess.accessRights,
                        creationDate: updatedAccess.creationDate,
                        isMainAccess: updatedAccess.isMainAccess,
                    },updatedAccess.authorizedDoors|#1`

- <a id="evidence-233"></a>**#233** `external_hook|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|acdId|#1`

- <a id="evidence-234"></a>**#234** `call_expression|core|functions/src/modules/core/modules/access/services/access_message_publisher.service.ts|accessMessageOptions.creationDate.toDate().toISOString|publishMessageAccessDeleteToACD||#1`

- <a id="evidence-235"></a>**#235** `source_class|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|OSKAccessController`

- <a id="evidence-236"></a>**#236** `source_class|user|functions/src/modules/user/modules/user_access/controllers/user_accesses.controller.ts|OSKUserAccessesController`

- <a id="evidence-237"></a>**#237** `source_class|admin|functions/src/modules/admin/modules/admin_users/controllers/admin_user_access.controller.ts|OSKAdminUserAccessController`

- <a id="evidence-239"></a>**#239** `source_class|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device.controller.ts|OSKAccessControlDeviceController`

- <a id="evidence-240"></a>**#240** `source_class|user|functions/src/modules/user/modules/user_device/controllers/user_device_access_control_device_token.controller.ts|OSKUserDeviceAccessControlDeviceTokenController`

- <a id="evidence-241"></a>**#241** `source_class|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts|OSKAccessControlDeviceConfigController`

- <a id="evidence-242"></a>**#242** `source_class|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device_access_commands.controller.ts|OSKAccessControlDeviceAccessCommandsController`

- <a id="evidence-243"></a>**#243** `source_class|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device_state.controller.ts|OSKAccessControlDeviceStateController`

- <a id="evidence-244"></a>**#244** `source_class|supplier|functions/src/modules/supplier/modules/supplierStaff/controllers/supplier_staff_access.controller.ts|OSKSupplierStaffAccessController`

- <a id="evidence-245"></a>**#245** `source_class|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/controllers/access_control_device.controllers.ts|OSKAccessControlDeviceController`

- <a id="evidence-246"></a>**#246** `source_class|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts|OSKAccessControlDevicePublicKeysController`

- <a id="evidence-247"></a>**#247** `source_class|building|functions/src/modules/building/modules/building_door/controllers/building_door_access_control_device.controller.ts|OSKBuildingDoorAccessControlDeviceController`

- <a id="evidence-248"></a>**#248** `source_class|building|functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts|OSKBuildingAccessesController`

- <a id="evidence-249"></a>**#249** `source_class|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device_system_logs.controller.ts|OSKAccessControlDeviceSystemLogsController`

- <a id="evidence-250"></a>**#250** `source_class|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_access.controller.ts|OSKNonAppUserAccessController`

- <a id="evidence-252"></a>**#252** `source_class|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/controllers/access_control_device_public_keys.controllers.ts|OSKAccessControlDeviceController`

- <a id="evidence-253"></a>**#253** `source_class|user|functions/src/modules/user/modules/user_access/controllers/user_building_unit.controller.ts|OSKUserBuildingUnitController`

- <a id="evidence-255"></a>**#255** `controller_method|core|functions/src/modules/core/controllers/message.controller.ts|OSKMessageController|_publishMessage|#1`

- <a id="evidence-256"></a>**#256** `call_expression|core|functions/src/modules/core/controllers/document_and_message.controller.ts|this._publishMessage|publishMessage|topic,orderingKey,body|#1`

- <a id="evidence-257"></a>**#257** `call_expression|core|functions/src/modules/core/controllers/document_and_message.controller.ts|this.messageController.publishMessage|_publishMessage|topic,orderingKey,body|#1`

- <a id="evidence-258"></a>**#258** `call_expression|core|functions/src/modules/core/controllers/message.controller.ts|pubSub.topic(topicName).publishMessage|_publishMessage|{
                    data: dataBuffer,
                    orderingKey: orderingKey,
                }|#1`

- <a id="evidence-259"></a>**#259** `controller_method|core|functions/src/modules/core/controllers/document_and_message.controller.ts|OSKDocumentAndMessageController|_publishMessage|#1`

- <a id="evidence-260"></a>**#260** `call_expression|core|functions/src/modules/core/controllers/message.controller.ts|pubSub.topic|_publishMessage|topicName|#1`

- <a id="evidence-261"></a>**#261** `class_method|core|functions/src/modules/core/controllers/document_and_message.controller.ts|OSKMessageControllerInternal|publishMessage|#1`

- <a id="evidence-262"></a>**#262** `call_expression|core|functions/src/modules/core/controllers/message.controller.ts|OSKMessageController.logger.logInfo|_publishMessage|`Message with id ${messageId} published to topic ${topicName} successfully.`|#1`

- <a id="evidence-263"></a>**#263** `controller_method|core|functions/src/modules/core/modules/access/controllers/access.controller.ts|OSKAccessController|publishMessage|#1`

- <a id="evidence-265"></a>**#265** `call_expression|core|functions/src/modules/core/controllers/message.controller.ts|JSON.stringify|_publishMessage|body|#1`

- <a id="evidence-266"></a>**#266** `call_expression|core|functions/src/modules/core/controllers/message.controller.ts|Buffer.from|_publishMessage|JSON.stringify(body)|#1`

- <a id="evidence-267"></a>**#267** `call_expression|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|OSKBuildingIntercomController.default._publishMessage|publishMessage|topicName,acdId,payload|#1`

- <a id="evidence-268"></a>**#268** `controller_method|building|functions/src/modules/building/modules/building_intercom/controllers/building_intercom.controller.ts|OSKBuildingIntercomController|publishMessage|#1`

- <a id="evidence-269"></a>**#269** `call_expression|core|functions/src/modules/core/controllers/message.controller.ts|OSKMessageController.logger.logError|_publishMessage|`Error publishing message to topic ${topicName}`,{ error }|#1`

- <a id="evidence-271"></a>**#271** `call_expression|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device_public_keys.controller.ts|OSKAccessControlDevicePublicKeysController.default._publishMessage|publish|'accessControlDeviceConfigs',deviceId,{
            deviceId,
            keyType,
            ...payload,
        }|#1`

- <a id="evidence-273"></a>**#273** `call_expression|access_control_device|functions/src/modules/access_control_device/controllers/access_control_device_config.controller.ts|OSKAccessControlDeviceConfigController.default._publishMessage|publishConfig|topicName,accessControlDeviceId,payload|#1`

- <a id="evidence-299"></a>**#299** `api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getAllOrganizationInhabitants|#1`

- <a id="evidence-300"></a>**#300** `service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getInhabitantsForOrganization|#1`

- <a id="evidence-301"></a>**#301** `source_class|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService`

- <a id="evidence-302"></a>**#302** `api_contract|organization|functions/src/modules/organization/modules/organization_inhabitant/index.ts|getInhabitantDetailsById|#1`

- <a id="evidence-303"></a>**#303** `service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getAllOrganizationInhabitants|#1`

- <a id="evidence-305"></a>**#305** `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService.getInhabitantsForOrganization|getAllOrganizationInhabitants|organizationId|#1`

- <a id="evidence-306"></a>**#306** `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationBuildingController.default.getAll|getInhabitantsForOrganization|organizationId|#1`

- <a id="evidence-307"></a>**#307** `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantController.default.queryInhabitants|getInhabitantsForOrganization|'inhabitants',queryFilter|#1`

- <a id="evidence-308"></a>**#308** `controller_method|organization|functions/src/modules/organization/modules/organization_inhabitant/controllers/organization_inhabitant.controller.ts|OSKOrganizationInhabitantController|queryInhabitants|#1`

- <a id="evidence-309"></a>**#309** `source_class|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService`

- <a id="evidence-310"></a>**#310** `service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getInhabitantDetailsById|#1`

- <a id="evidence-311"></a>**#311** `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|inhabitantList.push|getInhabitantsForOrganization|mappedInhabitantData|#1`

- <a id="evidence-312"></a>**#312** `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|Promise.all|getInhabitantsForOrganization|promises|#1`

- <a id="evidence-313"></a>**#313** `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService.getInhabitantDetailsByUserId|getInhabitantDetailsById|organizationId,userId|#1`

- <a id="evidence-314"></a>**#314** `service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|mapInhabitantData|#1`

- <a id="evidence-316"></a>**#316** `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|getOnboardingDetails|#1`

- <a id="evidence-317"></a>**#317** `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|getAllResidents|#1`

- <a id="evidence-318"></a>**#318** `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|_getInhabitantType|#1`

- <a id="evidence-319"></a>**#319** `call_expression|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|orgBuildings.map|getInhabitantsForOrganization|(building) => building.buildingId|#1`

- <a id="evidence-320"></a>**#320** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|getAllResidents|#1`

- <a id="evidence-321"></a>**#321** `source_class|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService`

- <a id="evidence-322"></a>**#322** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|getResidentDetails|#1`

- <a id="evidence-323"></a>**#323** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|getAllResidentsByPropertyId|#1`

- <a id="evidence-324"></a>**#324** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|bulkCreateResidents|#1`

- <a id="evidence-325"></a>**#325** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|createResidents|#1`

- <a id="evidence-326"></a>**#326** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKResidentsDocumentResponse|residents|#1`

- <a id="evidence-327"></a>**#327** `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|updateResident|#1`

- <a id="evidence-328"></a>**#328** `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|bulkCreateResidents|#1`

- <a id="evidence-329"></a>**#329** `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|createResidents|#1`

- <a id="evidence-330"></a>**#330** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|getallResidentsByPropertyIdCallable|#1`

- <a id="evidence-331"></a>**#331** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsController.default.getAll|getAllResidents|organizationId|#1`

- <a id="evidence-332"></a>**#332** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|_toResidentResponseDoc|#1`

- <a id="evidence-333"></a>**#333** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|residentId|#1`

- <a id="evidence-334"></a>**#334** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService.createNonAppUserResident|createResidents|organizationId,organizationUserId,onboardingCards|#1`

- <a id="evidence-336"></a>**#336** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationOnboardingInhabitantController.default.update|updateResident|request.organizationId,residentDoc.residentId,data|#1`

- <a id="evidence-337"></a>**#337** `controller_method|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_inhabitant.controller.ts|OSKBuildingUnitInhabitantController|update|#1`

- <a id="evidence-338"></a>**#338** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsController.default.update|updateResident|request.organizationId,request.residentId,data|#1`

- <a id="evidence-339"></a>**#339** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKBuildingUnitInhabitantController.default.update|updateResident|residentDoc.buildingId,residentDoc.unitId,residentDoc.userId,{
                    ...request,
                }|#1`

- <a id="evidence-341"></a>**#341** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKSecurityChecks.checkParameters|updateResident|[
            { name: 'context', value: context, type: 'object' },
            { name: 'firstName', value: request.firstName, type: 'string' },
            { name: 'lastName', value: request.lastName, type: 'string' },
            { name: 'inhabitantType', value: request.inhabitantType, type: 'string', isOptional: true },
            { name: 'organizationId', value: request.organizationId, type: 'string' },
            { name: 'residentId', value: request.residentId, type: 'string' },
        ]|#1`

- <a id="evidence-342"></a>**#342** `controller_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/controllers/organization_onboarding_inhabitant.controller.ts|OSKOrganizationOnboardingInhabitantController|update|#1`

- <a id="evidence-343"></a>**#343** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts|OSKOrganizationResidentsController.default._update|update|collectionPath,residentId,data|#1`

- <a id="evidence-345"></a>**#345** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsController.default.get|updateResident|request.organizationId,request.residentId|#1`

- <a id="evidence-346"></a>**#346** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKUserSecurityChecks|updateResident|{ checkUserIdMatch: false }|#1`

- <a id="evidence-347"></a>**#347** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationOnboardingInhabitantController.default.get|updateResident|request.organizationId,residentDoc.residentId|#1`

- <a id="evidence-354"></a>**#354** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|organizationId|#1`

- <a id="evidence-355"></a>**#355** `type_alias|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentDocument|#1`

- <a id="evidence-356"></a>**#356** `type_alias|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentResponseDocument|#1`

- <a id="evidence-357"></a>**#357** `type_alias|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResident|#1`

- <a id="evidence-358"></a>**#358** `type_alias|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKGetOrganizationResidentDetailsRequestData|#1`

- <a id="evidence-359"></a>**#359** `type_alias|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKResidentsDocumentResponse|#1`

- <a id="evidence-360"></a>**#360** `source_class|organization|functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts|OSKOrganizationResidentsController`

- <a id="evidence-361"></a>**#361** `type_alias|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentUpdate|#1`

- <a id="evidence-362"></a>**#362** `type_alias|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentResponse|#1`

- <a id="evidence-363"></a>**#363** `type_alias|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKUpdateOrganizationResidentRequest|#1`

- <a id="evidence-364"></a>**#364** `type_alias|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKGetAllOrganizationResidentsRequestData|#1`

- <a id="evidence-365"></a>**#365** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKResidentsDocumentDeleteRequest|organizationId|#1`

- <a id="evidence-366"></a>**#366** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|streetAddress|#1`

- <a id="evidence-367"></a>**#367** `type_alias|organization|functions/src/modules/organization/modules/organization_inhabitant/models/documents/organization_inhabitant_document.model.ts|OSKPmpResidentsDocument|#1`

- <a id="evidence-368"></a>**#368** `type_alias|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/functions/organization_onboarding_inhabitant_request_document.ts|OSKBulkCreateResidentResult|#1`

- <a id="evidence-369"></a>**#369** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKUpdateOrganizationResidentRequest|organizationId|#1`

- <a id="evidence-370"></a>**#370** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKUpdateOrganizationResidentRequest|residentId|#1`

- <a id="evidence-372"></a>**#372** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKGetOrganizationResidentDetailsRequestData|organizationId|#1`

- <a id="evidence-373"></a>**#373** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|email|#1`

- <a id="evidence-374"></a>**#374** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|isOnboarded|#1`

- <a id="evidence-375"></a>**#375** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|lastName|#1`

- <a id="evidence-376"></a>**#376** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|unitId|#1`

- <a id="evidence-377"></a>**#377** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|isAppUser|#1`

- <a id="evidence-378"></a>**#378** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|phoneNumber|#1`

- <a id="evidence-379"></a>**#379** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|firstName|#1`

- <a id="evidence-380"></a>**#380** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|buildingId|#1`

- <a id="evidence-381"></a>**#381** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|activationCode|#1`

- <a id="evidence-382"></a>**#382** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|floor|#1`

- <a id="evidence-383"></a>**#383** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|userId|#1`

- <a id="evidence-384"></a>**#384** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|unitName|#1`

- <a id="evidence-385"></a>**#385** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|buildingName|#1`

- <a id="evidence-386"></a>**#386** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|isUserConsent|#1`

- <a id="evidence-387"></a>**#387** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.scheduleTask|createIntercomCommunication|activationExecutionDate,{
                                        taskType: 'activateIntercomCommunicationTask',
                                        data: {
                                            organizationId,
                                            buildingId,
                                            communicationId,
                                            communicationType: channelType,
                                        },
                                    },targetUrl|#1`

- <a id="evidence-388"></a>**#388** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.scheduleTask|createIntercomCommunication|new Date(),{
                                taskType: 'activateIntercomCommunicationTask',
                                data: {
                                    organizationId,
                                    buildingId,
                                    communicationId,
                                    communicationType: channelType,
                                },
                            },targetUrl|#1`

- <a id="evidence-389"></a>**#389** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.scheduleTask|createIntercomCommunication|pushActivationExecutionDate,{
                                        taskType: 'activateIntercomCommunicationTask',
                                        data: {
                                            organizationId,
                                            buildingId,
                                            communicationId,
                                            communicationType: channelType,
                                        },
                                    },targetUrl|#1`

- <a id="evidence-390"></a>**#390** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.scheduleTask|createIntercomCommunication|deactivationExecutionDate,{
                                        taskType: 'deactivateIntercomCommunicationTask',
                                        data: {
                                            organizationId,
                                            buildingId,
                                            communicationId,
                                            communicationType: channelType,
                                        },
                                    },targetUrl|#1`

- <a id="evidence-391"></a>**#391** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService.logger.logInfo|cancelTask|`[TaskScheduler] Successfully canceled task: ${taskId}`|#1`

- <a id="evidence-392"></a>**#392** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService.logger.logWarning|cancelTask|`[TaskScheduler] Failed to cancel task ${taskId}. It may have already executed or been deleted.`,{ error }|#1`

- <a id="evidence-393"></a>**#393** `model_property|tasks|functions/src/modules/tasks/models/tasks.model.ts|OSKIntercomCommunicationTaskPayload|organizationId|#1`

- <a id="evidence-394"></a>**#394** `model_property|tasks|functions/src/modules/tasks/models/tasks.model.ts|OSKIntercomCommunicationTaskPayload|communicationType|#1`

- <a id="evidence-395"></a>**#395** `type_alias|access_control_device|functions/src/modules/access_control_device/models/messages/access_control_device_message.model.ts|OSKAddPayload|#1`

- <a id="evidence-396"></a>**#396** `type_alias|access_control_device|functions/src/modules/access_control_device/models/shared/access_control_device_token_payload.model.ts|OSKAccessControlDeviceTokenPayloadData|#1`

- <a id="evidence-397"></a>**#397** `type_alias|core|functions/src/modules/core/models/documents/pub_sub_receiver.model.ts|OSKPubSubMessageData|#1`

- <a id="evidence-398"></a>**#398** `model_property|tasks|functions/src/modules/tasks/models/tasks.model.ts|OSKIntercomCommunicationTaskPayload|communicationId|#1`

- <a id="evidence-399"></a>**#399** `model_property|tasks|functions/src/modules/tasks/models/tasks.model.ts|OSKIntercomCommunicationTaskPayload|buildingId|#1`

- <a id="evidence-400"></a>**#400** `type_alias|core|functions/src/modules/core/services/logging.service.ts|OSKLogJsonPayload|#1`

- <a id="evidence-401"></a>**#401** `type_alias|access_control_device|functions/src/modules/access_control_device/models/messages/access_control_device_public_keys_message.model.ts|OSKUpdatePayload|#1`

- <a id="evidence-402"></a>**#402** `model_property|core|functions/src/modules/core/services/logging.service.ts|OSKLogEntry|jsonPayload|#1`

- <a id="evidence-403"></a>**#403** `model_property|tasks|functions/src/modules/tasks/models/pincode_refresh_task.model.ts|OSKPincodeRefreshTaskPayload|unitId|#1`

- <a id="evidence-404"></a>**#404** `source_class|access_control_device|functions/src/modules/access_control_device/models/shared/access_control_device_token_payload.model.ts|OSKAccessControlDeviceTokenPayload`

- <a id="evidence-405"></a>**#405** `model_property|tasks|functions/src/modules/tasks/models/pincode_refresh_task.model.ts|OSKPincodeRefreshTaskPayload|oldPincode|#1`

- <a id="evidence-407"></a>**#407** `model_property|tasks|functions/src/modules/tasks/models/pincode_refresh_task.model.ts|OSKPincodeRefreshTaskPayload|buildingId|#1`

- <a id="evidence-408"></a>**#408** `type_alias|access_control_device|functions/src/modules/access_control_device/models/messages/access_control_device_message.model.ts|OSKRemovePayload|#1`

- <a id="evidence-409"></a>**#409** `type_alias|core|functions/src/modules/core/models/documents/pub_sub_receiver.model.ts|OSKPubSubMessage|#1`

- <a id="evidence-410"></a>**#410** `source_file|tasks|functions/src/modules/tasks/models/tasks.model.ts|functions/src/modules/tasks/models/tasks.model.ts`

- <a id="evidence-411"></a>**#411** `imports_dependency|tasks|functions/src/modules/tasks/services/task_handler.service.ts|../models/tasks.model|#1`

- <a id="evidence-412"></a>**#412** `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|../../../../../tasks/models/tasks.model|#1`

- <a id="evidence-413"></a>**#413** `imports_dependency|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|../../../../tasks/models/tasks.model|#1`

- <a id="evidence-414"></a>**#414** `imports_dependency|tasks|functions/src/modules/tasks/models/tasks.model.ts|./pincode_refresh_task.model|#1`

- <a id="evidence-415"></a>**#415** `source_file|tasks|functions/src/modules/tasks/models/pincode_refresh_task.model.ts|functions/src/modules/tasks/models/pincode_refresh_task.model.ts`

- <a id="evidence-416"></a>**#416** `source_file|tasks|functions/src/modules/tasks/index.ts|functions/src/modules/tasks/index.ts`

- <a id="evidence-417"></a>**#417** `imports_dependency|tasks|functions/src/modules/tasks/index.ts|./services/task_handler.service|#1`

- <a id="evidence-418"></a>**#418** `source_file|tasks|functions/src/modules/tasks/services/task_handler.service.ts|functions/src/modules/tasks/services/task_handler.service.ts`

- <a id="evidence-419"></a>**#419** `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/db_pincodes.service.ts|../../../../../tasks/models/pincode_refresh_task.model|#1`

- <a id="evidence-420"></a>**#420** `imports_dependency|admin|functions/src/modules/admin/modules/admin_maintenance/db_pincodes/services/pincode_refresh_worker.service.ts|../../../../../tasks/models/pincode_refresh_task.model|#1`

- <a id="evidence-421"></a>**#421** `source_file|core|functions/src/modules/core/models/documents/document.model.ts|functions/src/modules/core/models/documents/document.model.ts`

- <a id="evidence-422"></a>**#422** `imports_dependency|tasks|functions/src/modules/tasks/index.ts|firebase-functions/v1|#1`

- <a id="evidence-423"></a>**#423** `imports_dependency|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|@google-cloud/tasks|#1`

- <a id="evidence-424"></a>**#424** `type_alias|organization|functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts|OSKCommunicationSchedule|#1`

- <a id="evidence-425"></a>**#425** `model_property|organization|functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts|OSKIntercomCommunicationMessage|deactivationTaskId|#1`

- <a id="evidence-426"></a>**#426** `call_expression|tasks|functions/src/modules/tasks/services/task_scheduler.service.ts|OSKTaskSchedulerService.tasksClient.deleteTask|cancelTask|{ name: taskId }|#1`

- <a id="evidence-427"></a>**#427** `model_property|organization|functions/src/modules/organization/modules/organization_intercom_ communication/models/documents/organization_intercom_communication.model.ts|OSKIntercomCommunicationMessage|activationTaskId|#1`

- <a id="evidence-428"></a>**#428** `call_expression|organization|functions/src/modules/organization/modules/organization_intercom_ communication/services/organization_intercom_communication.service.ts|OSKTaskSchedulerService.cancelTask(taskId).catch|createIntercomCommunication|() => {}|#1`

- <a id="evidence-429"></a>**#429** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKBuildingUnitInhabitantController.default.delete|deleteAppUserResident|buildingId,unitId,userId|#1`

- <a id="evidence-430"></a>**#430** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationOnboardingInhabitantController.default.delete|createAppUserResident|organizationId,onboardingDocument.onboardingId|#1`

- <a id="evidence-431"></a>**#431** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKUserPincodeController.default.delete|deleteAppUserResident|pincodeDoc.pincode,userId|#1`

- <a id="evidence-432"></a>**#432** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|createAppUserResident|#1`

- <a id="evidence-433"></a>**#433** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|_cleanupInvitedNonAppUsers|#1`

- <a id="evidence-434"></a>**#434** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKBuildingUnitNonAppUserController.default.delete|_deleteNonAppUserResident|buildingId,unitId,nonAppUserId|#1`

- <a id="evidence-435"></a>**#435** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKSecurityChecks.app_check|deleteResident|context|#1`

- <a id="evidence-436"></a>**#436** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService._deleteResidentFromOrganization|deleteResident|request|#1`

- <a id="evidence-437"></a>**#437** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|nonAppUserController.delete|createNonAppUserResident|buildingId,unitId,nonAppUserId|#2`

- <a id="evidence-438"></a>**#438** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKUserAccessesController.default.getAll|deleteAppUserResident|userId|#1`

- <a id="evidence-439"></a>**#439** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|nonAppUserController.delete|createNonAppUserResident|buildingId,unitId,nonAppUserId|#1`

- <a id="evidence-440"></a>**#440** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKPincodeService.deleteBuildingPincodeAndMoveToTrash|deleteAppUserResident|pincodeDoc.pincode,accessBuildingId|#1`

- <a id="evidence-441"></a>**#441** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKBuildingIntercomService.deleteIntercomEntryUser|deleteAppUserResident|buildingId,unitId,userId|#1`

- <a id="evidence-442"></a>**#442** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsController.default.delete|_deleteResidentFromOrganization|request|#1`

- <a id="evidence-443"></a>**#443** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/controllers/organization_residents.controller.ts|OSKOrganizationResidentsController.default._delete|delete|collectionPath,data.residentId|#1`

- <a id="evidence-444"></a>**#444** `model_property|core|functions/src/modules/core/modules/access/models/functions/access_messages.model.ts|OSKAccessMessageDelete|operation|#1`

- <a id="evidence-445"></a>**#445** `model_property|core|functions/src/modules/core/modules/access/models/functions/access_messages.model.ts|OSKAccessMessageUpdate|operation|#1`

- <a id="evidence-446"></a>**#446** `model_property|core|functions/src/modules/core/modules/access/models/functions/access_messages.model.ts|OSKAccessMessageInsert|operation|#1`

- <a id="evidence-447"></a>**#447** `model_property|user|functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts|OSKUserAccessesMessageDelete|operation|#1`

- <a id="evidence-448"></a>**#448** `model_property|user|functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts|OSKUserAccessesMessageUpdate|operation|#1`

- <a id="evidence-449"></a>**#449** `model_property|user|functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts|OSKUserAccessesMessageInsert|operation|#1`

- <a id="evidence-450"></a>**#450** `model_property|access_control_device|functions/src/modules/access_control_device/models/messages/access_control_device_config_message.model.ts|OSKAccessControlDeviceConfigMessage|operation|#1`

- <a id="evidence-451"></a>**#451** `model_property|user|functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts|OSKMaintenanceAccessesMessageRecreate|operation|#1`

- <a id="evidence-452"></a>**#452** `type_alias|user|functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts|OSKUserAccessesMessageUpdate|#1`

- <a id="evidence-454"></a>**#454** `model_property|building|functions/src/modules/building/modules/building_intercom/models/messages/building_intercom_messages.model.ts|OSKBuildingIntercomPubsubMessageBase|operation|#1`

- <a id="evidence-455"></a>**#455** `function_declaration|core|functions/src/modules/core/models/shared/entity_message.model.ts|OSKIsOperationPresent|#1`

- <a id="evidence-456"></a>**#456** `enum_declaration|building|functions/src/modules/building/modules/building_intercom/models/messages/building_intercom_messages.model.ts|OSKOperationType|#1`

- <a id="evidence-457"></a>**#457** `model_property|core|functions/src/modules/core/models/shared/entity_message.model.ts|OSKUpdateEntityMessageOptions|operation|#1`

- <a id="evidence-458"></a>**#458** `type_alias|access_control_device|functions/src/modules/access_control_device/models/messages/access_control_device_message.model.ts|OSKAccessControlDeviceMessage|#1`

- <a id="evidence-459"></a>**#459** `type_alias|core|functions/src/modules/core/modules/access/models/functions/access_messages.model.ts|OSKAccessMessageDelete|#1`

- <a id="evidence-460"></a>**#460** `model_property|user|functions/src/modules/user/modules/user_access/models/messages/user_accesses_message.model.ts|OSKUserAccessesMessageDelete|access|#1`

- <a id="evidence-461"></a>**#461** `model_property|access_control_device|functions/src/modules/access_control_device/models/messages/access_control_device_message.model.ts|OSKAddPayload|action|#1`

- <a id="evidence-462"></a>**#462** `model_property|core|functions/src/modules/core/models/shared/entity_message.model.ts|OSKInsertEntityMessageOptions|operation|#1`

- <a id="evidence-463"></a>**#463** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|axios.default.delete|delete|url|#1`

- <a id="evidence-464"></a>**#464** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|axios.default.delete|delete|url,{
                headers: { authorization: `Bearer ${token}` },
            }|#1`

- <a id="evidence-465"></a>**#465** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|this.token|delete|url,{ subject: options?.subject }|#1`

- <a id="evidence-468"></a>**#468** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/services/node_iot_api.service.ts|this.url|delete|path|#1`

- <a id="evidence-469"></a>**#469** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/controllers/access_control_device.controllers.ts|this.endpoint.delete|unregister|`devices/${deviceId}`,{
            subject: `device.unregister(${deviceId})`,
        }|#1`

- <a id="evidence-470"></a>**#470** `call_expression|access_control_device|functions/src/modules/access_control_device/api/node-iot-api/controllers/access_control_device_public_keys.controllers.ts|this.endpoint.delete|unregister|`devices/${deviceId}`,{
            subject: `device.unregister(${deviceId})`,
        }|#1`

- <a id="evidence-472"></a>**#472** `call_expression|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/controllers/building_unit_nonAppUser_access.controller.ts|OSKNonAppUserAccessController.default._delete|delete|OSKNonAppUserAccessController.default.getCollectionPath(buildingId, unitId, nonAppUserId),buildingAccessId|#1`

</sub>

</details>

<details>
<summary>node-iot-api-oskey-io (20)</summary>

<sub>

- <a id="evidence-166"></a>**#166** `type_alias|access_control_device|src/v1/models/access_control_device_access_method.model.ts|OSKAccessMethod|#1`

- <a id="evidence-194"></a>**#194** `model_property|access_control_device|src/v1/models/access_control_device_access.model.ts|OSKAccessControlDeviceAccessDelete|accessId|#1`

- <a id="evidence-203"></a>**#203** `call_expression|access_control_device|src/v1/core/shared/pubsub.service.ts|console.info|publishMessage|`Message ${messageId} published to topic ${topicName} successfully.`|#1`

- <a id="evidence-209"></a>**#209** `call_expression|access_control_device|src/v1/core/shared/pubsub.service.ts|this.pubSub.topic(topicName).publishMessage|publishMessage|{
                data: dataBuffer,
                orderingKey: orderingKey,
            }|#1`

- <a id="evidence-214"></a>**#214** `call_expression|access_control_device|src/v1/core/shared/pubsub.service.ts|console.error|publishMessage|`Error publishing message to topic ${topicName}:`,err|#1`

- <a id="evidence-216"></a>**#216** `call_expression|access_control_device|src/v1/core/shared/pubsub.service.ts|this.pubSub.topic|publishMessage|topicName|#1`

- <a id="evidence-219"></a>**#219** `source_class|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService`

- <a id="evidence-238"></a>**#238** `source_class|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|OSKAccessControlDeviceAccessController`

- <a id="evidence-251"></a>**#251** `source_class|access_control_device|src/v1/controllers/access_control_device_access_sync.controller.ts|OSKAccessControlDeviceAccessSyncController`

- <a id="evidence-254"></a>**#254** `source_class|access_control_device|src/v1/controllers/access_control_device_activities.controller.ts|OSKAccessControlDeviceActivitiesController`

- <a id="evidence-264"></a>**#264** `service_method|access_control_device|src/v1/core/shared/pubsub.service.ts|OSKPubSubService|publishMessage|#1`

- <a id="evidence-270"></a>**#270** `call_expression|access_control_device|src/v1/core/shared/pubsub.service.ts|JSON.stringify|publishMessage|body|#1`

- <a id="evidence-272"></a>**#272** `call_expression|access_control_device|src/v1/core/shared/pubsub.service.ts|Buffer.from|publishMessage|JSON.stringify(body)|#1`

- <a id="evidence-274"></a>**#274** `call_expression|access_control_device|src/v1/handlers/routes/access_control_device_activities_route.handler.ts|pubSubService.publishMessage|_processActivity|'accessControlDevice_activities',activity.accessControlDeviceId,{ type: 'activities', entity: data }|#1`

- <a id="evidence-453"></a>**#453** `model_property|access_control_device|src/v1/models/access_control_device_access.model.ts|OSKAccessControlDeviceAccessPubSubPayloadBase|operation|#1`

- <a id="evidence-466"></a>**#466** `type_alias|access_control_device|src/v1/models/access_control_device_access.model.ts|OSKAccessControlDeviceAccessDelete|#1`

- <a id="evidence-467"></a>**#467** `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|console.info|deleteAccess|'Access record deleted successfully!'|#1`

- <a id="evidence-471"></a>**#471** `call_expression|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|console.error|deleteAccess|'Error deleting access:',error|#1`

- <a id="evidence-473"></a>**#473** `model_property|access_control_device|src/v1/models/access_control_device_access.model.ts|OSKAccessControlDeviceAccessDelete|doorId|#1`

- <a id="evidence-474"></a>**#474** `model_property|access_control_device|src/v1/models/access_control_device_access.model.ts|OSKAccessControlDeviceAccessDelete|userId|#1`

</sub>

</details>

### Cost

<a id="cost-detail"></a>**$0.1161** — approx., this document's own Vertex AI token cost only, computed from real-time pricing (live Cloud Billing Catalog API lookup, prices effective as of 2026-09-08 07:00 UTC); excludes subscriptions, infra, and other real overhead. [↩](#cite-cost)
