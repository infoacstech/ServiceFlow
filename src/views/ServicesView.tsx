import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Service, ServiceCategory } from '../types';
import { Wrench, Plus, FolderPlus, Clock, Tag, DollarSign, Edit2, Trash2, X } from 'lucide-react';

export const ServicesView: React.FC = () => {
  const {
    services,
    categories,
    addService,
    updateService,
    deleteService,
    addServiceCategory,
    currentBusiness,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [serviceFormData, setServiceFormData] = useState({
    categoryId: categories[0]?.id || '',
    name: '',
    price: 1500,
    taxPercent: 18,
    estimatedMinutes: 60,
    description: '',
  });

  const filteredServices = services.filter(
    (s) => selectedCategory === 'all' || s.categoryId === selectedCategory
  );

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    addServiceCategory(catName, catDesc);
    setIsCategoryModalOpen(false);
    setCatName('');
    setCatDesc('');
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormData.name.trim()) return;
    addService({
      categoryId: serviceFormData.categoryId || categories[0]?.id || '',
      name: serviceFormData.name,
      price: Number(serviceFormData.price),
      taxPercent: Number(serviceFormData.taxPercent),
      estimatedMinutes: Number(serviceFormData.estimatedMinutes),
      description: serviceFormData.description,
    });
    setIsServiceModalOpen(false);
    setServiceFormData({
      categoryId: categories[0]?.id || '',
      name: '',
      price: 1500,
      taxPercent: 18,
      estimatedMinutes: 60,
      description: '',
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-600" /> Service Catalog ({services.length})
          </h1>
          <p className="text-xs text-slate-500">Configure customizable service offerings, pricing, taxes, & duration</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-200 transition-all"
          >
            <FolderPlus className="w-4 h-4" /> Add Category
          </button>
          <button
            onClick={() => setIsServiceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Service
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Categories ({services.length})
        </button>
        {categories.map((cat) => {
          const count = services.filter((s) => s.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => {
          const category = categories.find((c) => c.id === service.categoryId);

          return (
            <div
              key={service.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-indigo-400 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                    {category?.name || 'Service'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteService(service.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-1">{service.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{service.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{service.estimatedMinutes} mins</span>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                    {currentBusiness.currency}{service.price}
                  </div>
                  <div className="text-[10px] text-slate-400">+ {service.taxPercent}% GST</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Creation Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCategory}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">New Category</h3>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. CCTV Installation, AC Annual Maintenance"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Category scope..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 h-20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs">
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Service Creation Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateService}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Add New Service</h3>
              <button type="button" onClick={() => setIsServiceModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Service Category</label>
                <select
                  value={serviceFormData.categoryId}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={serviceFormData.name}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                  placeholder="e.g. 4K Camera Mount & Crimping"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Base Rate ({currentBusiness.currency})</label>
                  <input
                    type="number"
                    value={serviceFormData.price}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Tax %</label>
                  <input
                    type="number"
                    value={serviceFormData.taxPercent}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, taxPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={serviceFormData.estimatedMinutes}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, estimatedMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  value={serviceFormData.description}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                  placeholder="Details of what is included..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 h-20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md">
                Save Service
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
