import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Table, TableStatus } from '../../types';
import { storage } from '../../services/storage';

interface TableTransferModalProps {
  sourceTable: Table;
  onClose: () => void;
  onSuccess: () => void;
}

export const TableTransferModal: React.FC<TableTransferModalProps> = ({
  sourceTable,
  onClose,
  onSuccess,
}) => {
  const state = storage.getState();
  const currentOutlet = storage.getCurrentOutlet();
  const vacantTables = state.tables.filter(
    (t) => t.outletId === currentOutlet.id && t.id !== sourceTable.id && t.status === TableStatus.VACANT
  );

  const [targetTableId, setTargetTableId] = useState<string>(vacantTables[0]?.id || '');
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = () => {
    setError(null);
    if (!targetTableId) {
      setError('Please select a destination table');
      return;
    }

    try {
      storage.transferTable(sourceTable.id, targetTableId);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Transfer Table {sourceTable.number}</h3>
              <p className="text-[11px] text-slate-500">Relocate active guest order</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Select Vacant Destination Table
          </label>
          {vacantTables.length === 0 ? (
            <div className="text-xs text-rose-700 font-bold p-3 bg-rose-50 rounded-2xl border border-rose-200">
              No vacant tables available in this floor zone.
            </div>
          ) : (
            <select
              value={targetTableId}
              onChange={(e) => setTargetTableId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              {vacantTables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table {t.number} ({t.capacity} Guests - {t.shape})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={vacantTables.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs shadow-xs transition-all cursor-pointer active:scale-95"
          >
            Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
};

