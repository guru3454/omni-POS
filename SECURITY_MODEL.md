# SECURITY MODEL & THREAT MITIGATION

## 1. Multi-Tenant Isolation
- Tenant context is strictly derived from the authenticated user identity and organization membership.
- Client-supplied tenant IDs in request bodies are validated against server session context to prevent IDOR / cross-tenant bleeding.
- All query operations include tenant and outlet predicate filters.

## 2. RBAC & Granular Permissions
- Roles defined: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `HOTEL_MANAGER`, `OUTLET_MANAGER`, `SUPERVISOR`, `CASHIER`, `WAITER`, `BARTENDER`, `CHEF`, `INVENTORY_MANAGER`, `AUDITOR`.
- Sensitive operations require explicit permission tags (e.g., `ORDER_VOID`, `ORDER_DISCOUNT`, `PRICE_CHANGE`, `CASH_DRAWER_OPEN`). Manager PIN verification is enforced for discounts > 20% and item voids.

## 3. Financial Integrity & Zero Card Storage
- Backend processes payments through abstract tokenized payment intents. No PAN (Primary Account Number), CVV, or magstripe data is ever transmitted or stored.
- Idempotency keys (`Idempotency-Key` header with UUID) prevent duplicate charges on network retries.

## 4. Immutable Audit Logging
- High-risk operations create non-repudiable audit logs containing:
  `actor_id`, `actor_name`, `tenant_id`, `outlet_id`, `action`, `entity`, `entity_id`, `previous_state`, `new_state`, `reason`, `ip`, `timestamp`.
