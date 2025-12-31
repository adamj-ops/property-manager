# Development Notebook

**Everyday Properties Management Platform**

---

## Interesting Findings & Learnings

### December 31, 2024

#### Project Scope
- Total of **385 story points** across 11 epics
- MVP scope: **256 story points** (16-20 weeks)
- Key differentiation: AI-powered inspections + compliance automation

#### Minnesota-Specific Requirements
- Security deposit interest: **1% simple interest annually** (Statute 504B.178)
- Late fee cap: **$50 maximum** (Statute 504B.177)
- Disposition deadline: **21 days** after move-out to return or send itemized deductions
- Source of income is a **protected class** in Minnesota

#### Brooklyn Center Specific
- Annual rental licensing required
- Crime-Free Housing Program addendum mandatory
- Property maintenance standards enforcement

#### Lead Paint Disclosure
- Federal requirement for properties built **before 1978**
- EPA pamphlet must be provided: "Protect Your Family from Lead"
- Tenant acknowledgment required before lease signing
- Records must be kept for **3 years**

---

## Technical Notes

### Database Design Decisions

1. **JSONB for flexible fields**: Amenities, room conditions, payment allocations
2. **UUID primary keys**: Better for distributed systems, no sequential info leak
3. **Separate audit_log table**: Immutable, indexed for fast queries
4. **Field-level encryption**: SSN and ID numbers encrypted in database

### File Storage Strategy

Structure for Cloudflare R2:
```
bucket/{teamId}/{entity}/{entityId}/{type}/
```

Example:
```
bucket/team-123/properties/prop-456/images/exterior-1.jpg
bucket/team-123/inspections/insp-789/photos/kitchen-damage.jpg
```

### Cache Invalidation Patterns

- **Portfolio metrics**: Invalidate on any property/unit change
- **Tenant balance**: Invalidate on payment or charge
- **Unit status**: Invalidate on lease start/end

---

## UI/UX Notes

### Dashboard Priority
Based on wireframes, dashboard should show:
1. Quick stats: Revenue, Occupancy, Tenants, YoY growth
2. Urgent items (3 max displayed, expandable)
3. Property list with key metrics
4. Recent activity / Quick stats
5. AI insights (future)

### Color Usage
- 🔴 Red: Past due, emergency, overdue
- 🟡 Yellow: Warning, pending, expiring soon
- 🟢 Green: Current, completed, success
- ⚪ Gray: Neutral, inactive

### Status Flow - Work Orders
```
Open → Scheduled → In Progress → Completed
         ↓
      Cancelled
```

### Status Flow - Leases
```
Draft → Pending Signature → Active → Expired
                              ↓
                          Terminated
```

---

## API Patterns

### Service File Naming
```
{entity}.api.ts    - Server functions (API endpoints)
{entity}.query.ts  - React Query hooks (queryOptions, mutations)
{entity}.schema.ts - Zod validation schemas
```

### Query Key Pattern
```typescript
const propertyKeys = {
  all: ['properties'] as const,
  list: () => [...propertyKeys.all, 'list'] as const,
  detail: (id: string) => [...propertyKeys.all, 'detail', id] as const,
  metrics: (id: string) => [...propertyKeys.all, 'metrics', id] as const,
};
```

---

## Questions to Research

- [ ] Best e-signature integration for small-scale use (DocuSign vs HelloSign vs custom)
- [ ] Optimal AI model for property inspection analysis (GPT-4 Vision vs Google Vision)
- [ ] Payment processing: Stripe Connect vs direct ACH
- [ ] Background check API options (TransUnion, Experian, RentPrep)

---

## References

### Minnesota Landlord-Tenant Law
- [MN Statute 504B](https://www.revisor.mn.gov/statutes/cite/504B)
- Security deposits: 504B.178
- Late fees: 504B.177
- Entry/Access: 504B.211

### Federal Housing
- [Fair Housing Act](https://www.hud.gov/program_offices/fair_housing_equal_opp/fair_housing_act_overview)
- [Lead Paint EPA](https://www.epa.gov/lead/protect-your-family-lead-your-home)

### Brooklyn Center
- [Rental Licensing](https://www.brooklyncentermn.gov/)
- Crime-Free Housing Program requirements

---

**Last Updated:** December 31, 2024
