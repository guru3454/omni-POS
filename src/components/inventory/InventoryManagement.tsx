import React, { useState } from 'react';
import {
  Package,
  PlusCircle,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  TrendingDown,
  Layers,
  Search,
  BookOpen,
  DollarSign,
  ArrowDownRight,
  X,
} from 'lucide-react';
import { InventoryItem, Recipe, StockMovement, StockMovementType, MenuCategory } from '../../types';
import { storage, generateUUID } from '../../services/storage';

export const InventoryManagement: React.FC = () => {
  const state = storage.getState();
  const inventory = state.inventory;
  const recipes = state.recipes;
  const categories = state.categories;

  const [activeTab, setActiveTab] = useState<'STOCK' | 'RECIPES' | 'WASTE'>('STOCK');
  const [searchQuery, setSearchQuery] = useState('');

  // Stock intake modal
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [intakeItemId, setIntakeItemId] = useState(inventory[0]?.id || '');
  const [intakeQty, setIntakeQty] = useState('10');
  const [intakeUnitCost, setIntakeUnitCost] = useState('25.00');

  // Wastage modal
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteItemId, setWasteItemId] = useState(inventory[0]?.id || '');
  const [wasteQty, setWasteQty] = useState('1');
  const [wasteReason, setWasteReason] = useState('Expired / Spoiled in Walk-in');

  const filteredInventory = inventory.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  const lowStockCount = inventory.filter((i) => i.currentStock <= i.minReorderLevel).length;

  const handleStockIntake = () => {
    const qty = parseFloat(intakeQty);
    const cost = parseFloat(intakeUnitCost);
    if (isNaN(qty) || qty <= 0) return;

    const item = inventory.find((i) => i.id === intakeItemId);
    if (!item) return;

    const prevBalance = item.currentStock;
    item.currentStock = Number((item.currentStock + qty).toFixed(2));
    item.unitCost = cost;
    item.lastRestockedAt = new Date().toISOString();

    const movement: StockMovement = {
      id: generateUUID(),
      hotelId: state.hotel.id,
      inventoryItemId: item.id,
      inventoryItemName: item.name,
      movementType: StockMovementType.RECEIVING,
      quantityChange: qty,
      previousBalance: prevBalance,
      newBalance: item.currentStock,
      costImpact: Number((qty * cost).toFixed(2)),
      referenceDoc: `PO-${Date.now().toString().slice(-5)}`,
      performedBy: state.currentUser.name,
      timestamp: new Date().toISOString(),
    };
    state.stockMovements.unshift(movement);

    storage.addAuditLog(
      'STOCK_INTAKE',
      'InventoryItem',
      item.id,
      `Received ${qty} ${item.unit} of ${item.name} at $${cost.toFixed(2)}/${item.unit}`
    );

    setIsIntakeModalOpen(false);
  };

  const handleRecordWaste = () => {
    const qty = parseFloat(wasteQty);
    if (isNaN(qty) || qty <= 0) return;

    const item = inventory.find((i) => i.id === wasteItemId);
    if (!item) return;

    const prevBalance = item.currentStock;
    item.currentStock = Math.max(0, Number((item.currentStock - qty).toFixed(2)));

    const movement: StockMovement = {
      id: generateUUID(),
      hotelId: state.hotel.id,
      inventoryItemId: item.id,
      inventoryItemName: item.name,
      movementType: StockMovementType.WASTAGE,
      quantityChange: -qty,
      previousBalance: prevBalance,
      newBalance: item.currentStock,
      costImpact: Number((qty * item.unitCost).toFixed(2)),
      referenceDoc: `WASTE-LOG`,
      reason: wasteReason,
      performedBy: state.currentUser.name,
      timestamp: new Date().toISOString(),
    };

    state.stockMovements.unshift(movement);

    storage.addAuditLog(
      'STOCK_WASTE',
      'InventoryItem',
      item.id,
      `Wrote off ${qty} ${item.unit} of ${item.name} ($${movement.costImpact.toFixed(2)}) - ${wasteReason}`
    );

    setIsWasteModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F7F5] text-slate-800 p-4 space-y-3.5 overflow-hidden select-none">
      {/* Top Header & Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'STOCK', label: 'Raw Inventory & Ingredients', icon: Package },
            { id: 'RECIPES', label: 'Menu Recipes & BOMs', icon: BookOpen },
            { id: 'WASTE', label: 'Wastage & Spoilage Logs', icon: TrendingDown },
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

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {lowStockCount > 0 && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{lowStockCount} Low Stock Alerts</span>
            </div>
          )}

          <button
            onClick={() => setIsWasteModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span>Record Waste</span>
          </button>

          <button
            onClick={() => setIsIntakeModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-white" />
            <span>+ Receive Stock</span>
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col shadow-sm">
        {/* TAB 1: RAW INVENTORY ITEMS */}
        {activeTab === 'STOCK' && (
          <div className="flex flex-col h-full">
            {/* Search filter */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search raw ingredients by SKU, Name or Category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="p-3 pl-4">SKU / Item</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Stock on Hand</th>
                    <th className="p-3">Reorder Alert</th>
                    <th className="p-3">Unit Cost</th>
                    <th className="p-3">Total Value</th>
                    <th className="p-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item) => {
                    const isLow = item.currentStock <= item.minReorderLevel;
                    const totalVal = item.currentStock * item.unitCost;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-black text-slate-900 text-sm">
                          {item.currentStock.toFixed(2)} {item.unit}
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {item.minReorderLevel} {item.unit}
                        </td>
                        <td className="p-3 font-mono text-slate-700">${item.unitCost.toFixed(2)}</td>
                        <td className="p-3 font-mono font-black text-slate-900">${totalVal.toFixed(2)}</td>
                        <td className="p-3 pr-4">
                          {isLow ? (
                            <span className="px-2 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold inline-flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>LOW STOCK</span>
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>SUFFICIENT</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MENU RECIPES & BOMs */}
        {activeTab === 'RECIPES' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="text-xs text-slate-500">
              Every menu order automatically calculates and deducts raw ingredient BOM units upon kitchen firing.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe) => {
                // Find menu item price
                let menuItemPrice = 0;
                categories.forEach((c) => {
                  const itm = c.items.find((i) => i.id === recipe.menuItemId);
                  if (itm) menuItemPrice = itm.basePrice;
                });

                // Calculate total BOM cost
                const totalRecipeCost = recipe.ingredients.reduce((acc, ing) => {
                  const inv = inventory.find((i) => i.id === ing.inventoryItemId);
                  return acc + (inv ? inv.unitCost * ing.quantityRequired : 0);
                }, 0);

                const foodCostPct = menuItemPrice > 0 ? (totalRecipeCost / menuItemPrice) * 100 : 0;

                return (
                  <div
                    key={recipe.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-black text-sm text-slate-900">{recipe.menuItemName}</h4>
                        <div className="text-[10px] text-slate-400">Yield: {recipe.yieldPortions} Portion</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black font-mono text-slate-900">
                          BOM Cost: ${totalRecipeCost.toFixed(2)}
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            foodCostPct > 35 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          Food Cost: {foodCostPct.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Ingredient Line Breakdown */}
                    <div className="bg-slate-50/70 rounded-xl p-2.5 space-y-1.5 text-xs border border-slate-100">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Bill of Materials:</div>
                      {recipe.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-700 text-[11px]">
                          <span>{ing.inventoryItemName}</span>
                          <span className="font-mono text-slate-500 font-medium">
                            {ing.quantityRequired} {ing.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: WASTAGE LOGS */}
        {activeTab === 'WASTE' && (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-100">
                <tr>
                  <th className="p-3 pl-4">Timestamp</th>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Quantity Wasted</th>
                  <th className="p-3">Cost Impact ($)</th>
                  <th className="p-3">Reported By</th>
                  <th className="p-3 pr-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.stockMovements.filter((m) => m.movementType === StockMovementType.WASTAGE).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No wastage records registered.
                    </td>
                  </tr>
                ) : (
                  state.stockMovements
                    .filter((m) => m.movementType === StockMovementType.WASTAGE)
                    .map((waste) => (
                      <tr key={waste.id} className="hover:bg-slate-50/60">
                        <td className="p-3 pl-4 font-mono text-slate-500">
                          {new Date(waste.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{waste.inventoryItemName}</td>
                        <td className="p-3 font-mono text-rose-600 font-bold">
                          {waste.quantityChange}
                        </td>
                        <td className="p-3 font-mono font-black text-rose-600">${waste.costImpact.toFixed(2)}</td>
                        <td className="p-3 text-slate-700">{waste.performedBy}</td>
                        <td className="p-3 pr-4 text-slate-500 italic">{waste.reason || 'N/A'}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Intake Modal */}
      {isIntakeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">Receive Raw Stock Delivery</h3>
              <button onClick={() => setIsIntakeModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Ingredient</label>
              <select
                value={intakeItemId}
                onChange={(e) => setIntakeItemId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
              >
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} (Current: {i.currentStock} {i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Received</label>
                <input
                  type="number"
                  value={intakeQty}
                  onChange={(e) => setIntakeQty(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit Cost ($)</label>
                <input
                  type="number"
                  value={intakeUnitCost}
                  onChange={(e) => setIntakeUnitCost(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsIntakeModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStockIntake}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Commit Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wastage Log Modal */}
      {isWasteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-sm text-slate-900">Record Stock Spoilage / Wastage</h3>
              <button onClick={() => setIsWasteModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Ingredient</label>
              <select
                value={wasteItemId}
                onChange={(e) => setWasteItemId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
              >
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} (Stock: {i.currentStock} {i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Wasted</label>
              <input
                type="number"
                value={wasteQty}
                onChange={(e) => setWasteQty(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
              <select
                value={wasteReason}
                onChange={(e) => setWasteReason(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
              >
                <option value="Expired / Spoiled in Walk-in">Expired / Spoiled in Walk-in</option>
                <option value="Kitchen burnt / prep error">Kitchen burnt / prep error</option>
                <option value="Dropped / Spilled during service">Dropped / Spilled during service</option>
                <option value="Supplier defect upon inspection">Supplier defect upon inspection</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsWasteModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordWaste}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Record Write-Off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
