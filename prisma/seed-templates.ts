/**
 * Lease Templates Seed Script
 * EPM-83: Lease Template Import & Management
 *
 * Creates default addenda templates with variable placeholders.
 * Run with: pnpm tsx prisma/seed-templates.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Default templates data
const defaultTemplates = [
  {
    name: 'Pet Addendum',
    type: 'ADDENDUM_PET' as const,
    description: 'Standard pet addendum for lease agreements with pet policy terms',
    templateContent: `PET ADDENDUM

This Pet Addendum ("Addendum") is made and entered into on {{signed_date}}, by and between:

LANDLORD: Everyday Property Management
TENANT: {{tenant_name}}
PROPERTY: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}
UNIT: {{unit_number}}

This Addendum is attached to and made a part of the Lease Agreement dated {{lease_start_date}}.

1. PET INFORMATION
   Pet Name: {{pet_name}}
   Type: {{pet_type}}
   Breed: {{pet_breed}}
   Weight: {{pet_weight}} lbs
   Color: [Pet Color]

2. PET DEPOSIT AND RENT
   Pet Deposit: {{pet_deposit}}
   Monthly Pet Rent: {{pet_rent}}

3. TENANT RESPONSIBILITIES
   a) Tenant shall keep pet under control at all times
   b) Tenant shall clean up after pet immediately
   c) Tenant shall not allow pet to disturb other residents
   d) Tenant shall maintain current vaccinations (rabies required)
   e) Tenant shall comply with all local ordinances regarding pets
   f) Tenant shall notify Landlord of any pet bites or attacks immediately

4. PROHIBITED CONDUCT
   a) Pets are not allowed in common areas unless on a leash
   b) Pets may not be left unattended on balconies or patios
   c) Aggressive breeds may be prohibited per insurance requirements

5. LIABILITY
   Tenant assumes full responsibility for any damage, injury, or liability caused by the pet.

6. VIOLATION
   Violation of this Addendum may result in termination of the Lease Agreement.

SIGNATURES:

Landlord: _________________________ Date: _________
Tenant: __________________________ Date: _________`,
    variables: [
      'signed_date',
      'tenant_name',
      'property_address',
      'property_city',
      'property_state',
      'property_zip',
      'unit_number',
      'lease_start_date',
      'pet_name',
      'pet_type',
      'pet_breed',
      'pet_weight',
      'pet_deposit',
      'pet_rent',
    ],
    minnesotaCompliant: true,
  },
  {
    name: 'Parking Addendum',
    type: 'ADDENDUM_PARKING' as const,
    description: 'Parking space assignment and terms addendum',
    templateContent: `PARKING ADDENDUM

This Parking Addendum ("Addendum") is made on {{signed_date}}, by and between:

LANDLORD: Everyday Property Management
TENANT: {{tenant_name}}
PROPERTY: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}
UNIT: {{unit_number}}

1. PARKING ASSIGNMENT
   Parking Space Number: {{parking_space_number}}
   Type: [Covered/Uncovered/Garage]
   Monthly Parking Fee: {{parking_fee}}

2. VEHICLE INFORMATION
   Make: [Vehicle Make]
   Model: [Vehicle Model]
   Year: [Vehicle Year]
   Color: [Vehicle Color]
   License Plate: [License Plate]

3. RULES AND REGULATIONS
   a) Only the assigned vehicle may use the designated parking space
   b) Vehicles must be properly registered and insured
   c) No storage of hazardous materials in vehicles
   d) No vehicle repairs in parking areas
   e) Speed limit of 5 MPH in parking areas
   f) Landlord is not responsible for theft or damage to vehicles

4. GUEST PARKING
   Guest parking is available on a first-come, first-served basis in designated areas only.

5. VIOLATION
   Unauthorized vehicles may be towed at owner's expense.

SIGNATURES:

Landlord: _________________________ Date: _________
Tenant: __________________________ Date: _________`,
    variables: [
      'signed_date',
      'tenant_name',
      'property_address',
      'property_city',
      'property_state',
      'property_zip',
      'unit_number',
      'parking_space_number',
      'parking_fee',
    ],
    minnesotaCompliant: true,
  },
  {
    name: 'Crime-Free Housing Addendum (Brooklyn Center)',
    type: 'ADDENDUM_CRIME_FREE' as const,
    description: 'Brooklyn Center crime-free housing program addendum',
    templateContent: `CRIME-FREE HOUSING ADDENDUM
(Brooklyn Center, Minnesota)

This Crime-Free Housing Addendum ("Addendum") is made on {{signed_date}}, by and between:

LANDLORD: Everyday Property Management
TENANT: {{tenant_name}}
PROPERTY: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}
UNIT: {{unit_number}}

In consideration of the execution or renewal of a lease of the dwelling unit identified in the Lease Agreement, Landlord and Tenant agree as follows:

1. TENANT AGREES
   Tenant, any members of the tenant's household, or a guest or other person under the tenant's control shall not engage in:
   
   a) Any act intended to facilitate criminal activity, including drug-related criminal activity, on or near the premises
   b) Any act of violence or threat of violence
   c) Any violation of criminal law
   d) Any activity that threatens the health, safety, or right to peaceful enjoyment of the premises by other tenants
   e) Any drug-related criminal activity on or near the premises

2. DEFINITIONS
   "Drug-related criminal activity" means the illegal manufacture, sale, distribution, use, or possession with intent to manufacture, sell, distribute, or use a controlled substance.

3. TERMINATION
   A single violation of this Addendum shall be grounds for termination of the Lease Agreement. Proof of violation shall be by a preponderance of evidence.

4. BROOKLYN CENTER COMPLIANCE
   This property participates in the Brooklyn Center Crime-Free Multi-Housing Program.

SIGNATURES:

Landlord: _________________________ Date: _________
Tenant: __________________________ Date: _________`,
    variables: [
      'signed_date',
      'tenant_name',
      'property_address',
      'property_city',
      'property_state',
      'property_zip',
      'unit_number',
    ],
    minnesotaCompliant: true,
    complianceNotes: 'Required for Brooklyn Center properties participating in Crime-Free Multi-Housing Program',
  },
  {
    name: 'Lead Paint Disclosure (Pre-1978)',
    type: 'ADDENDUM_LEAD_PAINT' as const,
    description: 'Federal lead-based paint disclosure for properties built before 1978',
    templateContent: `DISCLOSURE OF INFORMATION ON LEAD-BASED PAINT AND/OR LEAD-BASED PAINT HAZARDS

Lead Warning Statement
Housing built before 1978 may contain lead-based paint. Lead from paint, paint chips, and dust can pose health hazards if not managed properly. Lead exposure is especially harmful to young children and pregnant women. Before renting pre-1978 housing, lessors must disclose the presence of known lead-based paint and/or lead-based paint hazards in the dwelling. Lessees must also receive a federally approved pamphlet on lead poisoning prevention.

PROPERTY: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}
UNIT: {{unit_number}}
YEAR BUILT: {{property_year_built}}

LESSOR'S DISCLOSURE
(a) Presence of lead-based paint and/or lead-based paint hazards (check one):
    [ ] Known lead-based paint and/or lead-based paint hazards are present in the housing
    [ ] Lessor has no knowledge of lead-based paint and/or lead-based paint hazards in the housing

(b) Records and reports available to the lessor (check one):
    [ ] Lessor has provided the lessee with all available records and reports pertaining to lead-based paint and/or lead-based paint hazards in the housing
    [ ] Lessor has no reports or records pertaining to lead-based paint and/or lead-based paint hazards in the housing

LESSEE'S ACKNOWLEDGMENT
(c) Lessee has received copies of all information listed above.
(d) Lessee has received the pamphlet "Protect Your Family From Lead in Your Home."

AGENT'S ACKNOWLEDGMENT (if applicable)
Agent has informed the lessor of the lessor's obligations under 42 U.S.C. 4852d and is aware of his/her responsibility to ensure compliance.

CERTIFICATION OF ACCURACY
The following parties have reviewed the information above and certify, to the best of their knowledge, that the information they have provided is true and accurate.

Lessor: _________________________ Date: {{signed_date}}
Lessee: {{tenant_name}} Date: _________
Agent (if applicable): _________________________ Date: _________`,
    variables: [
      'property_address',
      'property_city',
      'property_state',
      'property_zip',
      'unit_number',
      'property_year_built',
      'signed_date',
      'tenant_name',
    ],
    minnesotaCompliant: true,
    complianceNotes: 'Required by federal law for all properties built before 1978. 42 U.S.C. 4852d',
  },
  {
    name: 'Security Deposit Addendum',
    type: 'ADDENDUM_SECURITY_DEPOSIT' as const,
    description: 'Minnesota-compliant security deposit terms and disclosure',
    templateContent: `SECURITY DEPOSIT ADDENDUM
(Minnesota Statute 504B.178)

This Security Deposit Addendum ("Addendum") is made on {{signed_date}}, by and between:

LANDLORD: Everyday Property Management
TENANT: {{tenant_name}}
PROPERTY: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}
UNIT: {{unit_number}}

1. SECURITY DEPOSIT AMOUNT
   Security Deposit: {{security_deposit}}
   
2. DEPOSIT LOCATION (as required by MN Statute 504B.178)
   The security deposit will be held at:
   Bank Name: {{deposit_bank_name}}
   
3. INTEREST ON DEPOSIT
   Per Minnesota Statute 504B.178, interest shall accrue on the security deposit at a rate of {{security_deposit_interest_rate}}% per annum, payable upon termination of the tenancy.
   
4. USE OF DEPOSIT
   The security deposit may be used for:
   a) Unpaid rent
   b) Damage to the premises beyond normal wear and tear
   c) Breach of the lease agreement
   d) Cleaning costs necessary to return the unit to its original condition
   
5. RETURN OF DEPOSIT
   Within 21 days after the tenant vacates, the landlord shall return the deposit, with interest, minus any lawful deductions. If deductions are made, an itemized statement will be provided.

6. PRE-EXISTING CONDITIONS
   Any pre-existing damage should be documented on the move-in checklist.

SIGNATURES:

Landlord: _________________________ Date: _________
Tenant: __________________________ Date: _________`,
    variables: [
      'signed_date',
      'tenant_name',
      'property_address',
      'property_city',
      'property_state',
      'property_zip',
      'unit_number',
      'security_deposit',
      'deposit_bank_name',
      'security_deposit_interest_rate',
    ],
    minnesotaCompliant: true,
    complianceNotes: 'Complies with MN Statute 504B.178 regarding security deposit disclosure and interest requirements',
  },
  {
    name: 'Utilities Addendum',
    type: 'ADDENDUM_UTILITIES' as const,
    description: 'Utility responsibility disclosure and terms',
    templateContent: `UTILITIES ADDENDUM

This Utilities Addendum ("Addendum") is made on {{signed_date}}, by and between:

LANDLORD: Everyday Property Management
TENANT: {{tenant_name}}
PROPERTY: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}
UNIT: {{unit_number}}

1. UTILITIES PAID BY TENANT
   Tenant is responsible for the following utilities:
   {{utilities_tenant_pays}}
   
   Tenant must establish service in their name prior to move-in.

2. UTILITIES PAID BY LANDLORD
   Landlord will provide the following utilities:
   {{utilities_owner_pays}}
   
   These are included in the monthly rent.

3. UTILITY TRANSFER
   a) Tenant must transfer utilities into their name within 3 days of move-in
   b) Tenant must maintain utility service throughout the tenancy
   c) Failure to maintain required utilities is a lease violation

4. CONSERVATION
   Tenant agrees to use utilities reasonably and to conserve energy and water where possible.

5. BILLING DISPUTES
   Any disputes regarding utility billing should be resolved directly with the utility provider.

SIGNATURES:

Landlord: _________________________ Date: _________
Tenant: __________________________ Date: _________`,
    variables: [
      'signed_date',
      'tenant_name',
      'property_address',
      'property_city',
      'property_state',
      'property_zip',
      'unit_number',
      'utilities_tenant_pays',
      'utilities_owner_pays',
    ],
    minnesotaCompliant: true,
  },
  {
    name: 'Smoking Policy Addendum',
    type: 'ADDENDUM_SMOKING' as const,
    description: 'No-smoking or designated smoking area policy',
    templateContent: `SMOKING POLICY ADDENDUM

This Smoking Policy Addendum ("Addendum") is made on {{signed_date}}, by and between:

LANDLORD: Everyday Property Management
TENANT: {{tenant_name}}
PROPERTY: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}
UNIT: {{unit_number}}

1. NO-SMOKING POLICY
   This is a SMOKE-FREE property. Smoking is prohibited in:
   a) All individual dwelling units
   b) All common areas (hallways, lobbies, laundry rooms, etc.)
   c) Within 25 feet of any building entrance
   d) On balconies and patios

2. DEFINITION OF SMOKING
   "Smoking" includes the inhaling, exhaling, burning, or carrying of any lighted cigar, cigarette, pipe, hookah, or other smoking device, as well as the use of electronic cigarettes and vaporizers.

3. TENANT'S RESPONSIBILITY
   a) Tenant shall inform all guests and visitors of this policy
   b) Tenant shall not allow smoking by any person in violation of this policy
   c) Tenant shall immediately report any violation by others

4. CLEANING COSTS
   If smoking odor or residue is detected upon move-out, tenant will be charged for professional cleaning and deodorizing.

5. VIOLATION
   Violation of this policy is a material breach of the Lease Agreement and may result in termination.

SIGNATURES:

Landlord: _________________________ Date: _________
Tenant: __________________________ Date: _________`,
    variables: [
      'signed_date',
      'tenant_name',
      'property_address',
      'property_city',
      'property_state',
      'property_zip',
      'unit_number',
    ],
    minnesotaCompliant: true,
  },
  {
    name: 'Guest Policy Addendum',
    type: 'ADDENDUM_GUEST' as const,
    description: 'Guest and occupancy policy terms',
    templateContent: `GUEST POLICY ADDENDUM

This Guest Policy Addendum ("Addendum") is made on {{signed_date}}, by and between:

LANDLORD: Everyday Property Management
TENANT: {{tenant_name}}
PROPERTY: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}
UNIT: {{unit_number}}

1. AUTHORIZED OCCUPANTS
   Only the following persons are authorized to reside in the unit:
   [List all approved occupants]

2. GUEST POLICY
   a) Guests may stay overnight for a maximum of 14 consecutive days
   b) Guests may not stay more than 30 days total in any 12-month period
   c) Any person staying beyond these limits must be approved and added to the lease

3. LANDLORD NOTIFICATION
   Tenant must notify Landlord in writing if any guest will be staying more than 7 consecutive days.

4. GUEST CONDUCT
   a) Tenant is responsible for the conduct of all guests
   b) Guests must comply with all lease terms and property rules
   c) Tenant is liable for any damage caused by guests

5. UNAUTHORIZED OCCUPANTS
   Allowing unauthorized persons to reside in the unit is a lease violation and may result in termination.

6. SUBLETTING
   Subletting or assignment of the unit is strictly prohibited without prior written consent from Landlord.

SIGNATURES:

Landlord: _________________________ Date: _________
Tenant: __________________________ Date: _________`,
    variables: [
      'signed_date',
      'tenant_name',
      'property_address',
      'property_city',
      'property_state',
      'property_zip',
      'unit_number',
    ],
    minnesotaCompliant: true,
  },
]

async function seedTemplates() {
  console.log('🌱 Seeding lease templates...')

  // Get a user to set as creator (first user found)
  const user = await prisma.user.findFirst()

  if (!user) {
    console.error('❌ No user found. Please create a user first.')
    process.exit(1)
  }

  console.log(`Using user: ${user.email}`)

  for (const template of defaultTemplates) {
    // Check if template already exists
    const existing = await prisma.leaseTemplate.findFirst({
      where: { name: template.name },
    })

    if (existing) {
      console.log(`⏭️  Skipping "${template.name}" - already exists`)
      continue
    }

    await prisma.leaseTemplate.create({
      data: {
        name: template.name,
        type: template.type,
        version: 1,
        description: template.description,
        templateContent: template.templateContent,
        variables: template.variables,
        variableSchema: {
          variables: template.variables,
          source: 'seed',
        },
        isDefault: true, // First template of each type is default
        isActive: true,
        isArchived: false,
        minnesotaCompliant: template.minnesotaCompliant,
        complianceNotes: template.complianceNotes,
        createdById: user.id,
      },
    })

    console.log(`✅ Created template: ${template.name}`)
  }

  console.log('🌱 Template seeding complete!')
}

seedTemplates()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

