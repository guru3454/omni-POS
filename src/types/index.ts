// ==========================================
// OMNIPOS ENTERPRISE DOMAIN TYPES & ENUMS
// ==========================================

export type UUID = string;

export enum PlanTier {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  HOTEL_MANAGER = 'HOTEL_MANAGER',
  OUTLET_MANAGER = 'OUTLET_MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  CASHIER = 'CASHIER',
  WAITER = 'WAITER',
  BARTENDER = 'BARTENDER',
  KITCHEN_MANAGER = 'KITCHEN_MANAGER',
  CHEF = 'CHEF',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  AUDITOR = 'AUDITOR',
}

export enum OutletType {
  RESTAURANT = 'RESTAURANT',
  BAR = 'BAR',
  ROOM_SERVICE = 'ROOM_SERVICE',
  BANQUET = 'BANQUET',
  CAFE = 'CAFE',
  FOOD_COURT = 'FOOD_COURT',
}

export enum TableStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
  ORDERED = 'ORDERED',
  FOOD_PREPARING = 'FOOD_PREPARING',
  CHECK_REQUESTED = 'CHECK_REQUESTED',
  CHECK_PRINTED = 'CHECK_PRINTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  DIRTY = 'DIRTY',
  RESERVED = 'RESERVED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  SUBMITTED = 'SUBMITTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  CLOSED = 'CLOSED',
  VOIDED = 'VOIDED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  ROOM_SERVICE = 'ROOM_SERVICE',
  BAR_TAB = 'BAR_TAB',
  BANQUET = 'BANQUET',
}

export enum KitchenStation {
  GRILL = 'GRILL',
  BAR = 'BAR',
  PIZZA = 'PIZZA',
  DESSERT = 'DESSERT',
  COLD_LARDER = 'COLD_LARDER',
  HOT_PASS = 'HOT_PASS',
}

export enum TicketStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  RECALLED = 'RECALLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  ROOM_CHARGE = 'ROOM_CHARGE',
  MPESA = 'MPESA',
  VOUCHER = 'VOUCHER',
  CITY_LEDGER = 'CITY_LEDGER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  REVERSED = 'REVERSED',
}

export enum UnitOfMeasure {
  KG = 'KG',
  G = 'G',
  L = 'L',
  ML = 'ML',
  UNIT = 'UNIT',
  PORTION = 'PORTION',
}

export enum StockMovementType {
  RECEIVING = 'RECEIVING',
  CONSUMPTION = 'CONSUMPTION',
  WASTAGE = 'WASTAGE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  RETURN = 'RETURN',
}

export enum ShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
  CONFLICT = 'CONFLICT',
}

// ------------------------------------------
// Multi-Tenancy & Structure
// ------------------------------------------
export interface Tenant {
  id: UUID;
  name: string;
  domain: string;
  planTier: PlanTier;
  maxOutlets: number;
  maxRegisters: number;
  isActive: boolean;
  createdAt: string;
}

export interface Organization {
  id: UUID;
  tenantId: UUID;
  name: string;
  currency: string;
  currencySymbol: string;
  taxNumber: string;
  fiscalCountry: string; // 'KE' for Kenya / eTIMS
  createdAt: string;
}

export interface Hotel {
  id: UUID;
  orgId: UUID;
  name: string;
  address: string;
  timezone: string;
  phone: string;
  totalRooms: number;
}

export interface Outlet {
  id: UUID;
  hotelId: UUID;
  name: string;
  type: OutletType;
  isActive: boolean;
  taxRate: number; // e.g. 0.16 for 16% VAT
  serviceChargeRate: number; // e.g. 0.05 for 5% Service Charge
  cateringLevyRate: number; // e.g. 0.02 for 2% Catering Levy
}

export interface User {
  id: UUID;
  tenantId: UUID;
  orgId: UUID;
  name: string;
  email: string;
  role: UserRole;
  pin: string; // 4-6 digit numeric quick PIN for POS
  assignedOutlets: UUID[];
  isActive: boolean;
}

export interface Floor {
  id: UUID;
  outletId: UUID;
  name: string;
  level: number;
}

