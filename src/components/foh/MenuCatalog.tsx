import React, { useState } from 'react';
import { Search, Flame, Pizza, Wine, Cake, Sparkles, AlertCircle, ChefHat, Plus } from 'lucide-react';
import { MenuCategory, MenuItem } from '../../types';
import { storage } from '../../services/storage';

interface MenuCatalogProps {
  onSelectItem: (item: MenuItem) => void;
}

export const MenuCatalog: React.FC<MenuCatalogProps> = ({ onSelectItem }) => {
  const state = storage.getState();
  const currentOutlet = storage.getCurrentOutlet();

  // Filter categories by outlet (or shared categories)
  const categories = state.categories.filter((c) => !c.outletId || c.outletId === currentOutlet.id);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  // Map icon names
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-3.5 h-3.5" />;
      case 'Pizza':
        return <Pizza className="w-3.5 h-3.5" />;
      case 'Wine':
        return <Wine className="w-3.5 h-3.5" />;
      case 'Cake':
        return <Cake className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  // Filter items
  const itemsToDisplay = (activeCategory?.items || []).filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm text-slate-800 select-none">
      {/* Category Pills & Search Bar Header */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog by name, SKU or keyword..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors shadow-2xs"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-0.5 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = activeCategory?.id === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-emerald-800/40 text-white font-black' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cat.items.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 p-3.5 overflow-y-auto">
        {itemsToDisplay.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
            <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
            <span>No menu items found in this section.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {itemsToDisplay.map((item) => {
              const hasModifiers = item.modifierGroups.length > 0;

              return (
                <div
                  key={item.id}
                  onClick={() => item.isAvailable && onSelectItem(item)}
                  className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-md ${
                    item.isAvailable
                      ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10'
                      : 'bg-slate-50 border-slate-200/60 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Item Station & SKU */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono text-slate-400 font-semibold">{item.sku}</span>
                    <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {item.station}
                    </span>
                  </div>

                  {/* Name & Description */}
                  <div className="my-1">
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 font-normal leading-relaxed">{item.description}</p>
                  </div>

                  {/* Footer: Price & Modifier Hint */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-2">
                    <span className="text-sm font-black text-slate-900 font-mono">
                      ${item.basePrice.toFixed(2)}
                    </span>

                    {item.isAvailable ? (
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center space-x-1 shadow-2xs">
                        <Plus className="w-3 h-3" />
                        <span>{hasModifiers ? 'Customize' : 'Add'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                        Sold Out
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
