# TEST PLAN: Verification & Automated Test Matrix

## Test Suites

1. **Unit & Financial Logic Tests**
   - Base Price + 4-Tier Modifier calculations
   - Tax-inclusive vs Tax-exclusive tax calculations
   - Percentage & fixed discount calculations
   - Seat-based, item-based, and even bill splitting
   - Inventory BOM ingredient deductions per order line

2. **State Machine & Rule Enforcement Tests**
   - Valid state transitions (`DRAFT` → `SUBMITTED` → `PREPARING` → `READY` → `SERVED` → `PAID` → `CLOSED`)
   - Illegal state transition rejections (e.g. attempting to pay an already closed order, or paying a voided order)
   - Mandatory manager PIN verification on void & refund actions

3. **Multi-Tenant Isolation Tests**
   - Cross-tenant data bleed prevention (Tenant A querying Tenant B resources)
   - Outlet-scoped resource isolation

4. **Offline Outbox & Synchronization Tests**
   - Offline order generation with local UUID
   - Outbox queue storage and automatic re-sync on network reconnect
   - Duplicate transaction rejection via Idempotency Keys

5. **Hotel Folio Integration Tests**
   - Guest room verification
   - Exceeding room credit limit rejection
   - Correct folio balance update on post-to-room

6. **Fiscalization & Cryptographic Signature Tests**
   - Canonical hash and signature generation
   - QR code payload verification
