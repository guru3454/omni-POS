import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  Printer,
  AlertTriangle,
  Flame,
  Wine,
  Pizza,
  Cake,
  Layers,
  ChefHat,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { KitchenTicket, KitchenStation, TicketStatus, OrderType } from '../../types';
import { storage } from '../../services/storage';
import { ConsolidatedItemsView } from './ConsolidatedItemsView';
import { HardwareService } from '../../services/hardware';

interface KDSBoardProps {
  onPrintDocket: (docketText: string) => void;
}

export const KDSBoard: React.FC<KDSBoardProps> = ({ onPrintDocket }) => {
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Re-tick timer every 2 seconds for live aging
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  const state = storage.getState();
  const allTickets = state.kitchenTickets;

  // Filter by station
  const filteredTickets = allTickets.filter((ticket) => {
    if (selectedStation === 'ALL') return true;
    return ticket.station === selectedStation;
  });

  const activeTickets = filteredTickets.filter((t) => t.status !== TicketStatus.SERVED);
  const completedTickets = filteredTickets.filter((t) => t.status === TicketStatus.SERVED);

  const getAgingInfo = (createdAtStr: string) => {
    const created = new Date(createdAtStr).getTime();
    const elapsedMinutes = Math.floor((now - created) / (1000 * 60));
    const elapsedSeconds = Math.floor(((now - created) / 1000) % 60);

    let colorClass = 'border-slate-200 bg-white';
    let headerClass = 'bg-slate-900 text-white';
    let timerBadge = 'bg-emerald-500/20 text-emerald-300';
    let isCritical = false;

    if (elapsedMinutes >= 15) {
      colorClass = 'border-rose-300 bg-rose-50/20 shadow-rose-100';
      headerClass = 'bg-rose-600 text-white font-black';
      timerBadge = 'bg-rose-900 text-white animate-pulse';
      isCritical = true;
    } else if (elapsedMinutes >= 10) {
      colorClass = 'border-amber-300 bg-amber-50/20';
      headerClass = 'bg-amber-600 text-white font-bold';
      timerBadge = 'bg-amber-900 text-white';
    }

    return {
      minutes: elapsedMinutes,
      seconds: elapsedSeconds,
      formatted: `${elapsedMinutes}m ${elapsedSeconds.toString().padStart(2, '0')}s`,
      colorClass,
      headerClass,
      timerBadge,
      isCritical,
    };
  };

  const handleBumpItem = (ticketId: string, lineId: string) => {
    storage.bumpKitchenTicketItem(ticketId, lineId);
  };

  const handleCompleteTicket = (ticketId: string) => {
    storage.completeKitchenTicket(ticketId);
  };

  const handleRecallTicket = (ticketId: string) => {
    storage.recallKitchenTicket(ticketId);
  };

  const handlePrintSlip = (ticket: KitchenTicket) => {
    const docketText = HardwareService.generateKitchenDocketText(ticket);
    onPrintDocket(docketText);
  };

  const stations = [
    { id: 'ALL', label: 'All Stations' },
    { id: KitchenStation.GRILL, label: 'Grill & Steaks' },
    { id: KitchenStation.BAR, label: 'Bar & Cellar' },
    { id: KitchenStation.PIZZA, label: 'Pizza & Oven' },
    { id: KitchenStation.DESSERT, label: 'Pastry & Dessert' },
    { id: KitchenStation.COLD_LARDER, label: 'Cold Larder' },
    { id: KitchenStation.HOT_PASS, label: 'Expediter Pass' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F4F7F5] text-slate-800 p-4 space-y-3 select-none overflow-hidden">
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Station Selector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
          {stations.map((stn) => {
            const isSelected = selectedStation === stn.id;
            const count =
              stn.id === 'ALL'
                ? activeTickets.length
                : allTickets.filter((t) => t.station === stn.id && t.status !== TicketStatus.SERVED).length;

            return (
              <button
                key={stn.id}
                onClick={() => setSelectedStation(stn.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{stn.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-emerald-800/50 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConsolidated(!showConsolidated)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              showConsolidated
                ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>{showConsolidated ? 'Hide Aggregator' : 'Consolidated View'}</span>
          </button>
        </div>
      </div>

      {/* Optional Consolidated Item Summary */}
      {showConsolidated && <ConsolidatedItemsView tickets={activeTickets} />}

      {/* Ticket Grid Canvas */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-4 overflow-y-auto shadow-sm">
        {activeTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs">
            <ChefHat className="w-12 h-12 text-slate-300 mb-2" />
            <div className="font-bold text-sm text-slate-700">All Clear! No Pending Tickets on this Station</div>
            <div className="text-slate-400 mt-1">New orders submitted from FOH will appear here in real time.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {activeTickets.map((ticket) => {
              const aging = getAgingInfo(ticket.createdAt);
              const allItemsChecked = ticket.items.every((i) => i.isDone);

              return (
                <div
                  key={ticket.id}
                  className={`flex flex-col justify-between rounded-2xl border shadow-xs transition-all overflow-hidden ${aging.colorClass}`}
                >
                  {/* Ticket Header: Order #, Table, Timer, Priority */}
                  <div className={`p-3 flex items-center justify-between ${aging.headerClass}`}>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm">{ticket.orderNumber}</span>
                        <span className="text-[10px] uppercase font-bold bg-black/25 px-2 py-0.5 rounded-md">
                          {ticket.tableName ? `Table ${ticket.tableName}` : ticket.orderType}
                        </span>
                      </div>
                      {ticket.roomNumber && (
                        <div className="text-[11px] font-black uppercase mt-0.5 text-amber-300">
                          ★ Room Service: Room {ticket.roomNumber}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-1 font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-black/25">
                        <Clock className="w-3 h-3" />
                        <span>{aging.formatted}</span>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90 block mt-0.5">
                        {ticket.station}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Items Checklist */}
                  <div className="p-3 space-y-2 flex-1 bg-white">
                    <div className="text-[10px] text-slate-400 pb-1 border-b border-slate-100 flex justify-between font-medium">
                      <span>Server: {ticket.serverName}</span>
                      {ticket.priority !== 'NORMAL' && (
                        <span className="font-black text-rose-600 uppercase">⚡ {ticket.priority}</span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {ticket.items.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleBumpItem(ticket.id, item.lineId)}
                          className={`p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                            item.isDone
                              ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                              : 'bg-slate-50/50 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2">
                              <input
                                type="checkbox"
                                checked={item.isDone}
                                onChange={() => {}}
                                className="mt-0.5 rounded accent-emerald-600 cursor-pointer"
                              />
                              <div>
                                <span className="font-bold text-xs">
                                  {item.quantity}x {item.name}
                                </span>
                                {item.seatNumber && (
                                  <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                    [Seat {item.seatNumber}]
                                  </span>
                                )}

                                {item.modifiersSummary.length > 0 && (
                                  <div className="text-[10px] text-slate-500 space-y-0.5 mt-0.5 font-medium">
                                    {item.modifiersSummary.map((m, mIdx) => (
                                      <div key={mIdx}>• {m}</div>
                                    ))}
                                  </div>
                                )}

                                {item.specialInstructions && (
                                  <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                                    ** NOTE: {item.specialInstructions} **
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ticket Footer Actions: Bump & Print Slip */}
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between space-x-2">
                    <button
                      onClick={() => handlePrintSlip(ticket)}
                      title="Print Kitchen Docket"
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleCompleteTicket(ticket.id)}
                      className={`flex-1 py-2 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
                        allItemsChecked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{allItemsChecked ? 'BUMP TICKET READY' : 'MARK ALL READY'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recently Completed Tickets Recall Section */}
        {completedTickets.length > 0 && (
          <div className="mt-8 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Recently Completed Tickets (Recallable)</span>
            </div>

            <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
              {completedTickets.slice(0, 8).map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 min-w-[200px] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {ticket.orderNumber} ({ticket.tableName || ticket.orderType})
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {ticket.station} • {new Date(ticket.completedAt || '').toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRecallTicket(ticket.id)}
                    className="p-1.5 bg-white hover:bg-slate-100 text-emerald-700 border border-slate-200 rounded-lg font-bold text-[11px] flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Recall</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
