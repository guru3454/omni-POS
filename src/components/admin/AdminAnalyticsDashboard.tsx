import React, { useState } from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  FileCheck2,
  Users,
  Store,
  Calendar,
  Layers,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { storage } from '../../services/storage';

export const AdminAnalyticsDashboard: React.FC = () => {
  const state = storage.getState();
  const orders = state.orders;
  const payments = state.payments;
  const auditLogs = state.auditLogs;
  const fiscalRecords = state.fiscalRecords;

  const [activeTab, setActiveTab] = useState<'KPI' | 'AUDIT' | 'INVOICES'>('KPI');

  // Compute metrics
  const totalGrossSales = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  const totalNetSales = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + (o.subtotal - o.discountAmount), 0);

  const totalTaxes = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + o.taxAmount + o.serviceChargeAmount + o.cateringLevyAmount, 0);

  const completedOrders = orders.filter((o) => o.status === 'PAID');
  const aov = completedOrders.length > 0 ? totalGrossSales / completedOrders.length : 0;

  // Tender breakdown
  const cardTotal = payments.filter((p) => p.method === 'CARD').reduce((acc, p) => acc + p.amount, 0);
  const cashTotal = payments.filter((p) => p.method === 'CASH').reduce((acc, p) => acc + p.amount, 0);
  const roomTotal = payments.filter((p) => p.method === 'ROOM_CHARGE').reduce((acc, p) => acc + p.amount, 0);
  const mpesaTotal = payments.filter((p) => p.method === 'MPESA').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="flex flex-col h-full bg-[#F4F7F5] text-slate-800 p-4 space-y-3.5 overflow-hidden select-none">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'KPI', label: 'Executive Sales & KPIs', icon: BarChart3 },
            { id: 'AUDIT', label: 'Security & Override Audit Trail', icon: ShieldCheck },
            { id: 'INVOICES', label: 'Fiscal Tax Invoices (eTIMS / KRA)', icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 font-mono font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
          Last Synced: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 overflow-y-auto p-4 space-y-4 shadow-sm">
        {/* TAB 1: EXECUTIVE KPIS & FINANCIAL BREAKDOWNS */}
        {activeTab === 'KPI' && (
          <div className="space-y-4">
            {/* Top 4 KPI metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/90 space-y-1 shadow-2xs hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Gross POS Revenue</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">${totalGrossSales.toFixed(2)}</div>
                <div className="text-[10px] text-emerald-700 font-bold">Includes 16% VAT + 5% SC + 2% Levy</div>
              </div>

              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/90 space-y-1 shadow-2xs hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Net Food & Beverage Sales</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">${totalNetSales.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500">Net after discounts & before tax</div>
              </div>

              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/90 space-y-1 shadow-2xs hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Taxes & Levies Collected</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">${totalTaxes.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500">eTIMS / KRA Fiscal Provisioned</div>
              </div>

              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/90 space-y-1 shadow-2xs hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>Average Order Value (AOV)</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-purple-700" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">${aov.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500">Across {completedOrders.length} Settled Checks</div>
              </div>
            </div>

            {/* Middle Grid: Tender Breakdown & Outlet Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tender Breakdown */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Revenue by Payment Tender Method</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-bold text-slate-800">Credit / Debit Cards (EMV)</span>
                    <span className="font-mono font-black text-slate-900">${cardTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-bold text-slate-800">Cash in Drawer</span>
                    <span className="font-mono font-black text-emerald-700">${cashTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-bold text-slate-800">Hotel Guest Room Folios</span>
                    <span className="font-mono font-black text-purple-700">${roomTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="font-bold text-slate-800">M-Pesa / Mobile Money</span>
                    <span className="font-mono font-black text-teal-700">${mpesaTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Outlet Performance */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sales Volume by Department Outlet</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {state.outlets.map((outlet) => {
                    const outletOrders = orders.filter((o) => o.outletId === outlet.id && o.status !== 'CANCELLED');
                    const outletSales = outletOrders.reduce((acc, o) => acc + o.totalAmount, 0);

                    return (
                      <div
                        key={outlet.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{outlet.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-medium">{outlet.type} • {outletOrders.length} Orders</div>
                        </div>
                        <span className="font-mono font-black text-slate-900">${outletSales.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT TRAIL LOG */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              Immutable ledger of all security-sensitive events, manager overrides, line item voids, discounts, and cashier shifts.
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-2xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono font-bold text-[10px] border border-emerald-200">
                        {log.action}
                      </span>
                      <span className="font-bold text-slate-900">{log.actorName}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">({log.actorRole})</span>
                    </div>
                    <p className="text-slate-600 text-xs">{log.details}</p>
                  </div>

                  <div className="text-right text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FISCAL TAX INVOICES */}
        {activeTab === 'INVOICES' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              Cryptographically signed eTIMS / KRA fiscal receipts with tamper-evident hash chaining and QR validation tokens.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fiscalRecords.map((inv) => (
                <div key={inv.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-black text-sm text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        Order #{inv.orderId.slice(-6)} • Issued: {new Date(inv.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      FISCAL_SIGNED
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Total:</span>
                      <span className="font-black text-slate-900">${inv.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>VAT 16%:</span>
                      <span className="text-emerald-700 font-bold">${inv.vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Catering Levy 2%:</span>
                      <span>${inv.cateringLevyAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                      <span>eTIMS CU SN:</span>
                      <span className="text-slate-700">{inv.cuSerialNumber}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Fiscal Sign:</span>
                      <span className="text-slate-700 truncate max-w-[200px]">{inv.fiscalSignature}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

