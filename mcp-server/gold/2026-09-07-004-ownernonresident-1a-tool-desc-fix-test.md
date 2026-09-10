# Agent PRD — ownernonresident-1a-tool-desc-fix-test

## MetaData

**Status:** Test run — atomic-prd-agent proof of concept<br>
**Persona:** `atomic-prd-agent` (governance/roadmap/mcp-direction/atomic-prd-agent-skills.md)<br>
**Model:** gemini-3.5-flash (Vertex AI, test-ai-oskey-io/global)<br>
**Snapshot freshness:** evidence below reflects:<br>
• <a id="cite-repo-1"></a>angular-app-oskey-io @ 2026-09-02 ([R1](#repo-1))<br>
• <a id="cite-repo-2"></a>firebase-oskey-dev @ 2026-09-02 ([R2](#repo-2))<br>
**Tool calls made:** search_facts: 11, walk_cluster: 5<br>
**Turns used:** 17 of 100<br>
**Run duration:** 1m 3s<br>
**Token usage:** 52,847 input, 1,931 output, 4,309 thinking, 35,617 cached (59,087 total)<br>
**Approx. document cost:** <a id="cite-cost"></a>[$0.0873](#cost-detail)

---

## Business Request

Currently the PGO supports adding a tenant or owner as a person living in a buildings unit by the Property Manager. We need a new inhabitantType in the Oskey system. The name of the new inhabitantType will be ownerNonResident. The scope of this PRD is to add the new inhabitantType without breaking the existing flows around inhabitantType. Report back an impact analysis of how this will impact the code base.

---

## User Stories

- As a Property Manager, I want add an owner non-resident as a person associated with a building's unit, so that they can manage unit records without implying the owner lives in the unit.

---

## Technical Proposal

- <a id="cite-1"></a>Update the backend type alias OSKBuildingUnitInhabitantType to include the new 'ownerNonResident' value.<br>(see [#1](#evidence-1))

- <a id="cite-2"></a>Update the frontend type alias OSKBuildingUnitInhabitantType to include the new 'ownerNonResident' value.<br>(see [#2](#evidence-2))

- <a id="cite-3"></a><a id="cite-4"></a>Update the frontend OSKBuildingUnitOwner type definition or add a corresponding type for ownerNonResident where type is 'ownerNonResident' and isResident is false.<br>(see [#3](#evidence-3), [#4](#evidence-4))

- <a id="cite-5"></a>Review and update backend checks in OSKBuildingUnitInhabitantService.addInhabitant where resident-specific logic is applied to ensure 'ownerNonResident' is excluded from resident-only features.<br>(see [#5](#evidence-5))

- <a id="cite-6"></a>Update backend checks in OSKOrganizationResidentsService.checkInhabitantTypeAndDeleteAllInhabitantresident to include 'ownerNonResident' if they share the same deletion/cleanup rules as owners.<br>(see [#6](#evidence-6))

- <a id="cite-7"></a>Update backend checks in OSKUnitManagementInhabitantService.getUnitPerson to include 'ownerNonResident' if they share the same unit access rights as owners.<br>(see [#7](#evidence-7))

- <a id="cite-8"></a>Update backend checks in OSKUnitManagementPermanentGuestService.removePermanentGuest to include 'ownerNonResident' if they share the same guest management rights as owners.<br>(see [#8](#evidence-8))

- <a id="cite-9"></a>Add the 'ownerNonResident' option to the inhabitantTypes array and update getInhabitantTypeLabel in the OSKOrganizationInhabitantsListComponent to display the correct label.<br>(see [#9](#evidence-9))

- <a id="cite-10"></a>Add the 'ownerNonResident' option to the inhabitantTypes array and update getInhabitantTypeLabel in the OSKCreateOrganizationInhabitantComponent to support creating non-resident owners.<br>(see [#10](#evidence-10))

- <a id="cite-11"></a>Add the 'ownerNonResident' option to the inhabitantTypes array and update getInhabitantTypeLabel in the OSKOrganizationInhabitantDetailsComponent to display the correct label in the details view.<br>(see [#11](#evidence-11))

---

## Acceptance Criteria

- [ ] The 'ownerNonResident' option is available in the inhabitant type dropdown when a Property Manager adds a person to a unit.

- [ ] The UI displays the correct label for 'ownerNonResident' in the inhabitants list, details view, and creation form.

- [ ] The backend successfully saves inhabitants with inhabitantType set to 'ownerNonResident'.

- [ ] Adding an 'ownerNonResident' does not trigger resident-only features (like intercom setup) if they are not marked as residents.

- [ ] Existing owner, tenant, and resident flows continue to function without any regression.

---

## Constraints

- The new inhabitant type must be named exactly 'ownerNonResident' to align with the requested scope.<br>(see [#1](#evidence-1))

- Existing flows for 'owner', 'tenant', and 'resident' must not be broken, meaning any array checks like ['owner', 'tenant'].includes(...) must be carefully reviewed to decide if 'ownerNonResident' should be included or excluded.<br>(see [#5](#evidence-5), [#6](#evidence-6))

---

## Evidence Used

### Repos

- <a id="repo-1"></a>[**R1**](#cite-repo-1) `angular-app-oskey-io@8345d222a7f9879282de7b0a49f63f4771bdc1b2` (extracted 2026-09-02) [↩](#cite-repo-1)
- <a id="repo-2"></a>[**R2**](#cite-repo-2) `firebase-oskey-dev@00e1d9fd568fab1bdcd1ad81e76b40d6b38ad4a3` (extracted 2026-09-02) [↩](#cite-repo-2)

### Fact-Ids

- <a id="evidence-1"></a>[**#1**](#cite-1) `type_alias|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_type_document.model.ts|OSKBuildingUnitInhabitantType|#1` [↩](#cite-1)
- <a id="evidence-2"></a>[**#2**](#cite-2) `type_alias|core|hosting/web-app/src/app/core/types/inhabitant/inhabitant-type.type.ts|OSKBuildingUnitInhabitantType|#1` [↩](#cite-2)
- <a id="evidence-3"></a>[**#3**](#cite-3) `model_property|core|hosting/web-app/src/app/core/types/inhabitant/inhabitant-type.type.ts|OSKBuildingUnitOwner|type|#1` [↩](#cite-3)
- <a id="evidence-4"></a>[**#4**](#cite-4) `model_property|core|hosting/web-app/src/app/core/types/inhabitant/inhabitant-type.type.ts|OSKBuildingUnitOwner|isResident|#1` [↩](#cite-4)
- <a id="evidence-5"></a>[**#5**](#cite-5) `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|['tenant', 'resident'].includes|addInhabitant|inhabitant.inhabitantType|#1` [↩](#cite-5)
- <a id="evidence-6"></a>[**#6**](#cite-6) `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|['owner', 'tenant'].includes|checkInhabitantTypeAndDeleteAllInhabitantresident|residentToDelete.inhabitantType!|#1` [↩](#cite-6)
- <a id="evidence-7"></a>[**#7**](#cite-7) `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|['owner', 'tenant'].includes|getUnitPerson|requestingInhabitant.inhabitantType|#1` [↩](#cite-7)
- <a id="evidence-8"></a>[**#8**](#cite-8) `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_permanent_guest.service.ts|['owner', 'tenant'].includes|removePermanentGuest|inhabitantDocument!.inhabitantType|#1` [↩](#cite-8)
- <a id="evidence-9"></a>[**#9**](#cite-9) `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent|getInhabitantTypeLabel|#1` [↩](#cite-9)
- <a id="evidence-10"></a>[**#10**](#cite-10) `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|OSKCreateOrganizationInhabitantComponent|getInhabitantTypeLabel|#1` [↩](#cite-10)
- <a id="evidence-11"></a>[**#11**](#cite-11) `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|OSKOrganizationInhabitantDetailsComponent|getInhabitantTypeLabel|#1` [↩](#cite-11)

### Audit Trail

155 fact(s) gathered but not cited in this document — click a repo to expand:

<details>
<summary>angular-app-oskey-io (32)</summary>

<sub>

- <a id="evidence-12"></a>**#12** `source_file|core|hosting/web-app/src/app/core/types/inhabitant/inhabitant-type.type.ts|hosting/web-app/src/app/core/types/inhabitant/inhabitant-type.type.ts`

- <a id="evidence-13"></a>**#13** `class_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|OSKOrganizationInhabitantsListComponent|getInhabitantType|#1`

- <a id="evidence-14"></a>**#14** `model_property|core|hosting/web-app/src/app/core/types/inhabitant/inhabitant-type.type.ts|OSKBuildingUnitResident|type|#1`

- <a id="evidence-16"></a>**#16** `model_property|core|hosting/web-app/src/app/core/types/inhabitant/building-unit-inhabitant.type.ts|OSKBuildingUnitInhabitant|inhabitantType|#1`

- <a id="evidence-17"></a>**#17** `exported_symbol|core|hosting/web-app/src/app/core/types/index.ts|./inhabitant/inhabitant-type.type|#1`

- <a id="evidence-18"></a>**#18** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts|OSKPmpResidentDocument|inhabitantType|#1`

- <a id="evidence-20"></a>**#20** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts|OSKPincodeInhabitantBase|type|#1`

- <a id="evidence-21"></a>**#21** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts|OSKOrganizationResidentResponseDocument|inhabitantType|#1`

- <a id="evidence-26"></a>**#26** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/onboarding-cards/types/onboarding-document.type.ts|OSKInhabitantOnboardingDocument|inhabitantType|#1`

- <a id="evidence-29"></a>**#29** `model_property|core|hosting/web-app/src/app/core/types/inhabitant/inhabitant-type.type.ts|OSKBuildingUnitTenant|type|#1`

- <a id="evidence-30"></a>**#30** `exported_symbol|core|hosting/web-app/src/app/core/types/index.ts|./inhabitant/building-unit-inhabitant.type|#1`

- <a id="evidence-32"></a>**#32** `source_file|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts`

- <a id="evidence-33"></a>**#33** `source_file|core|hosting/web-app/src/app/core/types/inhabitant/building-unit-inhabitant.type.ts|hosting/web-app/src/app/core/types/inhabitant/building-unit-inhabitant.type.ts`

- <a id="evidence-38"></a>**#38** `type_alias|core|hosting/web-app/src/app/core/types/inhabitant/building-unit-inhabitant.type.ts|OSKBuildingUnitInhabitant|#1`

- <a id="evidence-39"></a>**#39** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|this.getInhabitantType|getInhabitantTypeLabel|inhabitantType|#1`

- <a id="evidence-40"></a>**#40** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|this.inhabitantTypes.find|getInhabitantTypeLabel|(item) => item.value.type === type.toLowerCase()|#1`

- <a id="evidence-41"></a>**#41** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitant-details/organization-inhabitant-details.component.ts|this.inhabitantTypes.find|getInhabitantTypeLabel|(item) => item.value.type === type|#1`

- <a id="evidence-42"></a>**#42** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|type.toLowerCase|getInhabitantTypeLabel||#1`

- <a id="evidence-43"></a>**#43** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|this.inhabitantTypes.find|getInhabitantTypeLabel|(item) => item.value.type === type|#1`

- <a id="evidence-53"></a>**#53** `type_alias|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts|OSKPincodeInhabitantBase|#1`

- <a id="evidence-59"></a>**#59** `model_property|core|hosting/web-app/src/app/core/types/inhabitant/building-unit-inhabitant.type.ts|OSKBuildingUnitInhabitant|unitId|#1`

- <a id="evidence-60"></a>**#60** `model_property|core|hosting/web-app/src/app/core/types/inhabitant/building-unit-inhabitant.type.ts|OSKBuildingUnitInhabitant|buildingId|#1`

- <a id="evidence-63"></a>**#63** `model_property|core|hosting/web-app/src/app/core/types/inhabitant/building-unit-inhabitant.type.ts|OSKBuildingUnitInhabitant|streetAddress|#1`

- <a id="evidence-94"></a>**#94** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts|OSKOrganizationResidentResponseDocument|isOnboarded|#1`

- <a id="evidence-97"></a>**#97** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts|OSKOrganizationResidentResponseDocument|residentId|#1`

- <a id="evidence-104"></a>**#104** `source_file|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts`

- <a id="evidence-105"></a>**#105** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts|OSKOrganizationResidentResponseDocument|organizationId|#1`

- <a id="evidence-108"></a>**#108** `service_method|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|OSKOrganizationInhabitantService|createResident|#1`

- <a id="evidence-113"></a>**#113** `source_class|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/services/organization-inhabitant.service.ts|OSKOrganizationInhabitantService`

- <a id="evidence-144"></a>**#144** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.ts|doorIds.includes|anon|door.doorId|#1`

- <a id="evidence-146"></a>**#146** `model_property|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/types/inhabitant-document.type.ts|OSKDocumentListResponse|residents|#1`

- <a id="evidence-148"></a>**#148** `call_expression|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/organization-inhabitants-list/organization-inhabitants-list.component.ts|(data.unitNumber ?? '').toLowerCase().includes|loadInhabitants|searchFilter|#1`

</sub>

</details>

<details>
<summary>firebase-oskey-dev (123)</summary>

<sub>

- <a id="evidence-15"></a>**#15** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts|OSKBuildingUnitInhabitant|inhabitantType|#1`

- <a id="evidence-19"></a>**#19** `model_property|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|OSKUnitManagementPeopleResponseInhabitant|inhabitantType|#1`

- <a id="evidence-22"></a>**#22** `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKUserService._getInhabitantType|getInhabitantType|request.userId,request.buildingId,request.unitId|#1`

- <a id="evidence-23"></a>**#23** `model_property|user|functions/src/modules/user/models/functions/get_user_inhabitant_type.model.ts|OSKGetInhabitantTypeResponse|inhabitantType|#1`

- <a id="evidence-24"></a>**#24** `model_property|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/models/documents/organization_onboarding_inhabitant_document.model.ts|OSKOrganizationOnboardingInhabitant|inhabitantType|#1`

- <a id="evidence-25"></a>**#25** `model_property|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|OSKSingleUnitInhabitantResponse|inhabitantType|#1`

- <a id="evidence-27"></a>**#27** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_invitation_document.model.ts|OSKBuildingUnitInhabitantInvitation|inhabitantType|#1`

- <a id="evidence-28"></a>**#28** `model_property|user|functions/src/modules/user/modules/user_settings/models/documents/user_unit_settings.model.ts|OSKUserSettingsUnit|inhabitantType|#1`

- <a id="evidence-31"></a>**#31** `model_property|user|functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model.ts|OSKInhabitantAccess|type|#1`

- <a id="evidence-34"></a>**#34** `type_alias|user|functions/src/modules/user/models/functions/get_user_inhabitant_type.model.ts|OSKGetInhabitantTypeResponse|#1`

- <a id="evidence-35"></a>**#35** `source_file|user|functions/src/modules/user/models/functions/get_user_inhabitant_type.model.ts|functions/src/modules/user/models/functions/get_user_inhabitant_type.model.ts`

- <a id="evidence-36"></a>**#36** `source_file|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_type_document.model.ts|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_type_document.model.ts`

- <a id="evidence-37"></a>**#37** `type_alias|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|OSKUnitManagementPeopleResponseInhabitant|#1`

- <a id="evidence-44"></a>**#44** `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|getInhabitantType|#1`

- <a id="evidence-45"></a>**#45** `service_method|user|functions/src/modules/user/services/user.service.ts|OSKUserService|_getInhabitantType|#1`

- <a id="evidence-46"></a>**#46** `api_contract|user|functions/src/modules/user/index.ts|getInhabitantType|#1`

- <a id="evidence-47"></a>**#47** `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKUserSecurityChecks|getInhabitantType||#1`

- <a id="evidence-48"></a>**#48** `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKBuildingUnitInhabitantController.default.get|_getInhabitantType|buildingId,unitId,userId|#1`

- <a id="evidence-49"></a>**#49** `model_property|organization|functions/src/modules/organization/modules/organization_inhabitant/models/functions/organization_inhabitant_request_document.model.ts|OSKPmpResidentsDocumentResponse|inhabitants|#1`

- <a id="evidence-50"></a>**#50** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|inhabitantType|#1`

- <a id="evidence-51"></a>**#51** `model_property|building|functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_document.model.ts|OSKIntercomUnitInhabitant|inhabitantType|#1`

- <a id="evidence-52"></a>**#52** `type_alias|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts|OSKBuildingUnitInhabitant|#1`

- <a id="evidence-54"></a>**#54** `type_alias|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts|OSKBuildingUnitInhabitantDocument|#1`

- <a id="evidence-55"></a>**#55** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts|OSKBuildingUnitInhabitant|unitId|#1`

- <a id="evidence-56"></a>**#56** `model_property|organization|functions/src/modules/organization/modules/organization_building/models/documents/organization_building_document_model.ts|OSKOrganizationBuilding|numberOfResidents|#1`

- <a id="evidence-57"></a>**#57** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts|OSKBuildingUnitInhabitant|buildingId|#1`

- <a id="evidence-58"></a>**#58** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts|OSKBuildingUnitInhabitant|userId|#1`

- <a id="evidence-61"></a>**#61** `model_property|building|functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts|OSKBuildingPincodeInhabitantDocument|type|#1`

- <a id="evidence-62"></a>**#62** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts|OSKBuildingUnitInhabitant|residentRights|#1`

- <a id="evidence-64"></a>**#64** `model_property|user|functions/src/modules/user/modules/user_access/models/documents/user_building_unit_document.model.ts|OSKUserBuildingUnit|isOwner|#1`

- <a id="evidence-65"></a>**#65** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts|OSKBuildingUnit|unitId|#1`

- <a id="evidence-66"></a>**#66** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts|OSKBuildingUnit|unitNumber|#1`

- <a id="evidence-67"></a>**#67** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts|OSKBuildingUnit|name|#1`

- <a id="evidence-68"></a>**#68** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts|OSKBuildingUnit|buildingId|#1`

- <a id="evidence-69"></a>**#69** `model_property|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_document.model.ts|OSKBuildingUnitNonAppUser|buildingId|#1`

- <a id="evidence-70"></a>**#70** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_permanent_guest_document.model.ts|OSKBuildingUnitPermanentGuest|unitId|#1`

- <a id="evidence-71"></a>**#71** `model_property|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_document.model.ts|OSKBuildingUnitNonAppUser|unitId|#1`

- <a id="evidence-72"></a>**#72** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts|OSKBuildingUnit|buildingName|#1`

- <a id="evidence-73"></a>**#73** `model_property|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|OSKNonAppUsersList|buildingId|#1`

- <a id="evidence-74"></a>**#74** `model_property|user|functions/src/modules/user/modules/user_settings/models/documents/user_unit_settings.model.ts|OSKUserSettingsUnit|buildingId|#1`

- <a id="evidence-75"></a>**#75** `model_property|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_document.model.ts|OSKBuildingUnitNonAppUser|email|#1`

- <a id="evidence-76"></a>**#76** `model_property|building|functions/src/modules/building/modules/building_unit/models/functions/building_unit_request.model.ts|OSKBuildingUnitUpdateRequest|unitId|#1`

- <a id="evidence-77"></a>**#77** `type_alias|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts|OSKBuildingUnit|#1`

- <a id="evidence-78"></a>**#78** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_permanent_guest_document.model.ts|OSKBuildingUnitPermanentGuest|buildingId|#1`

- <a id="evidence-79"></a>**#79** `model_property|building|functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts|OSKBuildingUnit|buildingImageFilename|#1`

- <a id="evidence-80"></a>**#80** `model_property|user|functions/src/modules/user/modules/user_access/models/documents/user_building_document.model.ts|OSKUserBuilding|isResident|#1`

- <a id="evidence-81"></a>**#81** `model_property|user|functions/src/modules/user/modules/user_access/models/documents/user_building_unit_document.model.ts|OSKUserBuildingUnit|isResident|#1`

- <a id="evidence-82"></a>**#82** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|isAppUser|#1`

- <a id="evidence-83"></a>**#83** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|residentId|#1`

- <a id="evidence-84"></a>**#84** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|isUserConsent|#1`

- <a id="evidence-85"></a>**#85** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentResponse|isAppUser|#1`

- <a id="evidence-86"></a>**#86** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|isOnboarded|#1`

- <a id="evidence-87"></a>**#87** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentResponse|isOnboarded|#1`

- <a id="evidence-88"></a>**#88** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentResponse|residentId|#1`

- <a id="evidence-89"></a>**#89** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/documents/organization_resident_document.model.ts|OSKOrganizationResidentBase|isUpdated|#1`

- <a id="evidence-90"></a>**#90** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKGetOrganizationResidentDetailsRequestData|residentId|#1`

- <a id="evidence-91"></a>**#91** `permission_candidate|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|v1.org.residents.view|#1`

- <a id="evidence-92"></a>**#92** `api_contract|organization|functions/src/modules/organization/modules/organization_residents/index.ts|getResidentDetails|#1`

- <a id="evidence-93"></a>**#93** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKUpdateOrganizationResidentRequest|residentId|#1`

- <a id="evidence-95"></a>**#95** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|Array.isArray|createResidents|onboardingCards.doors|#1`

- <a id="evidence-96"></a>**#96** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|checkInhabitantTypeAndDeleteAllInhabitantresident|#1`

- <a id="evidence-98"></a>**#98** `permission_candidate|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|v1.org.residents.list|#1`

- <a id="evidence-99"></a>**#99** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|getResidentDetails|#1`

- <a id="evidence-100"></a>**#100** `model_property|organization|functions/src/modules/organization/modules/organization_inhabitant/models/documents/organization_inhabitant_document.model.ts|OSKPmpResidents|isOnBoarded|#1`

- <a id="evidence-101"></a>**#101** `call_expression|user|functions/src/modules/user/services/user.service.ts|OSKOrganizationResidentsService.checkInhabitantTypeAndDeleteAllInhabitantresident|_deleteAllUserData|buildingId,unitId,residentDocForCheck|#1`

- <a id="evidence-102"></a>**#102** `source_file|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts`

- <a id="evidence-103"></a>**#103** `model_property|organization|functions/src/modules/organization/modules/organization_residents/models/functions/organization_resident_request_document_model.ts|OSKUpdateOrganizationResidentRequest|inhabitantType|#1`

- <a id="evidence-106"></a>**#106** `source_class|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService`

- <a id="evidence-107"></a>**#107** `source_file|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts`

- <a id="evidence-109"></a>**#109** `source_file|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts`

- <a id="evidence-110"></a>**#110** `service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|mapInhabitantData|#1`

- <a id="evidence-111"></a>**#111** `source_class|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService`

- <a id="evidence-112"></a>**#112** `service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getInhabitantDetailsByUserId|#1`

- <a id="evidence-114"></a>**#114** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|allInhabitants.filter|checkInhabitantTypeAndDeleteAllInhabitantresident|(inhabitant) => inhabitant.userId !== residentToDelete.userId|#1`

- <a id="evidence-115"></a>**#115** `service_method|organization|functions/src/modules/organization/modules/organization_inhabitant/services/organization_inhabitant.service.ts|OSKOrganizationInhabitantService|getInhabitantsForOrganization|#1`

- <a id="evidence-116"></a>**#116** `service_method|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingUnitInhabitantService|addInhabitant|#1`

- <a id="evidence-117"></a>**#117** `call_expression|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKBuildingUnitInhabitantService.addInhabitant|onboardInhabitant|inhabitant,onboardingCard.accessRights|#1`

- <a id="evidence-118"></a>**#118** `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKBuildingIntercomService|addInhabitantInIntercom|#1`

- <a id="evidence-119"></a>**#119** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingUnitInhabitantController.default.save|addInhabitant|inhabitant.buildingId,inhabitant.unitId,inhabitant.userId,inhabitant|#1`

- <a id="evidence-120"></a>**#120** `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKBuildingIntercomService|_addInhabitantInUnit|#1`

- <a id="evidence-121"></a>**#121** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKUserSettingsBuildingController.default.set|addInhabitant|inhabitant.userId,userSettingsDocument|#1`

- <a id="evidence-122"></a>**#122** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKUserSettingsUnitService.createUserSettingsUnitFromInhabitant|addInhabitant|inhabitant.userId,inhabitant.buildingId,inhabitant.unitId,inhabitant.inhabitantType|#1`

- <a id="evidence-123"></a>**#123** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingIntercomService.addInhabitantInAllIntercoms|addInhabitant|inhabitant.buildingId,inhabitant.unitId,inhabitant.userId,inhabitant.inhabitantType,inhabitant.doors|#1`

- <a id="evidence-124"></a>**#124** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingUnitInhabitantService.logger.logInfo|addInhabitant|'[DEBUG] addInhabitant: Preparing to call createAccess.',{
                        userId: inhabitant.userId,
                        buildingId: inhabitant.buildingId,
                        accessOptions: JSON.stringify(accessOptions),
                    }|#1`

- <a id="evidence-125"></a>**#125** `controller_method|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_inhabitant.controller.ts|OSKBuildingUnitInhabitantController|save|#1`

- <a id="evidence-126"></a>**#126** `service_method|building|functions/src/modules/building/modules/building_intercom/services/building_intercom_inhabitant.service.ts|OSKBuildingIntercomService|addInhabitantInAllIntercoms|#1`

- <a id="evidence-127"></a>**#127** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingSettingsController.default.get|addInhabitant|settingsId,inhabitant.buildingId|#1`

- <a id="evidence-128"></a>**#128** `service_method|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|OSKOrganizationOnboardingInhabitantService|onboardInhabitant|#1`

- <a id="evidence-129"></a>**#129** `call_expression|admin|functions/src/modules/admin/modules/admin_users/services/admin_inhabitant_user.service.ts|OSKBuildingUnitInhabitantService.addInhabitant|addInhabitantToUnit|buildingUnitInhabitant|#1`

- <a id="evidence-130"></a>**#130** `api_contract|admin|functions/src/modules/admin/modules/admin_users/index.ts|addInhabitantToUnit|#1`

- <a id="evidence-131"></a>**#131** `call_expression|user|functions/src/modules/user/modules/user_invitation/services/user_invitation_accepted.service.ts|OSKBuildingUnitInhabitantService.addInhabitant|acceptInvitationForInvitee|inhabitant,invitation.accessRights|#1`

- <a id="evidence-132"></a>**#132** `permission_candidate|organization|functions/src/modules/organization/modules/organization_onboarding_inhabitant/services/organization_onboarding_inhabitant.service.ts|v1.org.buildings.create|#1`

- <a id="evidence-133"></a>**#133** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKUserSettingsBuildingService.createUserSettingsFromBuildingSettings|addInhabitant|buildingSettingsDocument|#1`

- <a id="evidence-134"></a>**#134** `controller_method|building|functions/src/modules/building/modules/building_unit/controllers/building_unit_inhabitant.controller.ts|OSKBuildingUnitInhabitantController|create|#1`

- <a id="evidence-135"></a>**#135** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKBuildingSettingsController.default.getDocumentId|addInhabitant||#1`

- <a id="evidence-136"></a>**#136** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|JSON.stringify|addInhabitant|accessOptions|#1`

- <a id="evidence-137"></a>**#137** `model_property|admin|functions/src/modules/admin/modules/admin_users/models/functions/admin_inhabitant_user.requests.model.ts|OSKAddInhabitantFromUnitResponseData|inhabitantId|#1`

- <a id="evidence-138"></a>**#138** `call_expression|building|functions/src/modules/building/modules/building_unit/services/building_unit_inhabitant.service.ts|OSKAccessService.createAccess|addInhabitant|inhabitant.userId,inhabitant.buildingId,accessOptions|#1`

- <a id="evidence-139"></a>**#139** `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|['owner', 'tenant'].includes|getUnitPerson|requestingInhabitant.inhabitantType|#3`

- <a id="evidence-140"></a>**#140** `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|['owner', 'tenant'].includes|getUnitPerson|requestingInhabitant.inhabitantType|#4`

- <a id="evidence-141"></a>**#141** `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|['owner', 'tenant'].includes|getUnitPerson|requestingInhabitant.inhabitantType|#2`

- <a id="evidence-142"></a>**#142** `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|['owner', 'tenant'].includes|removeInhabitantFromUnit|requestingInhabitant.inhabitantType|#1`

- <a id="evidence-143"></a>**#143** `call_expression|unit_management|functions/src/modules/unit_management/services/unit_management_inhabitant.service.ts|['owner', 'tenant'].includes|removePendingInvitation|requestingInhabitant.inhabitantType|#1`

- <a id="evidence-145"></a>**#145** `permission_candidate|organization|functions/src/modules/organization/modules/organization_building/services/organization_building.service.ts|v1.org.residents.view|#1`

- <a id="evidence-147"></a>**#147** `call_expression|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|Array.isArray|bulkCreateResidents|residents|#1`

- <a id="evidence-149"></a>**#149** `model_property|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_document.model.ts|OSKBuildingUnitNonAppUser|nonAppUserId|#1`

- <a id="evidence-150"></a>**#150** `model_property|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|OSKUnitManagementNonAppUserPeopleResponseBase|nonAppUserId|#1`

- <a id="evidence-151"></a>**#151** `model_property|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_activity_document.model.ts|OSKNonAppUserActivity|nonAppUserId|#1`

- <a id="evidence-152"></a>**#152** `model_property|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|OSKNonAppUsersList|nonAppUserId|#1`

- <a id="evidence-153"></a>**#153** `model_property|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts|OSKGetNonAppUserRequest|nonAppUserId|#1`

- <a id="evidence-154"></a>**#154** `model_property|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|OSKInhabitantsAndGuestsListResponse|nonAppUsers|#1`

- <a id="evidence-155"></a>**#155** `model_property|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|OSKUnitManagementNonAppUserPeopleResponseBase|userAccessType|#1`

- <a id="evidence-156"></a>**#156** `model_property|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|OSKUnitManagementPeopleResponseNonAppUser|userAccessType|#1`

- <a id="evidence-157"></a>**#157** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|createNonAppUserResident|#1`

- <a id="evidence-158"></a>**#158** `model_property|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts|OSKUpdateNonAppUserRequest|nonAppUserId|#1`

- <a id="evidence-159"></a>**#159** `service_method|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts|OSKBuildingUnitNonAppUserService|getNonAppUser|#1`

- <a id="evidence-160"></a>**#160** `model_property|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts|OSKDeleteNonAppUserRequest|nonAppUserId|#1`

- <a id="evidence-161"></a>**#161** `type_alias|unit_management|functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document.ts|OSKUnitManagementPeopleResponseNonAppUser|#1`

- <a id="evidence-162"></a>**#162** `api_contract|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts|getNonAppUser|#1`

- <a id="evidence-163"></a>**#163** `model_property|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts|OSKCreateNonAppUserwithAccessResponse|nonAppUserId|#1`

- <a id="evidence-164"></a>**#164** `service_method|organization|functions/src/modules/organization/modules/organization_residents/services/organization_resident.service.ts|OSKOrganizationResidentsService|_deleteNonAppUserResident|#1`

- <a id="evidence-165"></a>**#165** `model_property|building|functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts|OSKGetNonAppUserRequest|unitId|#1`

- <a id="evidence-166"></a>**#166** `model_property|organization|functions/src/modules/organization/modules/organization_property/models/functions/property_request_document_model.ts|OSKGetPropertyDashboardStaticsResponseData|residentsCount|#1`

</sub>

</details>

### Cost

<a id="cost-detail"></a>**$0.0873** — approx., this document's own Vertex AI token cost only, computed from real-time pricing (live Cloud Billing Catalog API lookup, prices effective as of 2026-09-07 07:00 UTC); excludes subscriptions, infra, and other real overhead. [↩](#cite-cost)
