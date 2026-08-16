import {
  Tenant,
  Organization,
  Hotel,
  Outlet,
  User,
  Floor,
  Table,
  TableStatus,
  MenuCategory,
  MenuItem,
  Order,
  OrderLine,
  OrderStatus,
  OrderType,
  KitchenStation,
  KitchenTicket,
  TicketStatus,
  HotelRoom,
  GuestFolio,
  InventoryItem,
  Recipe,
  StockMovement,
  StockMovementType,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Shift,
  ShiftStatus,
  AuditLog,
  OutboxTransaction,
  SyncStatus,
  UserRole,
  FiscalRecord,
  UUID,
} from '../types';
import {
  INITIAL_TENANT,
  INITIAL_ORG,
  INITIAL_HOTEL,
  INITIAL_OUTLETS,
  INITIAL_USERS,
  INITIAL_FLOORS,
  INITIAL_TABLES,
  INITIAL_MENU_CATEGORIES,
  INITIAL_HOTEL_ROOMS,
  INITIAL_GUEST_FOLIOS,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_RECIPES,
  INITIAL_ORDERS,
  INITIAL_KITCHEN_TICKETS,
  INITIAL_SHIFTS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockDatabase';

const STORAGE_KEY = 'omnipos_enterprise_v1_store';

interface AppStoreState {
  tenant: Tenant;
  organization: Organization;
  hotel: Hotel;
  outlets: Outlet[];
  currentOutletId: string;
  users: User[];
  currentUser: User;
  floors: Floor[];
  tables: Table[];
  categories: MenuCategory[];
  orders: Order[];
  kitchenTickets: KitchenTicket[];
  rooms: HotelRoom[];
  folios: GuestFolio[];
  inventory: InventoryItem[];
  recipes: Recipe[];
  stockMovements: StockMovement[];
  payments: Payment[];
  shifts: Shift[];
  auditLogs: AuditLog[];
  outbox: OutboxTransaction[];
  fiscalRecords: FiscalRecord[];
  isOnline: boolean;
}

// Generate secure UUID
export function generateUUID(): UUID {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'uuid-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

class StorageService {
  private state: AppStoreState;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): AppStoreState {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        // Ensure required collections are populated
        if (parsed.tenant && parsed.orders && parsed.categories) {
          return {
            ...parsed,
            isOnline: true,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load storage from localStorage, using seed database', e);
    }

    return {
      tenant: INITIAL_TENANT,
      organization: INITIAL_ORG,
      hotel: INITIAL_HOTEL,
      outlets: INITIAL_OUTLETS,
      currentOutletId: INITIAL_OUTLETS[0].id,
      users: INITIAL_USERS,
      currentUser: INITIAL_USERS[0],
      floors: INITIAL_FLOORS,
      tables: INITIAL_TABLES,
      categories: INITIAL_MENU_CATEGORIES,
      orders: INITIAL_ORDERS,
      kitchenTickets: INITIAL_KITCHEN_TICKETS,
      rooms: INITIAL_HOTEL_ROOMS,
      folios: INITIAL_GUEST_FOLIOS,
      inventory: INITIAL_INVENTORY_ITEMS,
      recipes: INITIAL_RECIPES,
      stockMovements: [],
      payments: [],
      shifts: INITIAL_SHIFTS,
      auditLogs: INITIAL_AUDIT_LOGS,
      outbox: [],
      fiscalRecords: [],
      isOnline: true,
    };
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist store state to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  // ------------------------------------------
  // Global Getters
  // ------------------------------------------
  public getState(): AppStoreState {
    return this.state;
  }

  public getCurrentOutlet(): Outlet {
    const found = this.state.outlets.find((o) => o.id === this.state.currentOutletId);
    return found || this.state.outlets[0];
  }

  public setCurrentOutlet(outletId: string) {
    this.state.currentOutletId = outletId;
    this.addAuditLog('SWITCH_OUTLET', 'Outlet', outletId, `Switched active outlet to ${this.getCurrentOutlet().name}`);
    this.persist();
  }

  public getCurrentUser(): User {
    return this.state.currentUser;
  }

  public setCurrentUser(user: User) {
    this.state.currentUser = user;
    this.addAuditLog('SWITCH_USER', 'User', user.id, `Active user switched to ${user.name} (${user.role})`);
    this.persist();
  }

  public setOnlineStatus(isOnline: boolean) {
    this.state.isOnline = isOnline;
    this.notify();
  }

  // ------------------------------------------
  // Audit Logging
  // ------------------------------------------
  public addAuditLog(action: string, entity: string, entityId: string, details: string, previousState?: any, newState?: any) {
    const log: AuditLog = {
      id: generateUUID(),
      tenantId: this.state.tenant.id,
      outletId: this.state.currentOutletId,
      actorId: this.state.currentUser.id,
      actorName: this.state.currentUser.name,
      actorRole: this.state.currentUser.role,
      action,
      entity,
      entityId,
      details,
      previousState,
      newState,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
  }

  // ------------------------------------------
  // Order Calculations & State Machine
  // ------------------------------------------
  public calculateOrderTotals(lines: OrderLine[], discountAmount: number = 0, outletId?: string) {
    const outlet = outletId ? this.state.outlets.find((o) => o.id === outletId) || this.getCurrentOutlet() : this.getCurrentOutlet();
    
    // Sum lines (only active, non-voided items)
    const activeLines = lines.filter((l) => !l.isVoided);
    const subtotal = activeLines.reduce((acc, line) => acc + line.lineTotal, 0);

    const afterDiscount = Math.max(0, subtotal - discountAmount);

    const taxAmount = Number((afterDiscount * outlet.taxRate).toFixed(2));
    const serviceChargeAmount = Number((afterDiscount * outlet.serviceChargeRate).toFixed(2));
    const cateringLevyAmount = Number((afterDiscount * outlet.cateringLevyRate).toFixed(2));

    const totalAmount = Number((afterDiscount + taxAmount + serviceChargeAmount + cateringLevyAmount).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      taxAmount,
      serviceChargeAmount,
      cateringLevyAmount,
      totalAmount,
    };
  }

  public createOrder(
    tableId?: string,
    orderType: OrderType = OrderType.DINE_IN,
    guestCount: number = 1,
    roomNumber?: string,
    guestName?: string,
    guestFolioId?: string
  ): Order {
    let tableName: string | undefined;
    if (tableId) {
      const table = this.state.tables.find((t) => t.id === tableId);
      if (table) {
        tableName = table.number;
        table.status = TableStatus.OCCUPIED;
        table.guestCount = guestCount;
        table.assignedWaiterId = this.state.currentUser.id;
        table.assignedWaiterName = this.state.currentUser.name;
        table.lastStatusChange = new Date().toISOString();
      }
    }

    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: generateUUID(),
      tenantId: this.state.tenant.id,
      orgId: this.state.organization.id,
      outletId: this.state.currentOutletId,
      tableId,
      tableName,
      orderNumber,
      orderType,
      status: OrderStatus.OPEN,
      serverUserId: this.state.currentUser.id,
      serverName: this.state.currentUser.name,
      guestCount,
      roomNumber,
      guestName,
      guestFolioId,
      lines: [],
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      serviceChargeAmount: 0,
      cateringLevyAmount: 0,
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (tableId) {
      const table = this.state.tables.find((t) => t.id === tableId);
      if (table) {
        table.currentOrderId = newOrder.id;
      }
    }

    this.state.orders.unshift(newOrder);
    this.addAuditLog('ORDER_CREATE', 'Order', newOrder.id, `Created ${orderType} ${orderNumber} for Table ${tableName || 'N/A'}`);
    this.persist();
    return newOrder;
  }

  public addLineToOrder(orderId: string, lineData: Omit<OrderLine, 'id' | 'addedAt'>): Order {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    if (order.status === OrderStatus.PAID || order.status === OrderStatus.CLOSED || order.status === OrderStatus.VOIDED) {
      throw new Error(`Cannot modify order in state ${order.status}`);
    }

    const newLine: OrderLine = {
      ...lineData,
      id: generateUUID(),
      addedAt: new Date().toISOString(),
    };

    order.lines.push(newLine);

    const totals = this.calculateOrderTotals(order.lines, order.discountAmount, order.outletId);
    order.subtotal = totals.subtotal;
    order.taxAmount = totals.taxAmount;
    order.serviceChargeAmount = totals.serviceChargeAmount;
    order.cateringLevyAmount = totals.cateringLevyAmount;
    order.totalAmount = totals.totalAmount;
    order.balanceAmount = Number((order.totalAmount - order.paidAmount).toFixed(2));
    order.updatedAt = new Date().toISOString();

    this.persist();
    return order;
  }

  public removeLineFromOrder(orderId: string, lineId: string): Order {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    order.lines = order.lines.filter((l) => l.id !== lineId);

    const totals = this.calculateOrderTotals(order.lines, order.discountAmount, order.outletId);
    order.subtotal = totals.subtotal;
    order.taxAmount = totals.taxAmount;
    order.serviceChargeAmount = totals.serviceChargeAmount;
    order.cateringLevyAmount = totals.cateringLevyAmount;
    order.totalAmount = totals.totalAmount;
    order.balanceAmount = Number((order.totalAmount - order.paidAmount).toFixed(2));
    order.updatedAt = new Date().toISOString();

    this.persist();
    return order;
  }

  public voidOrderLine(orderId: string, lineId: string, reason: string, approvedByPin: string): Order {
    const manager = this.verifyManagerPin(approvedByPin);
    if (!manager) throw new Error('Invalid Manager Authorization PIN');

    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const line = order.lines.find((l) => l.id === lineId);
    if (!line) throw new Error(`Line ${lineId} not found`);

    line.isVoided = true;
    line.voidReason = reason;
    line.voidApprovedBy = manager.name;

    const totals = this.calculateOrderTotals(order.lines, order.discountAmount, order.outletId);
    order.subtotal = totals.subtotal;
    order.taxAmount = totals.taxAmount;
    order.serviceChargeAmount = totals.serviceChargeAmount;
    order.cateringLevyAmount = totals.cateringLevyAmount;
    order.totalAmount = totals.totalAmount;
    order.balanceAmount = Number((order.totalAmount - order.paidAmount).toFixed(2));
    order.updatedAt = new Date().toISOString();

    this.addAuditLog(
      'ORDER_LINE_VOID',
      'OrderLine',
      line.id,
      `Voided line "${line.name}" on ${order.orderNumber}. Reason: ${reason}. Approved by: ${manager.name}`
    );

    this.persist();
    return order;
  }

  public applyOrderDiscount(orderId: string, discountPercent: number, reason: string, approvedByPin: string): Order {
    const manager = this.verifyManagerPin(approvedByPin);
    if (!manager) throw new Error('Manager authorization PIN required to apply discounts');

    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const discountAmount = Number(((order.subtotal * discountPercent) / 100).toFixed(2));
    order.discountPercent = discountPercent;
    order.discountAmount = discountAmount;
    order.discountReason = reason;

    const totals = this.calculateOrderTotals(order.lines, discountAmount, order.outletId);
    order.taxAmount = totals.taxAmount;
    order.serviceChargeAmount = totals.serviceChargeAmount;
    order.cateringLevyAmount = totals.cateringLevyAmount;
    order.totalAmount = totals.totalAmount;
    order.balanceAmount = Number((order.totalAmount - order.paidAmount).toFixed(2));
    order.updatedAt = new Date().toISOString();

    this.addAuditLog(
      'ORDER_DISCOUNT',
      'Order',
      order.id,
      `Applied ${discountPercent}% ($${discountAmount}) discount on ${order.orderNumber}. Reason: ${reason}. Authorized by ${manager.name}`
    );

    this.persist();
    return order;
  }

  // ------------------------------------------
  // Submit Order & Kitchen Routing
  // ------------------------------------------
  public submitOrderToKitchen(orderId: string): Order {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    if (order.lines.length === 0) throw new Error('Cannot submit empty order');

    order.status = OrderStatus.SUBMITTED;
    order.submittedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    if (order.tableId) {
      const table = this.state.tables.find((t) => t.id === order.tableId);
      if (table) {
        table.status = TableStatus.FOOD_PREPARING;
        table.lastStatusChange = new Date().toISOString();
      }
    }

    // Group items by Kitchen Station
    const linesByStation: Record<KitchenStation, OrderLine[]> = {
      [KitchenStation.GRILL]: [],
      [KitchenStation.BAR]: [],
      [KitchenStation.PIZZA]: [],
      [KitchenStation.DESSERT]: [],
      [KitchenStation.COLD_LARDER]: [],
      [KitchenStation.HOT_PASS]: [],
    };

    order.lines.forEach((line) => {
      if (!line.isVoided) {
        const station = line.station || KitchenStation.GRILL;
        if (!linesByStation[station]) linesByStation[station] = [];
        linesByStation[station].push(line);
      }
    });

    // Create tickets for each station with items
    Object.entries(linesByStation).forEach(([stationKey, items]) => {
      if (items.length > 0) {
        const ticket: KitchenTicket = {
          id: generateUUID(),
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableName: order.tableName,
          roomNumber: order.roomNumber,
          orderType: order.orderType,
          station: stationKey as KitchenStation,
          serverName: order.serverName,
          status: TicketStatus.PREPARING,
          priority: 'NORMAL',
          createdAt: new Date().toISOString(),
          items: items.map((item) => ({
            lineId: item.id,
            name: item.name,
            quantity: item.quantity,
            seatNumber: item.seatNumber,
            modifiersSummary: item.selectedModifiers.map(
              (m) => `${m.optionName}${m.nestedOptionName ? ` (${m.nestedOptionName})` : ''}`
            ),
            specialInstructions: item.specialInstructions,
            isDone: false,
          })),
        };
        this.state.kitchenTickets.unshift(ticket);
      }
    });

    // Deduct Inventory BOM for submitted items
    this.deductInventoryForOrder(order);

    this.addAuditLog(
      'ORDER_SUBMIT_KITCHEN',
      'Order',
      order.id,
      `Submitted ${order.orderNumber} ($${order.totalAmount}) to Kitchen. Generated station tickets and deducted inventory BOM.`
    );

    // Queue outbox if needed
    this.queueOutbox('CREATE_ORDER', order);

    this.persist();
    return order;
  }

  // ------------------------------------------
  // Inventory BOM Consumption
  // ------------------------------------------
  private deductInventoryForOrder(order: Order) {
    order.lines.forEach((line) => {
      if (line.isVoided) return;
      const recipe = this.state.recipes.find((r) => r.menuItemId === line.menuItemId);
      if (!recipe) return;

      recipe.ingredients.forEach((ing) => {
        const stockItem = this.state.inventory.find((i) => i.id === ing.inventoryItemId);
        if (stockItem) {
          const totalQtyToDeduct = ing.quantityRequired * line.quantity;
          const prevBalance = stockItem.currentStock;
          stockItem.currentStock = Number((stockItem.currentStock - totalQtyToDeduct).toFixed(3));

          const movement: StockMovement = {
            id: generateUUID(),
            hotelId: this.state.hotel.id,
            inventoryItemId: stockItem.id,
            inventoryItemName: stockItem.name,
            movementType: StockMovementType.CONSUMPTION,
            quantityChange: -totalQtyToDeduct,
            previousBalance: prevBalance,
            newBalance: stockItem.currentStock,
            costImpact: Number((totalQtyToDeduct * stockItem.unitCost).toFixed(2)),
            referenceDoc: `Order #${order.orderNumber} (${line.name} x${line.quantity})`,
            performedBy: this.state.currentUser.name,
            timestamp: new Date().toISOString(),
          };
          this.state.stockMovements.unshift(movement);
        }
      });
    });
  }

  // ------------------------------------------
  // Kitchen Ticket Bump / Recall
  // ------------------------------------------
  public bumpKitchenTicketItem(ticketId: string, lineId: string) {
    const ticket = this.state.kitchenTickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const item = ticket.items.find((i) => i.lineId === lineId);
    if (item) {
      item.isDone = !item.isDone;
    }

    const allDone = ticket.items.every((i) => i.isDone);
    if (allDone) {
      ticket.status = TicketStatus.READY;
    } else {
      ticket.status = TicketStatus.PREPARING;
    }

    this.persist();
  }

  public completeKitchenTicket(ticketId: string) {
    const ticket = this.state.kitchenTickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    ticket.status = TicketStatus.SERVED;
    ticket.completedAt = new Date().toISOString();
    ticket.items.forEach((i) => (i.isDone = true));

    this.persist();
  }

  public recallKitchenTicket(ticketId: string) {
    const ticket = this.state.kitchenTickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    ticket.status = TicketStatus.PREPARING;
    ticket.completedAt = undefined;

    this.persist();
  }

  // ------------------------------------------
  // Payments & Hotel Room Folio Settlement
  // ------------------------------------------
  public processPayment(
    orderId: string,
    amount: number,
    tipAmount: number,
    method: PaymentMethod,
    idempotencyKey: string,
    paymentMeta?: {
      cardLastFour?: string;
      roomNumber?: string;
      guestFolioId?: string;
      mpesaPhoneNumber?: string;
      mpesaReceiptNumber?: string;
    }
  ): { payment: Payment; order: Order } {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    if (order.status === OrderStatus.PAID || order.status === OrderStatus.CLOSED) {
      throw new Error(`Order ${order.orderNumber} is already settled`);
    }

    // Check duplicate idempotency
    const existingPayment = this.state.payments.find((p) => p.idempotencyKey === idempotencyKey);
    if (existingPayment) {
      return { payment: existingPayment, order };
    }

    // If Hotel Room Charge, verify folio & credit limit
    if (method === PaymentMethod.ROOM_CHARGE) {
      if (!paymentMeta?.roomNumber || !paymentMeta?.guestFolioId) {
        throw new Error('Room Number and Guest Folio required for Room Charge');
      }

      const folio = this.state.folios.find((f) => f.id === paymentMeta.guestFolioId);
      if (!folio || folio.status !== 'OPEN') {
        throw new Error(`Guest Folio for Room ${paymentMeta.roomNumber} is invalid or closed`);
      }

      const totalWithNewCharge = folio.totalCharges + amount;
      if (totalWithNewCharge > folio.creditLimit) {
        throw new Error(
          `Charge of $${amount.toFixed(2)} exceeds guest credit limit of $${folio.creditLimit.toFixed(2)} (Current Charges: $${folio.totalCharges.toFixed(2)})`
        );
      }

      // Post charge to Folio
      const folioCharge = {
        id: generateUUID(),
        folioId: folio.id,
        orderId: order.id,
        outletName: this.getCurrentOutlet().name,
        amount: amount,
        description: `Restaurant Order #${order.orderNumber} (${order.tableName || 'Dine-in'})`,
        postedBy: this.state.currentUser.name,
        postedAt: new Date().toISOString(),
      };
      folio.charges.push(folioCharge);
      folio.totalCharges = Number((folio.totalCharges + amount).toFixed(2));

      // Update room balance
      const room = this.state.rooms.find((r) => r.id === folio.roomId);
      if (room) {
        room.currentBalance = folio.totalCharges;
      }
    }

    const payment: Payment = {
      id: generateUUID(),
      orderId: order.id,
      amount,
      tipAmount,
      method,
      status: PaymentStatus.COMPLETED,
      referenceNumber: `TX-${Date.now().toString().slice(-6)}`,
      idempotencyKey,
      processedByUserId: this.state.currentUser.id,
      processedByName: this.state.currentUser.name,
      processedAt: new Date().toISOString(),
      ...paymentMeta,
    };

    this.state.payments.push(payment);

    // Update order paid and balance
    order.paidAmount = Number((order.paidAmount + amount).toFixed(2));
    order.balanceAmount = Math.max(0, Number((order.totalAmount - order.paidAmount).toFixed(2)));

    if (order.balanceAmount === 0) {
      order.status = OrderStatus.PAID;
      order.completedAt = new Date().toISOString();

      if (order.tableId) {
        const table = this.state.tables.find((t) => t.id === order.tableId);
        if (table) {
          table.status = TableStatus.PAID;
          table.lastStatusChange = new Date().toISOString();
        }
      }
    } else {
      order.status = OrderStatus.PAYMENT_PENDING;
    }

    // Update active shift stats
    const activeShift = this.getActiveShift();
    if (activeShift) {
      activeShift.totalSales = Number((activeShift.totalSales + amount).toFixed(2));
      if (method === PaymentMethod.CASH) {
        activeShift.cashSales = Number((activeShift.cashSales + amount).toFixed(2));
        activeShift.expectedCash = Number((activeShift.expectedCash + amount).toFixed(2));
      } else if (method === PaymentMethod.CARD) {
        activeShift.cardSales = Number((activeShift.cardSales + amount).toFixed(2));
      } else if (method === PaymentMethod.ROOM_CHARGE) {
        activeShift.roomCharges = Number((activeShift.roomCharges + amount).toFixed(2));
      } else if (method === PaymentMethod.MPESA) {
        activeShift.mpesaSales = Number((activeShift.mpesaSales + amount).toFixed(2));
      }
    }

    this.addAuditLog(
      'PAYMENT_PROCESS',
      'Payment',
      payment.id,
      `Processed ${method} payment of $${amount.toFixed(2)} for ${order.orderNumber}. Ref: ${payment.referenceNumber}`
    );

    this.queueOutbox('SETTLE_PAYMENT', payment);
    this.persist();
    return { payment, order };
  }

  // ------------------------------------------
  // Table Operations (Transfer, Status, Clear)
  // ------------------------------------------
  public updateTableStatus(tableId: string, status: TableStatus) {
    const table = this.state.tables.find((t) => t.id === tableId);
    if (!table) return;

    table.status = status;
    table.lastStatusChange = new Date().toISOString();

    if (status === TableStatus.VACANT) {
      table.currentOrderId = undefined;
      table.assignedWaiterId = undefined;
      table.assignedWaiterName = undefined;
      table.guestCount = undefined;
    }

    this.persist();
  }

  public transferTable(fromTableId: string, toTableId: string) {
    const fromTable = this.state.tables.find((t) => t.id === fromTableId);
    const toTable = this.state.tables.find((t) => t.id === toTableId);

    if (!fromTable || !toTable) throw new Error('Invalid source or destination table');
    if (toTable.status !== TableStatus.VACANT) {
      throw new Error(`Destination table ${toTable.number} is not vacant`);
    }

    const order = this.state.orders.find((o) => o.id === fromTable.currentOrderId);
    if (order) {
      order.tableId = toTable.id;
      order.tableName = toTable.number;
    }

    toTable.status = fromTable.status;
    toTable.currentOrderId = fromTable.currentOrderId;
    toTable.assignedWaiterId = fromTable.assignedWaiterId;
    toTable.assignedWaiterName = fromTable.assignedWaiterName;
    toTable.guestCount = fromTable.guestCount;
    toTable.lastStatusChange = new Date().toISOString();

    fromTable.status = TableStatus.VACANT;
    fromTable.currentOrderId = undefined;
    fromTable.assignedWaiterId = undefined;
    fromTable.assignedWaiterName = undefined;
    fromTable.guestCount = undefined;
    fromTable.lastStatusChange = new Date().toISOString();

    this.addAuditLog('TABLE_TRANSFER', 'Table', toTable.id, `Transferred Order from Table ${fromTable.number} to Table ${toTable.number}`);
    this.persist();
  }

  // ------------------------------------------
  // Shifts & Cashier Management
  // ------------------------------------------
  public getActiveShift(): Shift | undefined {
    return this.state.shifts.find((s) => s.outletId === this.state.currentOutletId && s.status === ShiftStatus.OPEN);
  }

  public openShift(openingFloat: number, notes?: string): Shift {
    const active = this.getActiveShift();
    if (active) throw new Error('An active shift is already open for this outlet');

    const newShift: Shift = {
      id: generateUUID(),
      outletId: this.state.currentOutletId,
      cashierUserId: this.state.currentUser.id,
      cashierName: this.state.currentUser.name,
      openingFloat,
      cashSales: 0,
      cardSales: 0,
      roomCharges: 0,
      mpesaSales: 0,
      totalSales: 0,
      cashDrops: 0,
      expectedCash: openingFloat,
      status: ShiftStatus.OPEN,
      openedAt: new Date().toISOString(),
      notes,
    };

    this.state.shifts.unshift(newShift);
    this.addAuditLog('SHIFT_OPEN', 'Shift', newShift.id, `Opened Cashier Shift with $${openingFloat.toFixed(2)} float`);
    this.persist();
    return newShift;
  }

  public closeShift(actualCashCount: number, notes?: string): Shift {
    const shift = this.getActiveShift();
    if (!shift) throw new Error('No active shift found to close');

    shift.status = ShiftStatus.CLOSED;
    shift.closedAt = new Date().toISOString();
    shift.actualCashCount = actualCashCount;
    shift.variance = Number((actualCashCount - shift.expectedCash).toFixed(2));
    shift.notes = notes;

    this.addAuditLog(
      'SHIFT_CLOSE',
      'Shift',
      shift.id,
      `Closed Shift. Expected Cash: $${shift.expectedCash.toFixed(2)}, Actual: $${actualCashCount.toFixed(2)}, Variance: $${shift.variance.toFixed(2)}`
    );

    this.persist();
    return shift;
  }

  // ------------------------------------------
  // Outbox & Offline Sync
  // ------------------------------------------
  public queueOutbox(operationType: OutboxTransaction['operationType'], payload: any) {
    const tx: OutboxTransaction = {
      id: generateUUID(),
      idempotencyKey: generateUUID(),
      tenantId: this.state.tenant.id,
      outletId: this.state.currentOutletId,
      operationType,
      payload,
      createdAt: new Date().toISOString(),
      syncStatus: this.state.isOnline ? SyncStatus.SYNCED : SyncStatus.PENDING,
      retryCount: 0,
    };
    this.state.outbox.unshift(tx);
  }

  public syncOutbox(): number {
    let syncedCount = 0;
    this.state.outbox.forEach((tx) => {
      if (tx.syncStatus === SyncStatus.PENDING || tx.syncStatus === SyncStatus.FAILED) {
        tx.syncStatus = SyncStatus.SYNCED;
        syncedCount++;
      }
    });
    this.persist();
    return syncedCount;
  }

  // ------------------------------------------
  // PIN Verification Helper
  // ------------------------------------------
  public verifyManagerPin(pin: string): User | null {
    const manager = this.state.users.find(
      (u) =>
        u.pin === pin &&
        u.isActive &&
        (u.role === UserRole.ORGANIZATION_ADMIN ||
          u.role === UserRole.HOTEL_MANAGER ||
          u.role === UserRole.OUTLET_MANAGER ||
          u.role === UserRole.SUPERVISOR)
    );
    return manager || null;
  }

  // ------------------------------------------
  // Menu Item / Inventory Helpers
  // ------------------------------------------
  public updateMenuItemAvailability(itemId: string, isAvailable: boolean) {
    for (const cat of this.state.categories) {
      const item = cat.items.find((i) => i.id === itemId);
      if (item) {
        item.isAvailable = isAvailable;
        this.addAuditLog('MENU_ITEM_UPDATE', 'MenuItem', item.id, `Set ${item.name} availability to ${isAvailable ? 'AVAILABLE' : 'OUT_OF_STOCK'}`);
        this.persist();
        return;
      }
    }
  }

  public adjustInventoryStock(itemId: string, quantityChange: number, reason: string, movementType: StockMovementType) {
    const item = this.state.inventory.find((i) => i.id === itemId);
    if (!item) throw new Error('Inventory Item not found');

    const prev = item.currentStock;
    item.currentStock = Number((item.currentStock + quantityChange).toFixed(3));

    const movement: StockMovement = {
      id: generateUUID(),
      hotelId: this.state.hotel.id,
      inventoryItemId: item.id,
      inventoryItemName: item.name,
      movementType,
      quantityChange,
      previousBalance: prev,
      newBalance: item.currentStock,
      costImpact: Number((Math.abs(quantityChange) * item.unitCost).toFixed(2)),
      referenceDoc: `Manual ${movementType}`,
      reason,
      performedBy: this.state.currentUser.name,
      timestamp: new Date().toISOString(),
    };
    this.state.stockMovements.unshift(movement);
    this.addAuditLog('INVENTORY_ADJUST', 'InventoryItem', item.id, `Adjusted ${item.name} by ${quantityChange} (${item.unit}). New Stock: ${item.currentStock}`);
    this.persist();
  }

  public resetToSeedData() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
    this.notify();
  }
}

export const storage = new StorageService();
