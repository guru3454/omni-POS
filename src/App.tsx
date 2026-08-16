import React, { useState, useEffect } from 'react';
import { HeaderNav, AppViewMode } from './components/common/HeaderNav';
import { WorkspaceTopBar } from './components/common/WorkspaceTopBar';
import { FloorPlanView } from './components/foh/FloorPlanView';
import { MenuCatalog } from './components/foh/MenuCatalog';
import { SeatOrderCart } from './components/foh/SeatOrderCart';
import { NestedModifierModal } from './components/foh/NestedModifierModal';
import { BillSplitPaymentModal } from './components/foh/BillSplitPaymentModal';
import { ManagerAuthModal } from './components/foh/ManagerAuthModal';
import { ShiftControlModal } from './components/foh/ShiftControlModal';
import { TableTransferModal } from './components/foh/TableTransferModal';
import { ReceiptPreviewModal } from './components/common/ReceiptPreviewModal';
import { KDSBoard } from './components/kds/KDSBoard';
import { HotelRoomsFolio } from './components/hotel/HotelRoomsFolio';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { AdminAnalyticsDashboard } from './components/admin/AdminAnalyticsDashboard';
import { TestSuiteModal } from './components/tests/TestSuiteModal';

import { storage } from './services/storage';
import { HardwareService } from './services/hardware';
import { Table, Order, MenuItem, SelectedModifier, OrderType, TableStatus, Payment } from './types';
import { ArrowLeft, Plus } from 'lucide-react';

