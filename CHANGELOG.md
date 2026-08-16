# CHANGELOG: OmniPOS Enterprise Platform

## [1.0.0-PROD] - 2026-08-16
### Initial Release & Full-Suite Architecture
- **Multi-Tenant Foundation**: Full organizational hierarchy (Tenant -> Org -> Hotel -> Outlets -> Terminals/KDS).
- **Core Order & Modifier Engine**: 4-level nested modifiers, variant pricing, seat mapping, line notes, state machine.
- **Touch FOH POS**: Real-time table floor plans with 11 discrete states, quick-category filtering, seat-level cart, multi-tender split settlement.
- **KDS Kitchen Display**: Multi-station ticket routing (Grill, Bar, Pizza, Dessert, Pass), aging visual timer thresholds (0-9m, 10-14m, 15m+), consolidated item summary, ticket recall.
- **Hotel Operations**: Guest Folio directory, post-to-room charging, room credit limits, banquet & room-service modes.
- **Inventory & BOM**: Real-time recipe degradation, ingredient conversion units, low-stock alerts, wastage logging.
- **Hardware & Printing**: ESC/POS thermal receipt formatting, kitchen order tickets, cash drawer kick.
- **Fiscalization Adapter**: eTIMS/KRA compliant digital invoice signing & QR code generation.
- **Cashier Shifts & Ledger**: Float management, X-Report & Z-Report generation.
- **Offline Outbox**: IndexedDB client queue, UUID generation, automatic retry on reconnect.
- **In-App Automated Verification Suite**: Built-in test execution runner validating financial, isolation, and state machine integrity.
