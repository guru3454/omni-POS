import React, { useState } from 'react';
import {
  Building2,
  Store,
  Wifi,
  WifiOff,
  RefreshCw,
  User as UserIcon,
  DollarSign,
  Shield,
  Layers,
  UtensilsCrossed,
  Tv,
  Hotel,
  Package,
  BarChart3,
  CheckCircle2,
  Lock,
  ChevronDown,
  Sparkles,
  Search,
  Bell,
  Settings,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { storage } from '../../services/storage';
import { Outlet, User, UserRole, ShiftStatus } from '../../types';

export type AppViewMode = 'FOH' | 'KDS' | 'HOTEL' | 'INVENTORY' | 'ADMIN' | 'TESTS';

interface HeaderNavProps {
  currentMode: AppViewMode;
  onSelectMode: (mode: AppViewMode) => void;
  onOpenShiftModal: () => void;
  onOpenPinModal: () => void;
  onOpenTestModal: () => void;
  onQuickAction?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentMode,
  onSelectMode,
  onOpenShiftModal,
  onOpenPinModal,
  onOpenTestModal,
  onQuickAction,
}) => {
  const [outletMenuOpen, setOutletMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const state = storage.getState();
  const currentOutlet = storage.getCurrentOutlet();
  const currentUser = storage.getCurrentUser();
  const activeShift = storage.getActiveShift();
  const pendingOutboxCount = state.outbox.filter((t) => t.syncStatus === 'PENDING').length;

  // Real-time badge calculations
  const activeOrdersCount = state.orders.filter((o) => o.status !== 'PAID' && o.status !== 'CANCELLED').length;
  const kdsActiveCount = state.kitchenTickets.filter((t) => t.status !== 'SERVED').length;
  const occupiedRoomsCount = state.rooms.filter((r) => r.isOccupied).length;
  const lowStockCount = state.inventory.filter((i) => i.currentStock <= i.minReorderLevel).length;

  const handleToggleOnline = () => {
    storage.setOnlineStatus(!state.isOnline);
  };

  const handleSyncOutbox = () => {
    const count = storage.syncOutbox();
    alert(`Outbox synchronized! ${count} pending transactions committed.`);
  };

  const navItems: { mode: AppViewMode; label: string; icon: any; badge?: string | number; badgeColor?: string }[] = [
    { mode: 'FOH', label: 'Dashboard & FOH', icon: UtensilsCrossed, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined, badgeColor: 'bg-emerald-500 text-slate-950 font-bold' },
    { mode: 'KDS', label: 'Kitchen KDS', icon: Tv, badge: kdsActiveCount > 0 ? kdsActiveCount : undefined, badgeColor: 'bg-amber-400 text-slate-950 font-bold' },
    { mode: 'HOTEL', label: 'Guest Folios', icon: Hotel, badge: `${occupiedRoomsCount} Rms`, badgeColor: 'bg-blue-500/20 text-blue-300' },
    { mode: 'INVENTORY', label: 'Inventory & BOM', icon: Package, badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined, badgeColor: 'bg-rose-500/20 text-rose-300 font-bold' },
    { mode: 'ADMIN', label: 'Analytics & Audit', icon: BarChart3 },
    { mode: 'TESTS', label: 'System Self-Test', icon: CheckCircle2, badge: '100%', badgeColor: 'bg-emerald-500/20 text-emerald-400 font-mono font-bold' },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#121614] text-slate-300 flex flex-col justify-between p-3.5 rounded-2xl border border-emerald-950/40 shadow-2xl select-none">
      {/* Top Section: Brand + Workspace Selector + Search + Navigation */}
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1.5 pt-1">
          <div className="flex items-center space-x-2.5">
            {/* Glowing Triple Bar Logo inspired by reference */}
            <div className="flex items-center space-x-0.5">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="w-1.5 h-5 bg-emerald-400 rounded-full inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full inline-block shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">OmniPOS</span>
              <span className="text-[10px] text-emerald-400 font-bold ml-1 px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/40">
                v2.6
              </span>
            </div>
          </div>

          <div
            onClick={handleToggleOnline}
            title={state.isOnline ? 'System Online (Click to toggle offline air-gap)' : 'Offline Air-Gap Mode Active'}
            className="cursor-pointer"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                state.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-amber-400 animate-ping'
              }`}
            />
          </div>
        </div>

        {/* Workspace / Outlet Switcher Card */}
        <div className="relative">
          <button
            onClick={() => setOutletMenuOpen(!outletMenuOpen)}
            className="w-full text-left bg-[#19211c] hover:bg-[#1f2923] border border-emerald-500/20 hover:border-emerald-500/40 p-2.5 rounded-xl transition-all flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold truncate">
                  {state.hotel.name}
                </div>
                <div className="text-xs font-semibold text-white truncate">{currentOutlet.name}</div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0 ml-1" />
          </button>

          {/* Outlet Dropdown */}
          {outletMenuOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#171d19] border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Switch Property Outlet
              </div>
              {state.outlets.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    storage.setCurrentOutlet(o.id);
                    setOutletMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    o.id === currentOutlet.id ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="truncate">
                    <div>{o.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">{o.type}</div>
                  </div>
                  {o.id === currentOutlet.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search for..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#171d19] border border-slate-800/80 rounded-xl pl-8 pr-12 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <span className="absolute right-2.5 top-2 text-[10px] font-mono text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
            ⌘+K
          </span>
        </div>

        {/* Main Navigation Section */}
        <div className="space-y-1 pt-1">
          <div className="px-2 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Navigation
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => onSelectMode(item.mode)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-[#1f2822] text-white font-semibold shadow-sm border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#181f1a]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: Shift Float Status + Offline Outbox + User Account */}
      <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
        {/* Shift Cash Drawer Status Pill */}
        <button
          onClick={onOpenShiftModal}
          className="w-full bg-[#181f1a] hover:bg-[#1f2822] border border-slate-800 hover:border-slate-700 p-2 rounded-xl text-left transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <DollarSign className={`w-3.5 h-3.5 shrink-0 ${activeShift ? 'text-emerald-400' : 'text-rose-400'}`} />
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {activeShift ? 'Active Shift' : 'Shift Closed'}
              </div>
              <div className="text-xs font-bold text-white truncate">
                {activeShift ? `$${activeShift.expectedCash.toFixed(2)} in drawer` : 'Tap to Open Float'}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">
            {activeShift ? 'X/Z →' : 'Start →'}
          </span>
        </button>

        {/* Offline Outbox Sync Bar (If any pending) */}
        {pendingOutboxCount > 0 && (
          <button
            onClick={handleSyncOutbox}
            className="w-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 p-2 rounded-xl text-xs font-bold text-amber-300 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center space-x-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              <span>{pendingOutboxCount} Pending Sync</span>
            </div>
            <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">Sync</span>
          </button>
        )}

        {/* User Account Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full bg-[#171d19] hover:bg-[#1d2520] border border-slate-800 p-2 rounded-xl flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">#{currentUser.role.toLowerCase().replace('_', '-')}</div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* User Switcher Dropdown */}
          {userMenuOpen && (
            <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-[#171d19] border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Switch Staff / Quick PIN
              </div>
              {state.users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    storage.setCurrentUser(u);
                    setUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    u.id === currentUser.id ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="font-medium text-white">{u.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Role: {u.role} (PIN: {u.pin})</div>
                  </div>
                  {u.id === currentUser.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
