import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Hotel,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Divide,
  User,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { Order, PaymentMethod, Payment } from '../../types';
import { storage, generateUUID } from '../../services/storage';

interface BillSplitPaymentModalProps {
  order: Order;
  onClose: () => void;
  onPaymentComplete: (payment: Payment) => void;
}

type SplitMode = 'FULL' | 'EVEN' | 'SEAT' | 'CUSTOM';

export const BillSplitPaymentModal: React.FC<BillSplitPaymentModalProps> = ({
  order,
  onClose,
  onPaymentComplete,
}) => {
  const state = storage.getState();
  const balanceDue = order.balanceAmount;

  const [splitMode, setSplitMode] = useState<SplitMode>('FULL');
  const [evenSplitCount, setEvenSplitCount] = useState(2);
  const [selectedSeat, setSelectedSeat] = useState(1);
  const [customAmount, setCustomAmount] = useState<string>(balanceDue.toFixed(2));

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CARD);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<string>(balanceDue.toFixed(2));

  // Hotel Room Charge fields
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('101');

  // M-Pesa fields
  const [mpesaPhone, setMpesaPhone] = useState<string>('+254 712 345 678');

  // Card fields
  const [cardLastFour, setCardLastFour] = useState<string>('4242');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Group lines by seat
  const seatTotals: Record<number, number> = {};
  order.lines.forEach((line) => {
    if (!line.isVoided) {
      const s = line.seatNumber || 1;
      seatTotals[s] = (seatTotals[s] || 0) + line.lineTotal;
    }
  });

  // Calculate target payment amount based on split mode
  const getTargetAmount = (): number => {
    if (splitMode === 'FULL') return balanceDue;
    if (splitMode === 'EVEN') return Number((balanceDue / evenSplitCount).toFixed(2));
    if (splitMode === 'SEAT') {
      const seatSub = seatTotals[selectedSeat] || 0;
      // Pro-rate taxes/fees to seat
      const ratio = order.subtotal > 0 ? seatSub / order.subtotal : 1;
      return Number((order.totalAmount * ratio).toFixed(2));
    }
    if (splitMode === 'CUSTOM') {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? 0 : Math.min(balanceDue, parsed);
    }
    return balanceDue;
  };

  const targetAmount = getTargetAmount();
  const tipAmount = Number(((targetAmount * tipPercent) / 100).toFixed(2));
  const grandTotalToCharge = Number((targetAmount + tipAmount).toFixed(2));

  // Cash change calculation
  const cashGiven = parseFloat(cashTendered) || 0;
  const cashChange = Math.max(0, cashGiven - grandTotalToCharge);

  // Room charge verification
  const occupiedRooms = state.rooms.filter((r) => r.isOccupied);
  const selectedRoom = state.rooms.find((r) => r.roomNumber === selectedRoomNumber);
  const guestFolio = state.folios.find((f) => f.roomId === selectedRoom?.id);

  const handleProcessPayment = () => {
    setErrorMessage(null);
    if (targetAmount <= 0) {
      setErrorMessage('Payment amount must be greater than $0.00');
      return;
    }

    setIsProcessing(true);

    try {
      const idempotencyKey = generateUUID();
      const meta: any = {};

      if (paymentMethod === PaymentMethod.CARD) {
        meta.cardLastFour = cardLastFour;
      } else if (paymentMethod === PaymentMethod.ROOM_CHARGE) {
        if (!selectedRoom || !guestFolio) {
          throw new Error('Please select an occupied room with an open guest folio');
        }
        meta.roomNumber = selectedRoom.roomNumber;
        meta.guestFolioId = guestFolio.id;
      } else if (paymentMethod === PaymentMethod.MPESA) {
        meta.mpesaPhoneNumber = mpesaPhone;
        meta.mpesaReceiptNumber = `QA${Math.floor(10000000 + Math.random() * 90000000)}`;
      }

      const { payment } = storage.processPayment(
        order.id,
        targetAmount,
        tipAmount,
        paymentMethod,
        idempotencyKey,
        meta
      );

      setIsProcessing(false);
      onPaymentComplete(payment);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment processing failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900">Settle Order {order.orderNumber}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                Balance: ${balanceDue.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {order.tableName ? `Table ${order.tableName}` : order.orderType} • Total Bill: ${order.totalAmount.toFixed(2)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Splitting Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              1. Bill Splitting Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'FULL', label: 'Entire Bill' },
                { id: 'EVEN', label: 'Split Evenly' },
                { id: 'SEAT', label: 'By Seat' },
                { id: 'CUSTOM', label: 'Custom' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSplitMode(mode.id as SplitMode)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    splitMode === mode.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Split Evenly Options */}
            {splitMode === 'EVEN' && (
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-2">
                <span className="text-xs text-slate-700 font-bold">Split between:</span>
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setEvenSplitCount(num)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs cursor-pointer ${
                      evenSplitCount === num ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
                <span className="text-xs font-mono font-bold text-emerald-700 ml-auto">
                  ${(balanceDue / evenSplitCount).toFixed(2)} each
                </span>
              </div>
            )}

            {/* Split by Seat Options */}
            {splitMode === 'SEAT' && (
              <div className="flex items-center space-x-2 overflow-x-auto bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-2">
                {Object.keys(seatTotals).map((seat) => {
                  const sNum = Number(seat);
                  const isSelected = selectedSeat === sNum;
                  return (
                    <button
                      key={sNum}
                      onClick={() => setSelectedSeat(sNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                        isSelected ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      Seat {sNum} (${seatTotals[sNum].toFixed(2)})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom Amount Input */}
            {splitMode === 'CUSTOM' && (
              <div className="mt-2">
                <input
                  type="number"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* 2. Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Select Payment Tender
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: PaymentMethod.CARD, label: 'Credit / Debit Card', icon: CreditCard },
                { id: PaymentMethod.CASH, label: 'Cash Payment', icon: Banknote },
                { id: PaymentMethod.ROOM_CHARGE, label: 'Post to Room Folio', icon: Hotel },
                { id: PaymentMethod.MPESA, label: 'M-Pesa / Mobile', icon: Smartphone },
              ].map((tender) => {
                const Icon = tender.icon;
                const isSelected = paymentMethod === tender.id;
                return (
                  <button
                    key={tender.id}
                    type="button"
                    onClick={() => setPaymentMethod(tender.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold space-y-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-center">{tender.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Tender-Specific Details */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
            {paymentMethod === PaymentMethod.CASH && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Cash Received ($)</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    Change: ${cashChange.toFixed(2)}
                  </span>
                </div>
                <input
                  type="number"
                  step="1"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex items-center space-x-2 pt-1">
                  {[20, 50, 100, 200].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt.toString())}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 cursor-pointer"
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotalToCharge.toFixed(2))}
                    className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 rounded-lg text-xs font-bold ml-auto cursor-pointer"
                  >
                    Exact (${grandTotalToCharge.toFixed(2)})
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === PaymentMethod.CARD && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Card Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1 font-bold">Terminal Status</label>
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                    ✓ EMV Terminal Connected
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === PaymentMethod.ROOM_CHARGE && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Select Occupied Guest Room</label>
                <select
                  value={selectedRoomNumber}
                  onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  {occupiedRooms.map((r) => (
                    <option key={r.id} value={r.roomNumber}>
                      Room {r.roomNumber} - {r.guestName} (Limit: ${r.creditLimit.toFixed(2)} | Balance: $
                      {r.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>

                {selectedRoom && guestFolio && (
                  <div className="text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-slate-700 shadow-2xs">
                    <div>
                      <span className="font-bold text-emerald-800">{guestFolio.guestName}</span>
                      <span className="text-slate-400"> (Folio #{guestFolio.id.slice(-6)})</span>
                    </div>
                    <div className="font-mono font-bold">
                      Available Credit: ${(guestFolio.creditLimit - guestFolio.totalCharges).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === PaymentMethod.MPESA && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Customer M-Pesa Phone Number</label>
                <input
                  type="text"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <div className="text-[11px] text-emerald-700 font-bold">
                  Instant STK Push prompt will be dispatched to customer phone.
                </div>
              </div>
            )}
          </div>

          {/* 4. Gratuity / Tip Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Gratuity / Staff Tip</span>
              <span className="font-mono text-emerald-700 font-bold">${tipAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center space-x-2">
              {[0, 10, 15, 18, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTipPercent(pct)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tipPercent === pct
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {pct === 0 ? 'No Tip' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Settlement Button */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Amount to Charge</div>
            <div className="text-2xl font-black text-slate-900 font-mono">${grandTotalToCharge.toFixed(2)}</div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl shadow-xs transition-all text-xs flex items-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'AUTHORIZING...' : `PROCESS & SIGN ($${grandTotalToCharge.toFixed(2)})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
