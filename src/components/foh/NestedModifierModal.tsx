import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Minus, AlertCircle, Sparkles, ChefHat } from 'lucide-react';
import { MenuItem, ModifierGroup, ModifierOption, SelectedModifier, KitchenStation } from '../../types';

interface NestedModifierModalProps {
  item: MenuItem;
  seatNumber: number;
  onClose: () => void;
  onAddToCart: (
    selectedModifiers: SelectedModifier[],
    quantity: number,
    seatNumber: number,
    specialInstructions?: string,
    modifiersPrice?: number
  ) => void;
}

export const NestedModifierModal: React.FC<NestedModifierModalProps> = ({
  item,
  seatNumber: initialSeatNumber,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [seatNumber, setSeatNumber] = useState(initialSeatNumber || 1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedMods, setSelectedMods] = useState<Record<string, SelectedModifier>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize defaults
  useEffect(() => {
    const initial: Record<string, SelectedModifier> = {};

    item.modifierGroups.forEach((group) => {
      const defaultOpt = group.options.find((o) => o.isDefault) || (group.isRequired ? group.options[0] : undefined);
      if (defaultOpt) {
        const selected: SelectedModifier = {
          groupId: group.id,
          groupName: group.name,
          optionId: defaultOpt.id,
          optionName: defaultOpt.name,
          priceDelta: defaultOpt.priceDelta,
        };

        // If default option has nested sub-group, pick default sub-option
        if (defaultOpt.nestedGroup && defaultOpt.nestedGroup.options.length > 0) {
          const subDefault = defaultOpt.nestedGroup.options.find((no) => no.isDefault) || defaultOpt.nestedGroup.options[0];
          if (subDefault) {
            selected.nestedOptionId = subDefault.id;
            selected.nestedOptionName = subDefault.name;
            selected.nestedPriceDelta = subDefault.priceDelta;
          }
        }

        initial[group.id] = selected;
      }
    });

    setSelectedMods(initial);
  }, [item]);

  // Calculate live total price
  const modifiersPriceDelta = (Object.values(selectedMods) as SelectedModifier[]).reduce(
    (acc: number, m: SelectedModifier) => acc + m.priceDelta + (m.nestedPriceDelta || 0),
    0
  );
  const unitTotal = item.basePrice + modifiersPriceDelta;
  const grandTotal = unitTotal * quantity;

  // Handle Level 2 Option Selection
  const handleSelectOption = (group: ModifierGroup, opt: ModifierOption) => {
    const current = selectedMods[group.id];
    if (current && current.optionId === opt.id) {
      if (!group.isRequired) {
        const next = { ...selectedMods };
        delete next[group.id];
        setSelectedMods(next);
      }
      return;
    }

    const nextMod: SelectedModifier = {
      groupId: group.id,
      groupName: group.name,
      optionId: opt.id,
      optionName: opt.name,
      priceDelta: opt.priceDelta,
    };

    // Auto-select nested default if available
    if (opt.nestedGroup && opt.nestedGroup.options.length > 0) {
      const subDefault = opt.nestedGroup.options.find((no) => no.isDefault) || opt.nestedGroup.options[0];
      if (subDefault) {
        nextMod.nestedOptionId = subDefault.id;
        nextMod.nestedOptionName = subDefault.name;
        nextMod.nestedPriceDelta = subDefault.priceDelta;
      }
    }

    setSelectedMods({
      ...selectedMods,
      [group.id]: nextMod,
    });
  };

  // Handle Level 3 / Level 4 Nested Sub-Option Selection
  const handleSelectNestedOption = (groupId: string, opt: ModifierOption, nestedOpt: any) => {
    const current = selectedMods[groupId];
    if (!current) return;

    setSelectedMods({
      ...selectedMods,
      [groupId]: {
        ...current,
        nestedOptionId: nestedOpt.id,
        nestedOptionName: nestedOpt.name,
        nestedPriceDelta: nestedOpt.priceDelta,
      },
    });
  };

  const handleConfirm = () => {
    // Validate required groups
    const errors: string[] = [];
    item.modifierGroups.forEach((group) => {
      if (group.isRequired && !selectedMods[group.id]) {
        errors.push(`Please make a selection for "${group.name}"`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    onAddToCart(
      Object.values(selectedMods),
      quantity,
      seatNumber,
      specialInstructions.trim() || undefined,
      modifiersPriceDelta * quantity
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-white">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-900">{item.name}</h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                {item.station}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modifiers List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {validationErrors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 font-bold">
                {validationErrors.map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
              </div>
            </div>
          )}

          {/* Modifier Groups */}
          {item.modifierGroups.map((group) => {
            const selected = selectedMods[group.id];

            return (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">
                    {group.name} {group.isRequired && <span className="text-rose-500 font-bold">*</span>}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {group.isRequired ? 'Required (Choose 1)' : 'Optional'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.options.map((opt) => {
                    const isSelected = selected?.optionId === opt.id;

                    return (
                      <div key={opt.id} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => handleSelectOption(group, opt)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-xs ring-2 ring-emerald-500/20'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>{opt.name}</span>
                          </div>

                          {opt.priceDelta > 0 && (
                            <span className="text-emerald-700 font-black font-mono">
                              +${opt.priceDelta.toFixed(2)}
                            </span>
                          )}
                        </button>

                        {/* Level 3 & Level 4 Nested Sub-Group Accordion */}
                        {isSelected && opt.nestedGroup && (
                          <div className="ml-4 pl-3 border-l-2 border-emerald-500/40 space-y-1.5 py-1">
                            <div className="text-[11px] font-bold text-emerald-800">
                              {opt.nestedGroup.name} (Sub-Option)
                            </div>
                            <div className="space-y-1">
                              {opt.nestedGroup.options.map((nestedOpt) => {
                                const isNestedSelected = selected?.nestedOptionId === nestedOpt.id;
                                return (
                                  <button
                                    key={nestedOpt.id}
                                    type="button"
                                    onClick={() => handleSelectNestedOption(group.id, opt, nestedOpt)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] flex items-center justify-between border cursor-pointer ${
                                      isNestedSelected
                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>{nestedOpt.name}</span>
                                    {nestedOpt.priceDelta > 0 && (
                                      <span className="font-mono text-emerald-700 font-bold">
                                        +${nestedOpt.priceDelta.toFixed(2)}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Seat Assignment & Special Kitchen Note */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Seat Assignment</label>
              <select
                value={seatNumber}
                onChange={(e) => setSeatNumber(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    Seat {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kitchen Note / Allergies</label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g. Gluten allergy, extra dressing on the side..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer: Quantity Counter + Live Grand Total + Add Action */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-500">Qty:</span>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-black text-sm text-slate-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Item Total</div>
              <div className="text-lg font-black text-slate-900 font-mono">${grandTotal.toFixed(2)}</div>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl shadow-xs transition-all text-xs flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <span>Add to Order</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