export interface Table {
  id: UUID;
  floorId: UUID;
  outletId: UUID;
  number: string;
  capacity: number;
  shape: 'ROUND' | 'RECTANGLE' | 'SQUARE' | 'BOOTH';
  posX: number;
  posY: number;
  width?: number;
  height?: number;
  status: TableStatus;
  currentOrderId?: UUID;
  assignedWaiterId?: UUID;
  assignedWaiterName?: string;
  guestCount?: number;
  lastStatusChange: string;
}

// ------------------------------------------
// Menu & 4-Level Modifiers
// ------------------------------------------
export interface ModifierNestedOption {
  id: UUID;
  name: string;
  priceDelta: number;
  isDefault?: boolean;
}

export interface ModifierOption {
  id: UUID;
  name: string;
  priceDelta: number;
  isDefault?: boolean;
  nestedGroupId?: UUID;
  nestedGroup?: {
    id: UUID;
    name: string;
    isRequired: boolean;
    options: ModifierNestedOption[];
  };
}

export interface ModifierGroup {
  id: UUID;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: UUID;
  categoryId: UUID;
  outletId?: UUID; // optional outlet override
  name: string;
  description: string;
  sku: string;
  basePrice: number;
  taxIncluded: boolean;
  station: KitchenStation;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  modifierGroups: ModifierGroup[];
  hasRecipe: boolean;
}

export interface MenuCategory {
  id: UUID;
  outletId: UUID;
  name: string;
  iconName: string;
  sortOrder: number;
  items: MenuItem[];
}

// ------------------------------------------
// Order & Cart Models
// ------------------------------------------
export interface SelectedModifier {
  groupId: UUID;
  groupName: string;
  optionId: UUID;
  optionName: string;
  priceDelta: number;
  nestedOptionId?: UUID;
  nestedOptionName?: string;
  nestedPriceDelta?: number;
}

export interface OrderLine {
  id: UUID;
  menuItemId: UUID;
  name: string;
  unitPrice: number;
  quantity: number;
  seatNumber: number;
  selectedModifiers: SelectedModifier[];
  modifiersPrice: number;
  lineTotal: number;
  station: KitchenStation;
  specialInstructions?: string;
  isVoided?: boolean;
  voidReason?: string;
  voidApprovedBy?: string;
  isServed?: boolean;
  addedAt: string;
}

export interface Order {
  id: UUID;
  tenantId: UUID;
  orgId: UUID;
  outletId: UUID;
  tableId?: UUID;
  tableName?: string;
  orderNumber: string; // e.g. "ORD-1042"
  orderType: OrderType;
  status: OrderStatus;
  serverUserId: UUID;
  serverName: string;
  guestCount: number;
  roomNumber?: string;
  guestName?: string;
  guestFolioId?: UUID;
  lines: OrderLine[];
  subtotal: number;
  discountAmount: number;
  discountReason?: string;
  discountPercent?: number;
  taxAmount: number;
  serviceChargeAmount: number;
  cateringLevyAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  completedAt?: string;
}

// ------------------------------------------
// Kitchen Display System (KDS)
// ------------------------------------------
export interface KitchenTicketItem {
  lineId: UUID;
  name: string;
  quantity: number;
  seatNumber: number;
  modifiersSummary: string[];
  specialInstructions?: string;
  isDone: boolean;
}

export interface KitchenTicket {
  id: UUID;
  orderId: UUID;
  orderNumber: string;
  tableName?: string;
  roomNumber?: string;
  orderType: OrderType;
  station: KitchenStation;
  serverName: string;
  status: TicketStatus;
  items: KitchenTicketItem[];
  createdAt: string;
  completedAt?: string;
  priority: 'NORMAL' | 'RUSH' | 'VIP';
  notes?: string;
}

