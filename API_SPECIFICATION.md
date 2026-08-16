# API SPECIFICATION: OmniPOS Hospitality & Restaurant Suite

## Endpoints

### 1. Authentication & Tenant Scope
- `POST /api/auth/login` - Authenticate with email/password or Quick-PIN.
- `GET  /api/auth/me` - Retrieve current user, permissions, and active organization context.
- `POST /api/auth/switch-outlet` - Switch active terminal outlet context.

### 2. Outlets, Floors & Tables
- `GET  /api/outlets` - List accessible outlets for current hotel.
- `GET  /api/floors/:outletId` - Get floors and real-time table statuses (`VACANT`, `OCCUPIED`, `ORDERED`, `FOOD_PREPARING`, `CHECK_REQUESTED`, `CHECK_PRINTED`, `DIRTY`, etc.).
- `PATCH /api/tables/:tableId/status` - Update table status or transfer/merge tables.

### 3. Menu & 4-Level Modifiers
- `GET  /api/menu/:outletId` - Retrieve full hierarchical menu (categories, items, 4-tier nested modifier groups, prices, taxes, station routing).

### 4. Orders & State Transitions
- `GET  /api/orders/active` - List active orders for outlet.
- `POST /api/orders` - Create canonical order with lines, seat assignments, and automatic kitchen ticket generation.
- `PATCH /api/orders/:orderId/state` - Transition order state (`OPEN`, `SUBMITTED`, `PREPARING`, `READY`, `SERVED`, `PAID`, `CLOSED`, `VOIDED`).
- `POST /api/orders/:orderId/split` - Split bill by seat, item, or equal shares.
- `POST /api/orders/:orderId/void` - Void order lines (requires manager authorization PIN and reason).

### 5. Kitchen Display System (KDS)
- `GET  /api/kds/:outletId` - Live kitchen tickets filtered by station (`GRILL`, `BAR`, `PIZZA`, `DESSERT`, `EXPEDITER`).
- `PATCH /api/kds/tickets/:ticketId/bump` - Bump/advance ticket item state or recall ticket.

### 6. Hotel Folio & Room Charging
- `GET  /api/hotel/rooms` - Room occupancy and guest folio lookup.
- `POST /api/hotel/folio-charge` - Post restaurant/bar order bill directly to room folio with credit limit check.

### 7. Inventory & Recipe Deduction
- `GET  /api/inventory` - Stock items, current levels, unit costs, and reorder alerts.
- `POST /api/inventory/adjust` - Manual stock adjustment or wastage logging with audit trail.

### 8. Payments & Settlement
- `POST /api/payments/process` - Idempotent multi-tender settlement (Cash, Card, M-Pesa/Mobile, Room Charge).
- `POST /api/payments/refund` - Process refund with manager authorization.

### 9. Shifts & X/Z Reports
- `POST /api/shifts/open` - Open cashier shift with initial cash float.
- `POST /api/shifts/close` - Close shift, compute variance, and generate X/Z Report.

### 10. Fiscalization (eTIMS / KRA)
- `POST /api/fiscal/sign` - Sign invoice payload with cryptographic fiscal receipt and generate verifiable QR code.

### 11. Sync & Offline Outbox
- `POST /api/sync/batch` - Ingest batch of offline outbox transactions with idempotency validation.
