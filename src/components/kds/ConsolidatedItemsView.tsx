import React from 'react';
import { KitchenTicket, TicketStatus } from '../../types';
import { Layers, CheckCircle2 } from 'lucide-react';

interface ConsolidatedItemsViewProps {
  tickets: KitchenTicket[];
}

export const ConsolidatedItemsView: React.FC<ConsolidatedItemsViewProps> = ({ tickets }) => {
  // Aggregate items across active tickets
  const itemCounts: Record<string, { name: string; quantity: number; station: string; modifiers: string[] }> = {};

  tickets.forEach((ticket) => {
    if (ticket.status !== TicketStatus.SERVED) {
      ticket.items.forEach((item) => {
        if (!item.isDone) {
          const key = `${item.name}-${ticket.station}`;
          if (!itemCounts[key]) {
            itemCounts[key] = {
              name: item.name,
              quantity: 0,
              station: ticket.station,
              modifiers: [],
            };
          }
          itemCounts[key].quantity += item.quantity;
          itemCounts[key].modifiers.push(...item.modifiersSummary);
        }
      });
    }
  });

  const aggregatedList = Object.values(itemCounts).sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 mb-3.5 text-slate-800 shadow-sm select-none">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Consolidated Kitchen Item Aggregator (On-Deck Summary)
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {aggregatedList.reduce((acc, i) => acc + i.quantity, 0)} Total Active Items
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-3">
        {aggregatedList.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-2.5 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all"
          >
            <div className="pr-2">
              <div className="font-bold text-xs text-slate-900 line-clamp-1">{item.name}</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">{item.station}</div>
            </div>
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black font-mono text-xs flex items-center justify-center shrink-0 shadow-xs">
              {item.quantity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

