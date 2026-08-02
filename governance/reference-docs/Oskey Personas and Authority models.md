
# Oskey Sytem Personas, Extracted Relationship & Authority Models
**version:** 0.0.2
**location:** level-5 phases 1, 2

© [Year] OSkey SAS. All rights reserved


# The Administrative & Operational Personas

These personas operate at the platform, organization, or building level, managing infrastructure rather than residential groups.

## Oskey Administrator: 
The highest-level tenant admin who creates organizations, invites Property Managers, and validates organization requests

## Property Manager (PM): 

- Business Role:
    - Property Managers are the users of the Property Management Portal (PGO) and are granted scoped operational access to specific buildings, PGO workflows. They manage properties, buildings, and access control devices, and establish the primary occupancy relationships (assigning owners and tenants to units). They do not participate in residential occupancy models, but may be granted operational access to buildings.

- System Actor: 
    - In the backend, these are Organization Users stored in the /organizations/{organizationId}/users/{userId} collection. 
    Their abilities are strictly governed by their assigned Role-Based Access Control (RBAC) permissions (e.g., v1.admin.building.edit), rather than a separate "staff" versus "manager" table. At least one user must hold the v1.org.admin role

## Supplier
A Supplier can represent a company, contractor, person. For example, cleaners, electricians, maintenance companies, HVAC Engineers, Lift maintenance.

## Supplier Staff: 
A Supplier staff is required for a Supplier to receive a time bounded auditable access to a building(s). They can be granted time-bound, PIN-based operational access to perform duties. They do not use the app and do not participate in residential intercom routing. They are managed by Property Manager Staff. 


--------------------------------------------------------------------------------

# The Residencial Occupancy & Ownership Personas (Primary Unit Actors):
These personas establish the core legal or financial relationship with a residencial unit.

## PGO Tenant: 
A standard renter assigned by the Property Manager. Upon onboarding, they become the primary occupant and a ResidentAdmin who manages the residential group. They can manage Residents, Permanent Guests and Intercom call-forwarding.

## Owner Resident: 
A person who owns a unit and occupies it. Upon onboarding, they automatically become a ResidentAdmin. They are onboarded by a Property Manager. They can manage Residents, Permanent Guests and Intercom call-forwarding.

## Owner Non Resident: 
A landlord or investor who owns a unit but does not live there. They do not get "Mon Foyer" (residential group) features. They self manage tenancy relationships & bookings for their unit. (LLD & LCD)   

## Owner Non Resident Tenant (LLD): 
A long-term tenant who is managed and created by an Owner Non Resident rather than the Property Manager. They receive the exact same app experience as a standard Tenant and become a ResidentAdmin. They can manage Residents, Permanent Guests and Intercom call-forwarding.

## Owner Non Resident Tenant (LCD): 
A short-term, booking-centric occupant (e.g., holiday rental). They receive time-bound PIN access only, do not install the app, and do not participate in intercom routing

--------------------------------------------------------------------------------

# The Residential Group Personas (Mon Foyer)
These personas are managed by the primary occupants (ResidentAdmins) and inherit their access limits.

## ResidentAdmin (Status/Role): 
This is not a distinct person, but an elevated status given to 
    - Owner Residents
    - PGO Tenants
    - Owner Non Resident Tenant (LLD)

ResidentAdmins govern the "Mon Foyer," manage call routing, and can invite lower-level inhabitants
    - Resident
    - Owner Non Resident Tenant (LLD) Co-Inhabitant:

## Resident & Owner Non Resident Tenant (LLD) Co-Inhabitant:
Long-term co-occupants (partners, children, flatmates). They inherit their access boundaries from the ResidentAdmin who invited them, have unlimited entry, and can optionally be added to the intercom call list

## Permanent Guest: 
A known, recurring trusted person (e.g., nanny, carer). They must use the OSkey app, their access is explicitly scheduled (max 1 year validity), and they can be optionally added to the intercom call list

--------------------------------------------------------------------------------

# The Temporary & Visitor Personas

## Guest (Guest Invitation): 
A named visitor who must download the OSkey app. They receive temporary, secure BLE and PIN access (single or multi-entry) but do not join the residential group or intercom list

## Quick Code Recipient: 
An anonymous or unidentified temporary visitor (e.g., delivery driver). They require no app, no OSkey account, and use a time-bound, entry-limited PIN


--------------------------------------------------------------------------------

# The Extracted Relationship & Authority Models
The Oskey system enforces a strict "Delegated Authority Principle" where "a lower-level inhabitant must not receive more access than the ResidentAdmin who created or invited them"

The system operates on two distinct hierarchical authority chains:
1. The Standard Residential Authority Chain:
    - Property Manager (Defines maximum building access limits)
        - PGO Tenant / Owner Resident (Becomes ResidentAdmin, manages the unit)
            - Resident (Inherits access scope from ResidentAdmin)
                - Guest / Quick Code (Temporary, scoped access)
            - Permanent Guest (Inherits access scope from ResidentAdmin, maximum 1-year validity)

2. The Owner Non-Resident Authority Chain:
    - Property Manager (Manages building policies and max access limits)
        - Owner Non Resident (Manages unit tenancies and LCD bookings)
            - Owner Non Resident LLD (Occupies unit, becomes ResidentAdmin, manages Mon Foyer)
                - Owner Non Resident Tenant Co-Inhabitant (Inherits access scope from primary LLD tenant)
            - Owner Non Resident LCD (Temporary booking-centric access, PIN-only, no app installation or Mon Foyer participation)

3.  The commercialTenant, commercialOwner, commercialStaff and commercialClient:
    - inhabitant types or guests that exist on the roadmap
    - no development has yet been started on these workflows or personas.
    

--------------------------------------------------------------------------------

# Access Mechanisms & Onboarding Types

The OSkey platform supports two distinct delivery mechanisms for access. These are not personas themselves, but rather technical states applied to personas during onboarding:

## App User (SecureBLE + PIN):
The standard onboarding state. The user installs the OSkey app, creates an authenticated account, and receives both a unique PIN code and mobile device tokens for secureBLE entry.

## Non-App User (PIN-Only / Credential-Based Access):
A user who does not install the OSkey application. They are issued a unique, time-bound or permanent PIN code. The system does not require them to complete Auth0 registration or MFA.

### How it applies to Personas:

#### Primary Occupants (PGO Tenants / Owner Residents): 
Can be onboarded as Non-App Users if they do not possess a smartphone. They retain their full business authority (e.g., ResidentAdmin status), but cannot use digital management features.

#### Supplier Staff & LCD Occupants: 
Are always Non-App Users by default. Their business workflows strictly utilize PIN-only access.

#### Dependent Unit Inhabitants (e.g., Children): 
A ResidentAdmin can create a dependent Non-App User. These individuals are stored in the scoped /units/{unitId}/nonAppUsers collection and their access lifecycle is strictly bound to the ResidentAdmin who created them.

# Account creation, Authentication and onboarding flow

User authentication is delegated to Auth0.

A new OSkey user account is created through an Auth0 Multi-Factor Authentication (MFA) registration flow requiring:

Email verification
Phone verification

Upon successful authentication, Auth0 returns an authenticated identity to the OSkey platform.

OSkey then creates (or links) the corresponding user record within the authoritative /users collection in Firestore.

This document becomes the canonical OSkey identity used by all subsequent business workflows, role assignments and access provisioning.

Authentication establishes identity.

Authorisation and business permissions are determined separately by the OSkey platform.