// ------------------------------------------
// Hotel Folio & Rooms
// ------------------------------------------
export interface HotelRoom {
  id: UUID;
  hotelId: UUID;
  roomNumber: string;
  roomType: 'STANDARD' | 'DELUXE' | 'EXECUTIVE_SUITE' | 'PRESIDENTIAL_VILLA';
  floor: number;
  isOccupied: boolean;
  guestName?: string;
  guestFolioId?: UUID;
  creditLimit: number;
  currentBalance: number;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface FolioCharge {
  id: UUID;
  folioId: UUID;
  orderId: UUID;
  outletName: string;
  amount: number;
  description: string;
  postedBy: string;
  postedAt: string;
}

export interface GuestFolio {
  id: UUID;
  roomId: UUID;
  roomNumber: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  creditLimit: number;
  totalCharges: number;
  status: 'OPEN' | 'SETTLED' | 'CLOSED';
  charges: FolioCharge[];
}

// ------------------------------------------
// Inventory & Recipe BOM
// ------------------------------------------
export interface InventoryItem {
  id: UUID;
  hotelId: UUID;
  sku: string;
  name: string;
  category: string;
  unit: UnitOfMeasure;
  currentStock: number;
  minReorderLevel: number;
  unitCost: number;
  supplierName: string;
  lastRestockedAt: string;
}

export interface RecipeIngredient {
  inventoryItemId: UUID;
  inventoryItemName: string;
  quantityRequired: number;
  unit: UnitOfMeasure;
}

export interface Recipe {
  id: UUID;
  menuItemId: UUID;
  menuItemName: string;
  yieldPortions: number;
  ingredients: RecipeIngredient[];
  costPerPortion: number;
}

export interface StockMovement {
  id: UUID;
  hotelId: UUID;
  inventoryItemId: UUID;
  inventoryItemName: string;
  movementType: StockMovementType;
  quantityChange: number;
  previousBalance: number;
  newBalance: number;
  costImpact: number;
  referenceDoc: string; // e.g. "Order #ORD-1042" or "PO-991"
  reason?: string;
  performedBy: string;
  timestamp: string;
}

// ------------------------------------------
// Payments & Shifts
// ------------------------------------------
export interface Payment {
  id: UUID;
  orderId: UUID;
  amount: number;
  tipAmount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNumber: string;
  idempotencyKey: string;
  processedByUserId: UUID;
  processedByName: string;
  processedAt: string;
  cardLastFour?: string;
  roomNumber?: string;
  guestFolioId?: UUID;
  mpesaPhoneNumber?: string;
  mpesaReceiptNumber?: string;
}

export interface Shift {
  id: UUID;
  outletId: UUID;
  cashierUserId: UUID;
  cashierName: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  roomCharges: number;
  mpesaSales: number;
  totalSales: number;
  cashDrops: number;
  expectedCash: number;
  actualCashCount?: number;
  variance?: number;
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string;
  notes?: string;
}

// ------------------------------------------
// Fiscalization (eTIMS / KRA)
// ------------------------------------------
export interface FiscalRecord {
  id: UUID;
  orderId: UUID;
  invoiceNumber: string;
  cuSerialNumber: string;
  cuInvoiceNumber: string;
  fiscalDay: string;
  totalAmount: number;
  taxableAmount: number;
  vatAmount: number;
  cateringLevyAmount: number;
  qrCodeUrl: string;
  fiscalSignature: string;
  createdAt: string;
}

// ------------------------------------------
// Offline Outbox
// ------------------------------------------
export interface OutboxTransaction {
  id: UUID;
  idempotencyKey: string;
  tenantId: UUID;
  outletId: UUID;
  operationType: 'CREATE_ORDER' | 'SETTLE_PAYMENT' | 'VOID_LINE' | 'CONSUME_INVENTORY';
  payload: any;
  createdAt: string;
  syncStatus: SyncStatus;
  retryCount: number;
  errorMessage?: string;
}

// ------------------------------------------
// Audit Logging
// ------------------------------------------
export interface AuditLog {
  id: UUID;
  tenantId: UUID;
  outletId?: UUID;
  actorId: UUID;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: UUID;
  details: string;
  previousState?: any;
  newState?: any;
  timestamp: string;
}

// ------------------------------------------
// SaaS Subscription & Entitlements
// ------------------------------------------
export interface SaaSPlan {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  maxOutlets: number;
  maxRegisters: number;
  hasKDS: boolean;
  hasHotelFolio: boolean;
  hasRecipeBOM: boolean;
  hasFiscalAdapter: boolean;
  hasMultiProperty: boolean;
}
