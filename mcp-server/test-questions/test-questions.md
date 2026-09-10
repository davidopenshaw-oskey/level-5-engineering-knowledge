# This file contains test questions that are repeatedly run over major coding changes as an intergrity and regression tests suite

1. Currently the PGO supports adding a tenant into a unit by the Property Manager. A tenant can manage the unit in the Oskey app, adding residents such as their partner or children to the unit.

What is the impact of adding a new type of owner/inhabitant, such as an ownerNonResident. This ownerNonResident would then manage adding their own tenants and taking on the task of tenant management from the Property manager. 

1a. Currently the PGO supports adding a tenant or owner as a person living in a buildings unit by the Property Manager. We need a new inhabitantType in the Oskey system. The name of the new inhabitantType will be ownerNonResident. The scope of this PRD is to add the new inhabitantType without breaking the existing flows around inhabitantType. Report back an impact analysis of how this will impact the code base.

1b. Once the inhabitantType ownerNonResident has been added to the Oskey system, we need to be able to assign building units to this ownerNonResident account. Report back on how this could be done highlighting how in the PGO it can be added. If there is more than one option, then report back on all options. If there are existing flows and code that will be affected, report back.  

1c. Currently the PGO supports adding a tenant or owner as a person living in a buildings unit by the Property Manager. We need a new inhabitantType in the Oskey system. The name of the new inhabitantType will be ownerNonResident. The scope of this PRD is to add the new inhabitantType without breaking the existing flows around inhabitantType. 

2. What is the immpact on the PGO Resident flow if we add a feature called Resident Departure. This would be a date/time set by a PM when they would like the current residents building accesses to be removed.

2a. In the PGO there is a residents profile card. On this card we would like to add a departure date.

This represents a date and time in the future for when a resident is going to leave the building - eg: end of rental contract.

When the date is triggered, the system needs to remove the accesses for this resident to the specific building and all doors the resident has access to.

On completion, next to the departure date, a field/label should display the date & time confirming when the system removed the access.

Within the Oskey landscape, there is already a schedule taks facility.

The accesses must be removed from the edge devices ( intercoms, digicoms, where applicable)

The corpus currently supports generating a PRD for this work from the PGO, thru cloud and node-iot.

The corpus cannot provide the PRD for the edge devices, but can suggest the work needed up to and the return from the node-iot repo.

3.  What is the impact on the invitation flow if we add recurring invitations. At the moment, you can only add a single invitation. 

4. What is the impact if we want recurring pincode access in the PGO for Suppliers. At the moment, the Supplier pincode access is based on start date/time and end date/time. 

As an example only: Mon, Tue, Wed from 09:00 until 12:00pm for gardening every week. The contract is for 6 months.

5. In Mon Foyer, or My Household in the Oskey Apps, the residentAdmin ( currently a tenant or owner ) can manage their unit and invite residents and permanent guests. What would need to be done for adding an approval process tothe invitation invite flow. Meaning when a resident invite someone, the residentAdmin needs to approve the invitation before it is sent.


6. In the PGO system we have a section called Suppliers. When you drill down onto a supplier into their record you have a card with 3 tabs on it.

We would like a new tab added called Activity. Inside the Activity tab will be a record of the pincode door open activity log in date descending order. 

The table of activity should have a filter allowing the PM to filter by buildings or doors. Also seacrh for a staff member by name or email.