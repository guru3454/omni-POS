import React, { useState } from 'react';
import {
  Hotel,
  User,
  CreditCard,
  PlusCircle,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Search,
  X,
} from 'lucide-react';
import { HotelRoom, GuestFolio, FolioCharge } from '../../types';
import { storage, generateUUID } from '../../services/storage';

export const HotelRoomsFolio: React.FC = () => {
  const state = storage.getState();
  const rooms = state.rooms;
  const folios = state.folios;

  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>(rooms[0]?.roomNumber || '101');
  const [searchQuery, setSearchQuery] = useState('');

  // New charge manual modal
  const [isPostChargeOpen, setIsPostChargeOpen] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('50.00');
  const [chargeDescription, setChargeDescription] = useState('Room Service Late Snack');
  const [postError, setPostError] = useState<string | null>(null);

  const selectedRoom = rooms.find((r) => r.roomNumber === selectedRoomNumber) || rooms[0];
  const selectedFolio = folios.find((f) => f.roomId === selectedRoom?.id);

  const filteredRooms = rooms.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.roomNumber.toLowerCase().includes(q) ||
      (r.guestName && r.guestName.toLowerCase().includes(q)) ||
      r.roomType.toLowerCase().includes(q)
    );
  });

  const handlePostManualCharge = () => {
    setPostError(null);
    const amt = parseFloat(chargeAmount);
    if (isNaN(amt) || amt <= 0) {
      setPostError('Please enter a valid charge amount');
      return;
    }

    if (!selectedFolio) {
      setPostError('No active folio found for this room');
      return;
    }

    if (selectedFolio.totalCharges + amt > selectedFolio.creditLimit) {
      setPostError(
        `Charge exceeds guest credit limit of $${selectedFolio.creditLimit.toFixed(2)} (Current: $${selectedFolio.totalCharges.toFixed(2)})`
      );
      return;
    }

    const newCharge: FolioCharge = {
      id: generateUUID(),
      folioId: selectedFolio.id,
      orderId: generateUUID(),
      outletName: 'Hotel Concierge & Incidentals',
      amount: amt,
      description: chargeDescription,
      postedBy: state.currentUser.name,
      postedAt: new Date().toISOString(),
    };

    selectedFolio.charges.push(newCharge);
    selectedFolio.totalCharges = Number((selectedFolio.totalCharges + amt).toFixed(2));
    if (selectedRoom) {
      selectedRoom.currentBalance = selectedFolio.totalCharges;
    }

    storage.addAuditLog(
      'MANUAL_FOLIO_CHARGE',
      'GuestFolio',
      selectedFolio.id,
      `Posted manual charge of $${amt.toFixed(2)} to Room ${selectedRoom.roomNumber} (${selectedFolio.guestName}): ${chargeDescription}`
    );

    setIsPostChargeOpen(false);
    setChargeAmount('50.00');
  };

  const creditUsagePercent = selectedFolio
    ? Math.min(100, Math.round((selectedFolio.totalCharges / selectedFolio.creditLimit) * 100))
    : 0;

  return (
    <div className="flex flex-col lg:flex-row h-full bg-[#F4F7F5] text-slate-800 p-4 gap-3.5 overflow-hidden select-none">
      {/* Left Column: Room Directory Grid */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {/* Directory Header */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Hotel className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Hotel Room Folios</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {rooms.filter((r) => r.isOccupied).length} / {rooms.length} Occupied
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search room # or guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Rooms List */}
        <div className="flex-1 p-2.5 space-y-2 overflow-y-auto">
          {filteredRooms.map((room) => {
            const isSelected = selectedRoomNumber === room.roomNumber;
            const folio = folios.find((f) => f.roomId === room.id);

            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoomNumber(room.roomNumber)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-slate-900">Room {room.roomNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold uppercase">
                        {room.roomType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {room.isOccupied ? (
                      <div className="text-xs font-semibold text-emerald-800 mt-1 flex items-center space-x-1">
                        <User className="w-3 h-3 text-emerald-600" />
                        <span>{room.guestName}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 font-medium mt-1">Vacant / Available</div>
                    )}
                  </div>

                  <div className="text-right">
                    {room.isOccupied && folio ? (
                      <div>
                        <div className="text-xs font-black font-mono text-slate-900">
                          ${folio.totalCharges.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Limit: ${folio.creditLimit.toFixed(0)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold">
                        VACANT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Selected Room Folio Ledger */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {selectedRoom && selectedFolio ? (
          <>
            {/* Folio Header Info */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-black text-slate-900">
                    Room {selectedRoom.roomNumber} — {selectedFolio.guestName}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    FOLIO {selectedFolio.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Stay: {selectedFolio.checkInDate} to {selectedFolio.checkOutDate} • Phone: {selectedFolio.guestPhone || 'N/A'}
                </div>
              </div>

              <button
                onClick={() => setIsPostChargeOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Post Direct Folio Charge</span>
              </button>
            </div>

            {/* Credit Limit Meter Bar */}
            <div className="px-4 py-3 bg-white border-b border-slate-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold">Room Credit Line Utilization</span>
                <span className="font-mono font-black text-slate-900">
                  ${selectedFolio.totalCharges.toFixed(2)} / ${selectedFolio.creditLimit.toFixed(2)} ({creditUsagePercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                <div
                  className={`h-full transition-all duration-300 ${
                    creditUsagePercent >= 90
                      ? 'bg-rose-500'
                      : creditUsagePercent >= 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${creditUsagePercent}%` }}
                />
              </div>
            </div>

            {/* Charges Ledger Table */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Itemized Incidentals & Dining Charges
              </div>

              <div className="bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                {selectedFolio.charges.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No charges posted to this room folio yet.
                  </div>
                ) : (
                  selectedFolio.charges.map((charge) => (
                    <div key={charge.id} className="p-3 flex items-center justify-between text-xs hover:bg-white transition-colors">
                      <div>
                        <div className="font-bold text-slate-900">{charge.description}</div>
                        <div className="text-[10px] text-slate-400">
                          {charge.outletName} • Posted by {charge.postedBy} at{' '}
                          {new Date(charge.postedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="font-mono font-black text-slate-900 text-sm">
                        ${charge.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400 text-center">
            <Hotel className="w-12 h-12 text-slate-300 mb-3" />
            <div className="font-bold text-sm text-slate-700">Room {selectedRoom?.roomNumber} is Vacant</div>
            <div className="text-xs mt-1 text-slate-400">Check in a guest via Front Desk PMS to open a dining folio.</div>
          </div>
        )}
      </div>

      {/* Manual Post Charge Modal */}
      {isPostChargeOpen && selectedFolio && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">Post Charge to Room {selectedRoom.roomNumber}</h3>
              <button onClick={() => setIsPostChargeOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {postError && (
              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{postError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Charge Description</label>
              <input
                type="text"
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-base font-mono font-black text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPostChargeOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePostManualCharge}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Post Charge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
