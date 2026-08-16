import React from 'react';
import {
  Bell,
  Search,
  Sparkles,
  ShieldCheck,
  Plus,
  Tv,
  Calendar,
  Layers,
  ChevronRight,
  Printer,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { AppViewMode } from './HeaderNav';
import { storage } from '../../services/storage';

interface WorkspaceTopBarProps {
  currentMode: AppViewMode;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
}

export const WorkspaceTopBar: React.FC<WorkspaceTopBarProps> = ({
  currentMode,
  onPrimaryAction,
  primaryActionLabel,
  onSecondaryAction,
  secondaryActionLabel,
}) => {
  const state = storage.getState();
  const currentOutlet = storage.getCurrentOutlet();

  const getModeInfo = () => {
    switch (currentMode) {
      case 'FOH':
        return {
          title: 'Front-of-House Register',
          subtitle: `${currentOutlet.name} • Active Dine-In Tables & Quick Orders`,
          defaultAction: '+ Quick Bar Tab',
        };
      case 'KDS':
        return {
          title: 'Kitchen Display System (KDS)',
          subtitle: 'Live Culinary Ticket Routing & Station Cook Timers',
          defaultAction: 'Station Filter',
        };
      case 'HOTEL':
        return {
          title: 'Guest Rooms & Folio Ledger',
          subtitle: 'PMS Room Charge Posting & Resident Credit Limits',
          defaultAction: '+ Room Charge',
        };
      case 'INVENTORY':
        return {
          title: 'Inventory & Recipe BOMs',
          subtitle: 'Real-time Stock Depletion Ledger & Recipe Yield Calculator',
          defaultAction: '+ Stock Intake',
        };
      case 'ADMIN':
        return {
          title: 'Executive Analytics & Audit',
          subtitle: 'Multi-Outlet Sales, eTIMS Tax Fiscal Records & Security Logs',
          defaultAction: 'Export eTIMS Report',
        };
      case 'TESTS':
        return {
          title: 'System Self-Test Suite',
          subtitle: 'Automated POS, KDS, Folio & BOM Accounting Verification',
          defaultAction: 'Execute All Tests',
        };
      default:
        return {
          title: 'Workspace Dashboard',
          subtitle: 'Enterprise Hospitality POS SaaS',
          defaultAction: 'Action',
        };
    }
  };

  const info = getModeInfo();
  const actionLabel = primaryActionLabel || info.defaultAction;

  return (
    <div className="bg-white px-5 py-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Title & Breadcrumb */}
      <div>
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
          <span>{state.hotel.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-emerald-700 font-semibold">{currentOutlet.name}</span>
        </div>
        <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <span>{info.title}</span>
        </h1>
        <p className="text-xs text-slate-500 font-normal">{info.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Compliance / Live status pill */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>eTIMS / KRA Connected</span>
        </div>

        {/* Notification Bell */}
        <button
          className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 border-2 border-white" />
        </button>

        {/* Secondary Action (if passed) */}
        {onSecondaryAction && secondaryActionLabel && (
          <button
            onClick={onSecondaryAction}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{secondaryActionLabel}</span>
          </button>
        )}

        {/* Primary Action CTA Button */}
        {onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-700/20 flex items-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
