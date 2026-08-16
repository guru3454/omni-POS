import React, { useState } from 'react';
import {
  Users,
  Clock,
  ArrowRightLeft,
  PlusCircle,
  Sparkles,
  ShoppingBag,
  Hotel as HotelIcon,
  CheckCircle,
  AlertCircle,
  Coffee,
  DollarSign,
  Layers,
  Utensils,
} from 'lucide-react';
import { Table, TableStatus, OrderType, Order } from '../../types';
import { storage } from '../../services/storage';

interface FloorPlanViewProps {
  onSelectTable: (table: Table) => void;
  onOpenQuickOrder: (orderType: OrderType) => void;
  onOpenTransferModal: (sourceTable: Table) => void;
}

export const FloorPlanView: React.FC<FloorPlanViewProps> = ({
  onSelectTable,
  onOpenQuickOrder,
  onOpenTransferModal,
}) => {
  const state = storage.getState();
  const currentOutlet = storage.getCurrentOutlet();
  const outletFloors = state.floors.filter((f) => f.outletId === currentOutlet.id);
  const [selectedFloorId, setSelectedFloorId] = useState<string>(outletFloors[0]?.id || '');

  const activeFloor = outletFloors.find((f) => f.id === selectedFloorId) || outletFloors[0];
  const floorTables = state.tables.filter((t) => (activeFloor ? t.floorId === activeFloor.id : t.outletId === currentOutlet.id));

  // Quick stats
  const totalTables = floorTables.length;
  const occupiedTables = floorTables.filter((t) => t.status !== TableStatus.VACANT && t.status !== TableStatus.DIRTY).length;
  const vacantTables = floorTables.filter((t) => t.status === TableStatus.VACANT).length;
  const activeRevenue = state.orders
    .filter((o) => o.outletId === currentOutlet.id && o.status !== 'PAID' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case TableStatus.VACANT:
        return { label: 'VACANT', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
      case TableStatus.OCCUPIED:
        return { label: 'OCCUPIED', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
      case TableStatus.ORDERED:
        return { label: 'ORDERED', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' };
      case TableStatus.FOOD_PREPARING:
        return { label: 'COOKING', bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500 animate-pulse' };
      case TableStatus.CHECK_REQUESTED:
      case TableStatus.CHECK_PRINTED:
        return { label: 'BILL PRINTED', bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' };
      case TableStatus.PAYMENT_PENDING:
      case TableStatus.PAID:
        return { label: 'SETTLED', bg: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' };
      case TableStatus.DIRTY:
        return { label: 'NEEDS CLEANING', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
    }
  };

  const handleQuickStatusChange = (e: React.MouseEvent, table: Table, newStatus: TableStatus) => {
    e.stopPropagation();
    storage.updateTableStatus(table.id, newStatus);
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7F5] text-slate-800 p-4 space-y-3 overflow-hidden select-none">
      {/* Top Bar: Floor Selection + Quick Non-Table Order Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Floor Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {outletFloors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setSelectedFloorId(floor.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                activeFloor?.id === floor.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {floor.name}
            </button>
          ))}
        </div>

        {/* Quick Order Actions (Bar Tab, Room Service, Takeaway) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenQuickOrder(OrderType.BAR_TAB)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Coffee className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Quick Bar Tab</span>
          </button>

          <button
            onClick={() => onOpenQuickOrder(OrderType.ROOM_SERVICE)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <HotelIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Room Service</span>
          </button>

          <button
            onClick={() => onOpenQuickOrder(OrderType.TAKEAWAY)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>+ Takeaway</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-2.5 px-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold">Total Floor Tables</span>
          <span className="text-sm font-black text-slate-900 font-mono">{totalTables} Tables</span>
        </div>
        <div className="bg-white p-2.5 px-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold">Seated / Active</span>
          <span className="text-sm font-black text-blue-600 font-mono">{occupiedTables} Seated</span>
        </div>
        <div className="bg-white p-2.5 px-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold">Available Vacant</span>
          <span className="text-sm font-black text-emerald-600 font-mono">{vacantTables} Ready</span>
        </div>
        <div className="bg-white p-2.5 px-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500 font-semibold">Live Floor Revenue</span>
          <span className="text-sm font-black text-emerald-700 font-mono">${activeRevenue.toFixed(2)}</span>
        </div>
      </div>

      {/* Interactive Floor Grid / Canvas */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-5 overflow-auto shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {floorTables.map((table) => {
            const activeOrder = state.orders.find((o) => o.id === table.currentOrderId);
            const isVacant = table.status === TableStatus.VACANT;
            const isDirty = table.status === TableStatus.DIRTY;
            const badge = getStatusBadge(table.status);

            return (
              <div
                key={table.id}
                onClick={() => onSelectTable(table)}
                className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md min-h-[145px] group ${
                  isVacant
                    ? 'bg-slate-50/70 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20'
                    : isDirty
                    ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                    : 'bg-white border-slate-300/80 hover:border-emerald-500 shadow-sm'
                }`}
              >
                {/* Header: Table Number & Status Tag */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-black tracking-tight text-slate-900 flex items-center space-x-1.5">
                      <span>{table.number}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span className="text-[10px] font-bold tracking-wider text-slate-500">
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{table.capacity}p</span>
                  </div>
                </div>

                {/* Body Details: Active Order Total or Waiter */}
                <div className="my-2">
                  {activeOrder ? (
                    <div className="space-y-0.5">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        ${activeOrder.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate font-medium">
                        {activeOrder.orderNumber} • {activeOrder.lines.length} items
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Server: {table.assignedWaiterName || 'Staff'}
                      </div>
                    </div>
                  ) : isDirty ? (
                    <div className="text-xs text-rose-700 font-semibold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Needs Bussing</span>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Ready for Seating</span>
                    </div>
                  )}
                </div>

                {/* Footer Quick Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  {isDirty ? (
                    <button
                      onClick={(e) => handleQuickStatusChange(e, table, TableStatus.VACANT)}
                      className="w-full py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold transition-colors flex items-center justify-center space-x-1 shadow-xs"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Mark Cleaned</span>
                    </button>
                  ) : isVacant ? (
                    <span className="text-[11px] text-emerald-700 font-bold group-hover:text-emerald-800">
                      Open Order →
                    </span>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTransferModal(table);
                        }}
                        title="Transfer table"
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs text-emerald-600 group-hover:text-emerald-700">
                        View Bill →
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
