# **PMO-012 — Assign Owner Non Resident To Unit**

## **Status**

Defined Workflow

Not Yet Coded

Version 1

---

# **Workflow Name**

Assign Owner Non Resident To Unit

---

# **Domain**

Ownership Administration

---

# **Business Purpose**

This workflow allows a Property Manager to assign a non-resident owner to one or more units.

A non-resident owner is a person who owns a unit but does not occupy that unit as their residence.

The purpose of this workflow is to establish who owns the unit and who is responsible for managing the future occupancy of that unit.

Examples:

* Landlord  
* Property investor  
* Owner living elsewhere  
* Owner of multiple units

---

# **Primary Actor**

Property Manager

---

# **Secondary Actor**

Owner Non Resident

---

# **Important Distinction**

An Owner Non Resident:

* Owns the unit  
* Does not occupy the unit  
* Manages tenancy relationships for that unit

This differs from an Owner Resident who both owns and occupies the unit.

---

# **App Requirement**

Owner Non Resident must be an App User.

Non-app / PIN-only ownership management is not supported.

Reason:

The Owner Non Resident must be able to manage the unit through the application.

---

# **Authority Model**

The Owner Non Resident introduces a new ownership authority model.

Authority chain:

```
Property Manager
    ->
Owner Non Resident
        ->
Owner Non Resident Tenant
            ->
Owner Non Resident Tenant Co-Inhabitant
```

This differs from the residential occupancy model:

```
Property Manager
    ->
Tenant
        ->
Resident
```

The Property Manager remains responsible for the building and its operational policies.

The Owner Non Resident is responsible for managing occupancy of the assigned unit.

---

# **Trigger**

A Property Manager assigns ownership of one or more units to a person who does not reside in those units.

Examples:

* New owner onboarding  
* Landlord onboarding  
* Building migration  
* Multi-unit owner onboarding

---

# **Information Collected**

Expected onboarding information:

* First Name  
* Last Name  
* Email Address  
* Phone Number  
* Building ID  
* Unit ID  
* Door IDs  
* Access Start Date  
* Access End Date

The Owner Non Resident must be onboarded as an App User.

---

# **Ownership Responsibilities**

The Owner Non Resident is responsible for:

* Managing occupancy state  
* Managing occupation type  
* Managing tenancy lifecycle  
* Creating tenancy relationships

---

# **Multi Unit Ownership**

An Owner Non Resident may own:

* Multiple units within a building  
* Units across multiple buildings

This is considered a normal ownership scenario.

The user experience must support selecting the relevant building and unit context.

---

# **Owner Tenancy Management**

Owner Tenancy Management is the unit-management context used by an Owner Non Resident.

Structure:

```
Building
    ->
Unit
        ->
Owner Tenancy Management
```

Unlike a Tenant or Owner Resident, the Owner Non Resident does not manage a Mon Foyer.

The Owner Non Resident manages the occupancy and tenancy status of one or more units.

---

# **Occupancy State**

A unit may be:

* Vacant  
* Occupied

Occupancy state is separate from occupation type.

---

# **Occupation Type**

Occupation type identifies the type of occupancy when the unit is occupied.

Examples:

* LLD  
* LCD

Examples:

```
Vacant

Occupied + LLD

Occupied + LCD
```

LLD and LCD should not be mixed for the same unit in the current model.

---

# **Tenancy Delegation**

The Owner Non Resident creates tenancy relationships.

Example:

```
Property Manager
    ->
Owner Non Resident
        ->
Owner Non Resident Tenant
```

The resulting tenant experience should remain identical to the existing Tenant / ResidentAdmin experience.

---

# **Tenant Experience**

An Owner Non Resident Tenant has the same app experience as an existing Tenant.

The resulting experience remains:

```
Tenant
    ->
ResidentAdmin
        ->
Mon Foyer
```

The tenant should not need a separate ownership-specific user experience.

---

# **Vacancy Behaviour**

Ownership remains associated with the unit regardless of occupancy.

Example:

```
Tenant Leaves
    ->
Unit Becomes Vacant
    ->
Owner Non Resident Remains Associated With Unit
```

Ownership is independent of occupancy status.

---

# **Access Expectations**

The Owner Non Resident has permanent access rights to the building.

Final door scope may be defined by Property Manager configuration, but the business expectation is that the owner retains access to the building they own within.

---

# **Intercom Participation Policy**

When a unit is occupied:

```
Owner Non Resident
    ->
Not eligible for call-list participation
```

Intercom participation belongs to the occupant relationship.

When a unit is vacant:

```
Owner Non Resident
    ->
Eligible for call-list participation
```

where permitted by Property Manager policy.

During vacancy, the Owner Non Resident should be able to choose whether they participate in call routing.

This is a business rule.

---

# **Business Outcome**

Ownership of the unit is established.

The Owner Non Resident gains authority to manage tenancy relationships associated with the unit.

The unit may move between vacant and occupied states without affecting ownership.

---

# **System Outcome**

The Owner Non Resident becomes associated with one or more units.

Owner Tenancy Management becomes available for those units.

The Owner Non Resident can manage occupancy state, occupation type, and tenancy lifecycle for assigned units.

---

# **Related Workflows**

* WG-014 Assign Owner Resident To Unit  
* WG-016 Assign Tenant To Unit  
* WG-017 End Tenancy  
* WG-018 Transfer Unit Ownership

Future related workflows:

* Create Owner Non Resident Tenant  
* Create Owner Non Resident Tenant Co-Inhabitant  
* End Owner Non Resident Tenancy  
* Manage Owner Tenancy Management

---

# **Out Of Scope**

* Ownership transfer lifecycle  
* LCD booking integrations  
* Booking.com / Airbnb / calendar integrations  
* Automated PIN distribution to booking platforms  
* Commercial tenancy models  
* Care-home occupancy models

---

# **Confidence**

Business Workflow: High

Technical Workflow: Low

Overall Confidence: Medium-High