export function App() {
  const [, setTick] = useState(0);

  // Subscribe to storage changes for reactive re-renders
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const [currentMode, setCurrentMode] = useState<AppViewMode>('FOH');
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Modals state
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [transferSourceTable, setTransferSourceTable] = useState<Table | null>(null);

  // Manager Auth PIN modal state
  const [managerAuthAction, setManagerAuthAction] = useState<{
    type: 'VOID_ITEM' | 'DISCOUNT' | 'SWITCH_USER';
    lineId?: string;
    title: string;
    subtitle: string;
  } | null>(null);

  // Thermal Receipt modal state
  const [receiptModalContent, setReceiptModalContent] = useState<{
    text: string;
    qrUrl?: string;
  } | null>(null);

  const state = storage.getState();
  const currentOrder = activeOrderId ? state.orders.find((o) => o.id === activeOrderId) || null : null;

  // Handle Table Selection in Floor Plan
  const handleSelectTable = (table: Table) => {
    setActiveTable(table);

    // If table already has an active order, load it
    if (table.currentOrderId) {
      setActiveOrderId(table.currentOrderId);
    } else {
      // Create new order for table
      const newOrder = storage.createOrder(table.id, OrderType.DINE_IN, table.capacity);
      setActiveOrderId(newOrder.id);
    }
  };

  // Handle Direct Quick Order (Bar Tab, Room Service, Takeaway)
  const handleOpenQuickOrder = (orderType: OrderType) => {
    setActiveTable(null);
    let roomNumber: string | undefined;
    let guestName: string | undefined;
    let guestFolioId: string | undefined;

    if (orderType === OrderType.ROOM_SERVICE) {
      roomNumber = '101';
      guestName = 'David Kim';
      const folio = state.folios.find((f) => f.roomNumber === '101');
      guestFolioId = folio?.id;
    }

    const newOrder = storage.createOrder(undefined, orderType, 1, roomNumber, guestName, guestFolioId);
    setActiveOrderId(newOrder.id);
  };

  // Handle Menu Item Clicked
  const handleSelectMenuItem = (item: MenuItem) => {
    if (!currentOrder) return;

    if (item.modifierGroups.length > 0) {
      setSelectedMenuItem(item);
    } else {
      // Add directly without modifiers
      storage.addLineToOrder(currentOrder.id, {
        menuItemId: item.id,
        name: item.name,
        unitPrice: item.basePrice,
        quantity: 1,
        seatNumber: 1,
        selectedModifiers: [],
        modifiersPrice: 0,
        lineTotal: item.basePrice,
        station: item.station,
      });
    }
  };

  // Handle Add to Order with 4-Level Nested Modifiers
  const handleAddToCartWithModifiers = (
    selectedModifiers: SelectedModifier[],
    quantity: number,
    seatNumber: number,
    specialInstructions?: string,
    modifiersPrice: number = 0
  ) => {
    if (!currentOrder || !selectedMenuItem) return;

    const unitPrice = selectedMenuItem.basePrice;
    const lineTotal = (unitPrice + modifiersPrice / quantity) * quantity;

    storage.addLineToOrder(currentOrder.id, {
      menuItemId: selectedMenuItem.id,
      name: selectedMenuItem.name,
      unitPrice,
      quantity,
      seatNumber,
      selectedModifiers,
      modifiersPrice,
      lineTotal,
      station: selectedMenuItem.station,
      specialInstructions,
    });

    setSelectedMenuItem(null);
  };

  // Handle Send to Kitchen (KDS Fire)
  const handleSendToKitchen = () => {
    if (!currentOrder) return;
    try {
      storage.submitOrderToKitchen(currentOrder.id);
      alert(`Order ${currentOrder.orderNumber} fired to kitchen KDS stations and recipe BOM inventory deducted.`);
    } catch (err: any) {
      alert(`Error submitting order: ${err.message}`);
    }
  };

  // Handle Print Bill Preview
  const handlePrintBill = () => {
    if (!currentOrder) return;
    const text = HardwareService.generateReceiptText({
      order: currentOrder,
      organization: state.organization,
      hotel: state.hotel,
      outlet: storage.getCurrentOutlet(),
      cashierName: state.currentUser.name,
    });
    setReceiptModalContent({ text });
  };

  // Handle Void Item with Manager PIN
  const handleOpenVoidModal = (lineId: string) => {
    setManagerAuthAction({
      type: 'VOID_ITEM',
      lineId,
      title: 'Authorize Line Item Void',
      subtitle: 'Manager override required to void ordered items',
    });
  };

  // Handle Discount with Manager PIN
  const handleOpenDiscountModal = () => {
    setManagerAuthAction({
      type: 'DISCOUNT',
      title: 'Authorize Order Discount',
      subtitle: 'Manager override required to apply 10% VIP discount',
    });
  };

  const handleManagerAuthorized = (managerPin: string, reason?: string) => {
    if (!managerAuthAction || !currentOrder) return;

    if (managerAuthAction.type === 'VOID_ITEM' && managerAuthAction.lineId) {
      try {
        storage.voidOrderLine(currentOrder.id, managerAuthAction.lineId, reason || 'Customer requested', managerPin);
      } catch (err: any) {
        alert(err.message);
      }
    } else if (managerAuthAction.type === 'DISCOUNT') {
      try {
        storage.applyOrderDiscount(currentOrder.id, 10, reason || 'Manager VIP Courtesy', managerPin);
      } catch (err: any) {
        alert(err.message);
      }
    }

    setManagerAuthAction(null);
  };

  // Handle Payment Complete
  const handlePaymentComplete = (payment: Payment) => {
    setIsPaymentModalOpen(false);
    if (currentOrder) {
      const refreshedOrder = storage.getState().orders.find((o) => o.id === currentOrder.id);
      if (refreshedOrder) {
        const text = HardwareService.generateReceiptText({
          order: refreshedOrder,
          organization: state.organization,
          hotel: state.hotel,
          outlet: storage.getCurrentOutlet(),
          cashierName: state.currentUser.name,
        });
        setReceiptModalContent({ text });
      }
    }
  };

  const handleWorkspacePrimaryAction = () => {
    if (currentMode === 'FOH') {
      handleOpenQuickOrder(OrderType.BAR_TAB);
    } else if (currentMode === 'TESTS') {
      // triggers test rerun inside test suite
    } else if (currentMode === 'ADMIN') {
      alert('Generating eTIMS fiscal audit export CSV...');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0b0f0d] text-slate-900 overflow-hidden font-sans select-none">
      {/* Dark Modern Sidebar Navigation */}
      <HeaderNav
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
        onOpenPinModal={() => {}}
        onOpenTestModal={() => setCurrentMode('TESTS')}
      />

      {/* Main Light Workspace Container */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">
        {/* Workspace Top Bar Header */}
        <WorkspaceTopBar
          currentMode={currentMode}
          onPrimaryAction={currentMode === 'FOH' ? handleWorkspacePrimaryAction : undefined}
          primaryActionLabel={currentMode === 'FOH' ? '+ Quick Bar Tab' : undefined}
        />

        {/* Main App Viewport */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {/* VIEW 1: FRONT-OF-HOUSE POS REGISTER */}
          {currentMode === 'FOH' && (
            <div className="h-full flex flex-col">
              {/* If no order is active, show Floor Plan */}
              {!activeOrderId ? (
                <FloorPlanView
                  onSelectTable={handleSelectTable}
                  onOpenQuickOrder={handleOpenQuickOrder}
                  onOpenTransferModal={(table) => setTransferSourceTable(table)}
                />
              ) : (
                /* Active Order Workspace: Left = Menu Catalog, Right = Seat Order Cart */
                <div className="flex flex-col h-full">
                  {/* Back to Floorplan bar */}
                  <div className="bg-white px-5 py-2.5 border-b border-slate-200 flex items-center justify-between shadow-2xs">
                    <button
                      onClick={() => {
                        setActiveOrderId(null);
                        setActiveTable(null);
                      }}
                      className="flex items-center space-x-2 text-xs text-emerald-800 hover:text-emerald-700 font-bold transition-all cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 active:scale-95"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>← Back to Floorplan / Tables</span>
                    </button>

                    <div className="text-xs text-slate-700 font-bold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                      {currentOrder?.tableName ? `Active Table ${currentOrder.tableName}` : currentOrder?.orderType} • Server: {currentOrder?.serverName}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col lg:flex-row p-3 gap-3 overflow-hidden">
                    {/* Left: Menu Catalog */}
                    <div className="flex-1 h-full overflow-hidden">
                      <MenuCatalog onSelectItem={handleSelectMenuItem} />
                    </div>

                    {/* Right: Seat Order Cart */}
                    <div className="w-full lg:w-96 h-full overflow-hidden">
                      <SeatOrderCart
                        order={currentOrder}
                        onSendToKitchen={handleSendToKitchen}
                        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
                        onOpenDiscountModal={handleOpenDiscountModal}
                        onOpenVoidModal={handleOpenVoidModal}
                        onPrintBill={handlePrintBill}
                        onCloseCart={() => {
                          setActiveOrderId(null);
                          setActiveTable(null);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: KITCHEN DISPLAY SYSTEM (KDS) */}
          {currentMode === 'KDS' && (
            <KDSBoard onPrintDocket={(docketText) => setReceiptModalContent({ text: docketText })} />
          )}

          {/* VIEW 3: HOTEL ROOMS & GUEST FOLIO */}
          {currentMode === 'HOTEL' && <HotelRoomsFolio />}

          {/* VIEW 4: INVENTORY & RECIPES BOM */}
          {currentMode === 'INVENTORY' && <InventoryManagement />}

          {/* VIEW 5: ADMIN ANALYTICS & AUDIT TRAIL */}
          {currentMode === 'ADMIN' && <AdminAnalyticsDashboard />}

          {/* VIEW 6: AUTOMATED TEST SUITE RUNNER */}
          {currentMode === 'TESTS' && <TestSuiteModal />}
        </main>
      </div>

      {/* 4-Level Nested Modifiers Modal */}
      {selectedMenuItem && (
        <NestedModifierModal
          item={selectedMenuItem}
          seatNumber={1}
          onClose={() => setSelectedMenuItem(null)}
          onAddToCart={handleAddToCartWithModifiers}
        />
      )}

      {/* Bill Splitting & Multi-Tender Payment Modal */}
      {isPaymentModalOpen && currentOrder && (
        <BillSplitPaymentModal
          order={currentOrder}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Manager Authorization PIN Keypad Modal */}
      {managerAuthAction && (
        <ManagerAuthModal
          title={managerAuthAction.title}
          subtitle={managerAuthAction.subtitle}
          requireReason={managerAuthAction.type === 'VOID_ITEM'}
          onClose={() => setManagerAuthAction(null)}
          onAuthorized={handleManagerAuthorized}
        />
      )}

      {/* Shift Reconciliation & X/Z Report Modal */}
      {isShiftModalOpen && (
        <ShiftControlModal
          onClose={() => setIsShiftModalOpen(false)}
          onPrintReport={(reportText) => setReceiptModalContent({ text: reportText })}
        />
      )}

      {/* Table Transfer Modal */}
      {transferSourceTable && (
        <TableTransferModal
          sourceTable={transferSourceTable}
          onClose={() => setTransferSourceTable(null)}
          onSuccess={() => {
            setTransferSourceTable(null);
            alert('Table successfully transferred.');
          }}
        />
      )}

      {/* ESC/POS Thermal Receipt Preview Modal */}
      {receiptModalContent && (
        <ReceiptPreviewModal
          receiptText={receiptModalContent.text}
          qrCodeUrl={receiptModalContent.qrUrl}
          onClose={() => setReceiptModalContent(null)}
        />
      )}
    </div>
  );
}
export default App;

