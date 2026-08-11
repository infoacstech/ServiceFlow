import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import { CsvImportModal, CsvColumnMapping } from '../components/CsvImportModal';
import { Package, Plus, AlertTriangle, Search, ArrowUpRight, ArrowDownRight, X, Edit2, Upload } from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    inventory,
    addInventoryItem,
    adjustStock,
    currentBusiness,
    showToast,
    logActivity,
  } = useApp();

  const [search, setSearch] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isStockAdjustOpen, setIsStockAdjustOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const inventoryCsvFields: CsvColumnMapping[] = [
    { fieldKey: 'name', fieldLabel: 'Item Name / Part Title', required: true },
    { fieldKey: 'sku', fieldLabel: 'SKU / Part Number' },
    { fieldKey: 'category', fieldLabel: 'Category' },
    { fieldKey: 'unit', fieldLabel: 'Unit (pcs, meters, kg, etc)' },
    { fieldKey: 'currentStock', fieldLabel: 'Initial Quantity / Stock' },
    { fieldKey: 'minStock', fieldLabel: 'Min Alert Threshold' },
    { fieldKey: 'purchasePrice', fieldLabel: 'Purchase Cost Price' },
    { fieldKey: 'sellingPrice', fieldLabel: 'Selling Unit Price' },
  ];

  const handleBatchImportInventory = (importedRows: Partial<InventoryItem>[]) => {
    let successCount = 0;

    importedRows.forEach((row, idx) => {
      if (!row.name) return;

      const autoSku = row.sku || `SKU-${Date.now().toString().slice(-4)}-${idx + 1}`;

      addInventoryItem({
        name: row.name,
        sku: autoSku,
        unit: row.unit || 'pcs',
        currentStock: Number(row.currentStock) || 0,
        minStock: Number(row.minStock) || 3,
        purchasePrice: Number(row.purchasePrice) || 0,
        sellingPrice: Number(row.sellingPrice) || 0,
        category: row.category || 'General Parts',
      });

      successCount++;
    });

    showToast(`Successfully imported ${successCount} inventory items!`, 'success');
    logActivity(
      'Bulk Inventory CSV Import',
      'inventory',
      `batch-${Date.now()}`,
      `Imported ${successCount} stock items from CSV spreadsheet`
    );
  };

  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');
  const [adjustReason, setAdjustReason] = useState('Stock Purchase / Restock');

  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    unit: 'pcs',
    currentStock: 10,
    minStock: 3,
    purchasePrice: 1000,
    sellingPrice: 1500,
    taxPercent: 18,
    category: 'General Parts',
  });

  const filtered = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryItem(newItem);
    setIsAddItemOpen(false);
    setNewItem({
      name: '',
      sku: '',
      unit: 'pcs',
      currentStock: 10,
      minStock: 3,
      purchasePrice: 1000,
      sellingPrice: 1500,
      taxPercent: 18,
      category: 'General Parts',
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const qtyChange = adjustType === 'in' ? Number(adjustQty) : -Number(adjustQty);
    adjustStock(selectedItem.id, qtyChange, adjustReason);
    setIsStockAdjustOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" /> Inventory & Spare Parts ({inventory.length})
          </h1>
          <p className="text-xs text-slate-500">Track raw materials, equipment, low-stock threshold alerts, & job usage</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-all active:scale-95"
          >
            <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Import CSV
          </button>
          <button
            onClick={() => setIsAddItemOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Inventory Item
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <Search className="w-4 h-4 absolute left-6 top-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by part name, SKU code, category..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium focus:outline-none"
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Part Name & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Current Stock</th>
                <th className="p-3.5">Cost Price</th>
                <th className="p-3.5">Selling Price</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => {
                const isLow = item.currentStock <= item.minStock;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-semibold">{item.category}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${isLow ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'}`}>
                          {item.currentStock} {item.unit}
                        </span>
                        {isLow && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-600">
                      {currentBusiness.currency}{item.purchasePrice}
                    </td>
                    <td className="p-3.5 font-extrabold text-slate-900 dark:text-slate-100">
                      {currentBusiness.currency}{item.sellingPrice}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsStockAdjustOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition-colors"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {isStockAdjustOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Adjust Stock</h3>
                <p className="text-xs text-slate-500">{selectedItem.name} (Current: {selectedItem.currentStock} {selectedItem.unit})</p>
              </div>
              <button type="button" onClick={() => setIsStockAdjustOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('in')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 border ${
                      adjustType === 'in' ? 'bg-emerald-600 text-white' : 'bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Stock In (Add)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('out')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1 border ${
                      adjustType === 'out' ? 'bg-rose-600 text-white' : 'bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Stock Out (Remove)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Quantity ({selectedItem.unit})</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Reason / Reference Note</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. PO-892, Damaged part, Physical audit"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsStockAdjustOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md">
                Save Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddItem}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Add Inventory Material</h3>
              <button type="button" onClick={() => setIsAddItemOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold block mb-1">Item / Part Name *</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. 12V 5A Power Adapter"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">SKU Code</label>
                <input
                  type="text"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  placeholder="PWR-12V-5A"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="pcs, meters, rolls"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Initial Stock</label>
                <input
                  type="number"
                  value={newItem.currentStock}
                  onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Min Stock Alert Level</label>
                <input
                  type="number"
                  value={newItem.minStock}
                  onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Purchase Price ({currentBusiness.currency})</label>
                <input
                  type="number"
                  value={newItem.purchasePrice}
                  onChange={(e) => setNewItem({ ...newItem, purchasePrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Selling Price ({currentBusiness.currency})</label>
                <input
                  type="number"
                  value={newItem.sellingPrice}
                  onChange={(e) => setNewItem({ ...newItem, sellingPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsAddItemOpen(false)} className="px-4 py-2 rounded-xl border text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md">
                Create Inventory Item
              </button>
            </div>
          </form>
        </div>
      )}
      {/* CSV Import Modal */}
      <CsvImportModal<InventoryItem>
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Inventory & Parts from CSV"
        description="Upload your stock inventory spreadsheet to bulk import items into Serviflow"
        fields={inventoryCsvFields}
        sampleFileName="serviflow_inventory_sample.csv"
        sampleHeaders={[
          'Item Name',
          'SKU Code',
          'Category',
          'Unit',
          'Initial Stock',
          'Min Alert Stock',
          'Purchase Cost Price',
          'Selling Unit Price',
        ]}
        sampleDataRow={[
          'Compressor Motor 1.5 HP',
          'SKU-COMP-001',
          'AC Spare Parts',
          'pcs',
          '15',
          '5',
          '4200',
          '5800',
        ]}
        onImport={handleBatchImportInventory}
      />
    </div>
  );
};
