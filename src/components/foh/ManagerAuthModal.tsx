import React, { useState } from 'react';
import { ShieldCheck, X, Delete, AlertCircle, KeyRound } from 'lucide-react';
import { storage } from '../../services/storage';

interface ManagerAuthModalProps {
  title: string;
  subtitle: string;
  requireReason?: boolean;
  onClose: () => void;
  onAuthorized: (managerPin: string, reason?: string) => void;
}

export const ManagerAuthModal: React.FC<ManagerAuthModalProps> = ({
  title,
  subtitle,
  requireReason = false,
  onClose,
  onAuthorized,
}) => {
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('Customer changed mind');
  const [error, setError] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleVerify = () => {
    if (pin.length < 4) {
      setError('Please enter a 4-digit manager PIN');
      return;
    }

    const manager = storage.verifyManagerPin(pin);
    if (!manager) {
      setError('Invalid Manager PIN or insufficient role permissions');
      setPin('');
      return;
    }

    onAuthorized(pin, reason);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">{title}</h2>
              <p className="text-[11px] text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PIN Entry & Reason */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {requireReason && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Reason for Action
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="Customer changed mind">Customer changed mind</option>
                <option value="Incorrect item ordered">Incorrect item ordered</option>
                <option value="Kitchen quality issue">Kitchen quality issue</option>
                <option value="Manager complimentary VIP">Manager complimentary VIP</option>
                <option value="Spill or accidental drop">Spill or accidental drop</option>
              </select>
            </div>
          )}

          {/* PIN Dots Display */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 w-full justify-center">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    pin.length > i ? 'bg-emerald-600 border-emerald-600 shadow-xs scale-110' : 'border-slate-300 bg-white'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Default Manager PIN: 1234 or 9999</span>
          </div>

          {/* Touch Number Pad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 font-black text-base text-slate-900 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 font-black text-base text-slate-900 border border-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center border border-slate-200 transition-all cursor-pointer"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={pin.length < 4}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-all shadow-xs mt-2 cursor-pointer active:scale-95"
          >
            AUTHORIZE ACTION
          </button>
        </div>
      </div>
    </div>
  );
};

