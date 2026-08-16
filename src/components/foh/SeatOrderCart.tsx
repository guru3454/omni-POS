import React from 'react';
import {
  Trash2,
  Send,
  CreditCard,
  Printer,
  Tag,
  Users,
  AlertTriangle,
  FileText,
  Percent,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { Order, OrderLine, OrderStatus } from '../../types';

interface SeatOrderCartProps {
  order: Order | null;
  onSendToKitchen: () => void;
  onOpenPaymentModal: () => void;
  onOpenDiscountModal: () => void;
  onOpenVoidModal: (lineId: string) => void;
  onPrintBill: () => void;
  onCloseCart: () => void;
}

export const SeatOrderCart: React.FC<SeatOrderCartProps> = ({
  order,
  onSendToKitchen,
  onOpenPaymentModal,
  onOpenDiscountModal,
  onOpenVoidModal,
  onPrintBill,
  onCloseCart,
}) => {
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl border border-slate-200/80 p-6 text-slate-400 text-center shadow-sm">
        <Users className="w-12 h-12 text-slate-300 mb-3" />
        <div className="font-bold text-sm text-slate-700">No Active Order Selected</div>
        <div className="text-xs mt-1 text-slate-400 max-w-[200px]">Select a table or create a quick bar tab / room service order to begin.</div>
      </div>
    );
  }

  // Group lines by seat number
  const seatsMap: Record<number, OrderLine[]> = {};
  order.lines.forEach((line) => {
    const seat = line.seatNumber || 1;
    if (!seatsMap[seat]) seatsMap[seat] = [];
    seatsMap[seat].push(line);
  });

  const seatNumbers = Object.keys(seatsMap)
    .map(Number)
    .sort((a, b) => a - b);

  const isSubmitted =
    order.status === OrderStatus.SUBMITTED ||
    order.status === OrderStatus.PREPARING ||
    order.status === OrderStatus.READY ||
    order.status === OrderStatus.SERVED;

  const isPaid = order.status === OrderStatus.PAID;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-slate-800 shadow-sm select-none">
      {/* Order Header Info */}
      <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-black text-sm text-slate-900 font-mono">{order.orderNumber}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 uppercase">
              {order.tableName ? `Table ${order.tableName}` : order.orderType}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Server: {order.serverName} • Guests: {order.guestCount}
            {order.roomNumber && ` • Room: ${order.roomNumber}`}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
              isPaid
                ? 'bg-emerald-100 text-emerald-800'
                : isSubmitted
                ? 'bg-amber-100 text-amber-900'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Scrollable Seat Items List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {order.lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
            <span>Cart is empty. Select items from the menu.</span>
          </div>
        ) : (
          seatNumbers.map((seatNum) => {
            const linesForSeat = seatsMap[seatNum];
            const seatSubtotal = linesForSeat
              .filter((l) => !l.isVoided)
              .reduce((acc, l) => acc + l.lineTotal, 0);

            return (
              <div key={seatNum} className="bg-slate-50/50 rounded-xl border border-slate-200/80 overflow-hidden">
                {/* Seat Header */}
                <div className="px-3 py-1.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-3 h-3 text-emerald-600" />
                    <span>Seat {seatNum}</span>
                  </div>
                  <span className="font-mono text-slate-900 text-[11px] font-black">${seatSubtotal.toFixed(2)}</span>
                </div>

                {/* Items in Seat */}
                <div className="divide-y divide-slate-100">
                  {linesForSeat.map((line) => (
                    <div
                      key={line.id}
                      className={`p-2.5 text-xs flex flex-col justify-between ${
                        line.isVoided ? 'bg-rose-50/60 opacity-60 line-through' : 'hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <div className="font-bold text-slate-900">
                            {line.quantity}x {line.name}
                          </div>

                          {/* Modifiers summary */}
                          {line.selectedModifiers.length > 0 && (
                            <div className="text-[11px] text-slate-500 space-y-0.5 mt-0.5">
                              {line.selectedModifiers.map((mod, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <span>
                                    + {mod.optionName}
                                    {mod.nestedOptionName && ` (${mod.nestedOptionName})`}
                                  </span>
                                  {mod.priceDelta > 0 && (
                                    <span className="font-mono text-emerald-700 font-semibold">
                                      +${(mod.priceDelta * line.quantity).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {line.specialInstructions && (
                            <div className="text-[10px] text-amber-700 italic mt-0.5">
                              Note: {line.specialInstructions}
                            </div>
                          )}

                          {line.isVoided && (
                            <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                              [VOIDED]: {line.voidReason} (by {line.voidApprovedBy})
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-slate-900 text-xs">
                            ${line.lineTotal.toFixed(2)}
                          </span>

                          {!line.isVoided && !isPaid && (
                            <button
                              onClick={() => onOpenVoidModal(line.id)}
                              title="Void Line Item (Requires Manager PIN)"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Financial Summary Breakdown */}
      <div className="p-3.5 bg-slate-50/80 border-t border-slate-200 text-xs space-y-1.5">
        <div className="flex items-center justify-between text-slate-500">
          <span>Subtotal</span>
          <span className="font-mono font-bold text-slate-800">${order.subtotal.toFixed(2)}</span>
        </div>

        {order.discountAmount > 0 && (
          <div className="flex items-center justify-between text-emerald-700 font-bold">
            <span>Discount ({order.discountPercent || 0}%)</span>
            <span className="font-mono">-${order.discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-500 text-[11px]">
          <span>VAT (16%)</span>
          <span className="font-mono font-medium">${order.taxAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-slate-500 text-[11px]">
          <span>Service Charge (5%)</span>
          <span className="font-mono font-medium">${order.serviceChargeAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between text-slate-500 text-[11px]">
          <span>Catering Levy (2%)</span>
          <span className="font-mono font-medium">${order.cateringLevyAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-black">
          <span className="text-slate-900">TOTAL DUE</span>
          <span className="font-mono text-emerald-700 text-base">${order.totalAmount.toFixed(2)}</span>
        </div>

        {order.paidAmount > 0 && (
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
            <span>Paid Amount</span>
            <span className="font-mono">${order.paidAmount.toFixed(2)}</span>
          </div>
        )}

        {order.balanceAmount > 0 && order.paidAmount > 0 && (
          <div className="flex items-center justify-between text-xs text-amber-700 font-black">
            <span>Remaining Balance</span>
            <span className="font-mono">${order.balanceAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="p-3.5 bg-white border-t border-slate-200 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {!isPaid && (
            <button
              onClick={onOpenDiscountModal}
              className="flex items-center justify-center space-x-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5 text-amber-600" />
              <span>Discount</span>
            </button>
          )}

          <button
            onClick={onPrintBill}
            className="flex items-center justify-center space-x-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Print Bill</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {!isSubmitted && (
            <button
              onClick={onSendToKitchen}
              disabled={order.lines.length === 0}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>FIRE TO KITCHEN (KDS)</span>
            </button>
          )}

          {isSubmitted && !isPaid && (
            <button
              onClick={onOpenPaymentModal}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>SETTLE & SPLIT PAYMENT (${order.balanceAmount.toFixed(2)})</span>
            </button>
          )}

          {isPaid && (
            <div className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ORDER FULLY SETTLED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
