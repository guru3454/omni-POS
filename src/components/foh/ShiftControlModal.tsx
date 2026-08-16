import React, { useState } from 'react';
import { X, DollarSign, Printer, Lock, CheckCircle2, AlertCircle, FileText, ArrowDownCircle } from 'lucide-react';
import { Shift, ShiftStatus } from '../../types';
import { storage } from '../../services/storage';

interface ShiftControlModalProps {
  onClose: () => void;
  onPrintReport: (reportText: string) => void;
}

export const ShiftControlModal: React.FC<ShiftControlModalProps> = ({ onClose, onPrintReport }) => {
  const state = storage.getState();
  const currentOutlet = storage.getCurrentOutlet();
  const activeShift = storage.getActiveShift();

  const [openingFloat, setOpeningFloat] = useState('300.00');
  const [actualCashCount, setActualCashCount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenShift = () => {
    setErrorMessage(null);
    const floatNum = parseFloat(openingFloat);
    if (isNaN(floatNum) || floatNum < 0) {
      setErrorMessage('Please enter a valid opening float amount');
      return;
    }

    try {
      storage.openShift(floatNum);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleCloseShift = () => {
    setErrorMessage(null);
    const cashNum = parseFloat(actualCashCount);
    if (isNaN(cashNum) || cashNum < 0) {
      setErrorMessage('Please count and enter the actual cash in drawer');
      return;
    }

    try {
      const closedShift = storage.closeShift(cashNum, closeNotes);
      handlePrintZReport(closedShift);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handlePrintXReport = () => {
    if (!activeShift) return;
    const text = [
      '==========================================',
      `          X-REPORT (MID-DAY INQUIRY)      `,
      `          ${state.hotel.name.toUpperCase()}       `,
      `          ${currentOutlet.name}           `,
      '==========================================',
      `Date: ${new Date().toLocaleString()}`,
      `Cashier: ${activeShift.cashierName}`,
      `Shift ID: ${activeShift.id.slice(-8)}`,
      `Opened At: ${new Date(activeShift.openedAt).toLocaleTimeString()}`,
      '------------------------------------------',
      `OPENING FLOAT:                 $${activeShift.openingFloat.toFixed(2).padStart(10)}`,
      `CASH SALES:                    $${activeShift.cashSales.toFixed(2).padStart(10)}`,
      `CREDIT/DEBIT CARD SALES:       $${activeShift.cardSales.toFixed(2).padStart(10)}`,
      `ROOM CHARGES (FOLIO):          $${activeShift.roomCharges.toFixed(2).padStart(10)}`,
      `M-PESA / MOBILE MONEY:         $${activeShift.mpesaSales.toFixed(2).padStart(10)}`,
      '------------------------------------------',
      `TOTAL GROSS SALES:             $${activeShift.totalSales.toFixed(2).padStart(10)}`,
      `EXPECTED DRAWER CASH:          $${activeShift.expectedCash.toFixed(2).padStart(10)}`,
      '==========================================',
      `STATUS: SHIFT CURRENTLY ACTIVE`,
      '==========================================',
    ].join('\n');

    onPrintReport(text);
  };

  const handlePrintZReport = (shift: Shift) => {
    const text = [
      '==========================================',
      `         Z-REPORT (END OF SHIFT CLOSING)  `,
      `          ${state.hotel.name.toUpperCase()}       `,
      `          ${currentOutlet.name}           `,
      '==========================================',
      `Date: ${new Date().toLocaleString()}`,
      `Cashier: ${shift.cashierName}`,
      `Shift ID: ${shift.id.slice(-8)}`,
      `Opened: ${new Date(shift.openedAt).toLocaleTimeString()}`,
      `Closed: ${new Date(shift.closedAt || new Date()).toLocaleTimeString()}`,
      '------------------------------------------',
      `OPENING FLOAT:                 $${shift.openingFloat.toFixed(2).padStart(10)}`,
      `CASH SALES:                    $${shift.cashSales.toFixed(2).padStart(10)}`,
      `CARD SALES:                    $${shift.cardSales.toFixed(2).padStart(10)}`,
      `ROOM CHARGES:                  $${shift.roomCharges.toFixed(2).padStart(10)}`,
      `M-PESA SALES:                  $${shift.mpesaSales.toFixed(2).padStart(10)}`,
      '------------------------------------------',
      `TOTAL GROSS SALES:             $${shift.totalSales.toFixed(2).padStart(10)}`,
      `EXPECTED CASH:                 $${shift.expectedCash.toFixed(2).padStart(10)}`,
      `ACTUAL CASH COUNT:             $${(shift.actualCashCount || 0).toFixed(2).padStart(10)}`,
      `VARIANCE (OVER/SHORT):         $${(shift.variance || 0).toFixed(2).padStart(10)}`,
      '==========================================',
      `FISCAL SHIFT COMMITTED & CLOSED`,
      `NOTES: ${shift.notes || 'None'}`,
      '==========================================',
    ].join('\n');

    onPrintReport(text);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Cashier Shift & Reconciliation</h2>
              <p className="text-xs text-slate-500">{currentOutlet.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeShift ? (
            <div className="space-y-4">
              {/* Active Shift Metrics */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-600">Active Cashier:</span>
                  <span className="font-black text-slate-900">{activeShift.cashierName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-slate-600">
                  <div>
                    <span className="text-slate-500 font-bold">Opening Float:</span>
                    <div className="font-mono font-black text-slate-900">${activeShift.openingFloat.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">Cash Sales:</span>
                    <div className="font-mono font-black text-emerald-700">${activeShift.cashSales.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">Card Sales:</span>
                    <div className="font-mono font-black text-blue-700">${activeShift.cardSales.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">Room Folio Charges:</span>
                    <div className="font-mono font-black text-purple-700">${activeShift.roomCharges.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">M-Pesa Sales:</span>
                    <div className="font-mono font-black text-teal-700">${activeShift.mpesaSales.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">Total Gross:</span>
                    <div className="font-mono font-black text-slate-900">${activeShift.totalSales.toFixed(2)}</div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
                  <span className="text-slate-700">Expected Cash in Drawer:</span>
                  <span className="font-mono text-emerald-800 text-base font-black">${activeShift.expectedCash.toFixed(2)}</span>
                </div>
              </div>

              {/* Action: Print X-Report */}
              <button
                type="button"
                onClick={handlePrintXReport}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>PRINT X-REPORT (MID-DAY INQUIRY)</span>
              </button>

              {/* Close Shift Form */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-black text-slate-900">End Shift & Z-Report Reconcile</div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Actual Physical Cash Counted ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 750.00"
                    value={actualCashCount}
                    onChange={(e) => setActualCashCount(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Closing Notes / Discrepancy Reason
                  </label>
                  <input
                    type="text"
                    placeholder="Optional notes for shift ledger..."
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCloseShift}
                  disabled={!actualCashCount}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  <span>CLOSE SHIFT & ISSUE Z-REPORT</span>
                </button>
              </div>
            </div>
          ) : (
            /* Open New Shift Form */
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                No active cashier shift found for {currentOutlet.name}. Please enter the opening float amount to open the register.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Opening Cash Float ($)
                </label>
                <input
                  type="number"
                  step="1"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenShift}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>OPEN CASHIER DRAWER SHIFT</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

