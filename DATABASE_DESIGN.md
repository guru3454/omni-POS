# DATABASE DESIGN: Entity Relationship & Schema Specifications

## Core Domain Schema

```text
tenants (id, name, domain, plan_tier, is_active, created_at)
  └── organizations (id, tenant_id, name, currency, tax_number, created_at)
        └── hotels (id, org_id, name, address, timezone, star_rating)
              ├── outlets (id, hotel_id, name, type [RESTAURANT|BAR|ROOM_SERVICE|BANQUET], is_active)
              │     ├── floors (id, outlet_id, name, level)
              │     │     └── tables (id, floor_id, number, capacity, shape, pos_x, pos_y, status)
              │     ├── menu_categories (id, outlet_id, name, sort_order)
              │     │     └── menu_items (id, category_id, name, description, base_price, tax_rate, is_available, station)
              │     │           └── modifier_groups (id, item_id, name, min_select, max_select, is_required)
              │     │                 └── modifier_options (id, group_id, name, price_delta, nested_group_id)
              │     └── shifts (id, outlet_id, cashier_id, opening_float, cash_collected, expected_cash, status, opened_at, closed_at)
              │
              ├── hotel_rooms (id, hotel_id, room_number, room_type, status)
              │     └── guest_folios (id, room_id, guest_name, check_in, check_out, credit_limit, balance, is_open)
              │           └── folio_charges (id, folio_id, order_id, amount, description, posted_at, posted_by)
              │
              └── inventory_items (id, hotel_id, sku, name, unit [KG|G|L|ML|UNIT], current_stock, min_reorder_level, unit_cost)
                    └── recipes (id, menu_item_id, yield_qty)
                          └── recipe_ingredients (id, recipe_id, inventory_item_id, quantity, unit)

orders (id, tenant_id, outlet_id, table_id, seat_number, status, order_type, subtotal, tax_amount, discount_amount, service_charge, total_amount, created_at)
  ├── order_lines (id, order_id, menu_item_id, item_name, quantity, unit_price, line_total, seat_number, modifiers_json, notes)
  ├── kitchen_tickets (id, order_id, station [GRILL|BAR|PIZZA|DESSERT|PASS], status [PENDING|PREPARING|READY|SERVED], created_at, elapsed_seconds)
  ├── payments (id, order_id, amount, method [CASH|CARD|ROOM_CHARGE|MPESA], status, idempotency_key, transaction_ref, processed_at)
  └── fiscal_records (id, order_id, invoice_number, fiscal_signature, qr_code_payload, tax_breakdown_json, created_at)

audit_logs (id, tenant_id, actor_id, actor_name, action, entity, entity_id, payload_before, payload_after, timestamp)
```
