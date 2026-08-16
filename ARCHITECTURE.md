# ARCHITECTURE BLUEPRINT: Enterprise Hotel & Restaurant POS SaaS

```text
                               ┌─────────────────────────────────────────────────────────┐
                               │                    CLIENT CLIENT APPS                   │
                               │                                                         │
                               │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
                               │  │   FOH POS    │  │   KDS Board  │  │  Admin Hub   │  │
                               │  │  (Touch UI)  │  │ (Multi-Stn)  │  │  (Analytics) │  │
                               │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
                               └─────────┼─────────────────┼─────────────────┼───────────┘
                                         │                 │                 │
                                         ▼                 ▼                 ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT HARDWARE & OFFLINE ENGINE (HAL)                          │
│  • Outbox Queue Manager (IndexedDB / LocalStore) with UUID & Exponential Backoff       │
│  • Network State Monitor (Online / Degraded / Air-Gapped)                              │
│  • ESC/POS Thermal Receipt & Kitchen Docket Generator                                  │
│  • Multi-Station Kitchen Router (Grill, Bar, Pizza, Dessert, Pass)                    │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │ REST API / WebSocket RPC
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                BACKEND SERVICES (SERVER)                               │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Multi-Tenant Context Resolver (JWT / Tenant ID / Org ID / Outlet ID / Device ID) │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌─────────────────┬─────────────────┬─────────────────┬────────────────────────────┐  │
│  │ Order State     │ Payment & Split │ Hotel Folio /   │ Recipe & Inventory         │  │
│  │ Machine (FSM)   │ Tender Engine   │ PMS Integration │ BOM Consumption Engine     │  │
│  ├─────────────────┼─────────────────┼─────────────────┼────────────────────────────┤  │
│  │ Kitchen Routing │ Fiscalization   │ Shift & Cashier │ SaaS Entitlement &         │  │
│  │ Engine          │ Adapter (eTIMS) │ X/Z Ledger      │ Subscription Guard         │  │
│  └─────────────────┴─────────────────┴─────────────────┴────────────────────────────┘  │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        DATA PERSISTENCE & AUDIT LOGGING                                │
│  • Multi-Tenant Scoped Data Store with Referential Integrity                           │
│  • Immutable Cryptographic Audit & Fiscal Event Ledger                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## System Tenets
1. **Never Trust Client Inputs**: Prices, taxes, line calculations, and stock deductions are evaluated on the backend engine.
2. **Offline-First Resilience**: Transactions are generated with deterministic UUIDs and queued in an Outbox with idempotency keys.
3. **Strict State Transitions**: Orders progress through strict states; illegal transitions (e.g. paying an already closed or voided order) are blocked.
4. **Hotel & Restaurant Integration**: Restaurant charges can be posted directly to occupied guest folios with room credit limit verification.
5. **Auditable Ledger**: Every void, discount, refund, and stock movement logs an immutable audit event with actor, timestamp, and reason.
