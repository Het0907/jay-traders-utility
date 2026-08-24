import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search,
  Trash2,
  Tag,
  Layers,
  RefreshCw,
  AlertCircle,
  Pencil,
  Plus,
  Upload,
  Link as LinkIcon,
  X,
  CheckCircle,
  Eye
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProductExplorer({ apiBaseUrl }) {
  const [products, setProducts]                 = useState([]);
  const [categories, setCategories]             = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [selectedSubcatFilter, setSelectedSubcatFilter] = useState('');

  // Edit Product Modal State
  const [showEditModal, setShowEditModal]       = useState(false);
  const [savingEdit, setSavingEdit]             = useState(false);
  const [editImageTab, setEditImageTab]         = useState('upload');
  const [editProduct, setEditProduct]           = useState({
    _id: '',
    brand: '',
    name: '',
    category: '',
    description: '',
    features: [''],
    image: '',
    price: 0
  });

  useEffect(() => {
    fetchData();
  }, [apiBaseUrl]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/products`),
        axios.get(`${apiBaseUrl}/api/categories`)
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Error fetching explorer data:', err);
      toast.error(`Cannot connect to Backend API (${apiBaseUrl}). Make sure your backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await axios.delete(`${apiBaseUrl}/api/products/${id}`);
      toast.success(`Deleted "${name}"`);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete product');
    }
  };

  const openEditModal = (prod) => {
    setEditProduct({
      _id: prod._id,
      brand: prod.brand || '',
      name: prod.name || '',
      category: prod.category?._id || prod.category || '',
      description: prod.description || '',
      features: prod.features && prod.features.length > 0 ? prod.features : [''],
      image: prod.image || '',
      price: prod.variants?.[0]?.price || 0
    });
    setEditImageTab(prod.image?.startsWith('http') ? 'link' : 'upload');
    setShowEditModal(true);
  };

  const handleEditFeatureChange = (index, val) => {
    const updated = [...editProduct.features];
    updated[index] = val;
    setEditProduct(p => ({ ...p, features: updated }));
  };

  const addEditFeature = () => {
    setEditProduct(p => ({ ...p, features: [...p.features, ''] }));
  };

  const removeEditFeature = (index) => {
    if (editProduct.features.length <= 1) {
      setEditProduct(p => ({ ...p, features: [''] }));
      return;
    }
    setEditProduct(p => ({ ...p, features: editProduct.features.filter((_, i) => i !== index) }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('File must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditProduct(p => ({ ...p, image: reader.result }));
      toast.success('Image loaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editProduct.brand.trim()) { toast.error('Brand name is required'); return; }
    if (!editProduct.name.trim())  { toast.error('Subcategory name is required'); return; }
    setSavingEdit(true);

    try {
      const payload = {
        brand: editProduct.brand.trim(),
        name: editProduct.name.trim(),
        category: editProduct.category,
        description: editProduct.description.trim(),
        features: editProduct.features.map(f => f.trim()).filter(f => f !== ''),
        image: editProduct.image,
      };

      const res = await axios.put(`${apiBaseUrl}/api/products/${editProduct._id}`, payload);
      toast.success(`Brand "${editProduct.brand}" updated successfully!`);
      setShowEditModal(false);

      // Update in local state
      setProducts(prev => prev.map(p => {
        if (p._id === editProduct._id) {
          const updatedCat = categories.find(c => c._id === editProduct.category) || p.category;
          return { ...p, ...payload, category: updatedCat };
        }
        return p;
      }));
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSavingEdit(false);
    }
  };

  // Get distinct subcategories for current filter
  const availableSubcats = Array.from(new Set(
    products
      .filter(p => !selectedCatFilter || (p.category?._id === selectedCatFilter || p.category === selectedCatFilter))
      .map(p => (p.name || '').trim())
      .filter(Boolean)
  ));

  // Filter products by search, category, and subcategory
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const prodCatId = product.category?._id || product.category;
    const matchesCat = selectedCatFilter ? prodCatId === selectedCatFilter : true;
    const matchesSubcat = selectedSubcatFilter ? (product.name || '').trim().toLowerCase() === selectedSubcatFilter.toLowerCase() : true;

    return matchesSearch && matchesCat && matchesSubcat;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Catalog Explorer</h2>
          <p className="text-xs text-gray-500 mt-1">Browse, search, edit, and delete products across Category → Subcategory → Brand</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Brand or Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs outline-none focus:bg-white focus:border-red-500 font-medium"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCatFilter}
            onChange={(e) => {
              setSelectedCatFilter(e.target.value);
              setSelectedSubcatFilter('');
            }}
            className="bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-xs outline-none focus:bg-white focus:border-red-500 font-semibold"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.filter(c => !c.parentCategory).map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {/* Subcategory Filter */}
          {availableSubcats.length > 0 && (
            <select
              value={selectedSubcatFilter}
              onChange={(e) => setSelectedSubcatFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-xs outline-none focus:bg-white focus:border-red-500 font-semibold"
            >
              <option value="">All Subcategories ({availableSubcats.length})</option>
              {availableSubcats.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          )}

          <button
            onClick={fetchData}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Summary Counter */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-2 font-medium">
        <span>
          Showing <strong className="text-gray-900 font-bold">{filteredProducts.length}</strong> product{filteredProducts.length === 1 ? '' : 's'}
        </span>
        {(selectedCatFilter || selectedSubcatFilter || searchQuery) && (
          <button
            onClick={() => {
              setSelectedCatFilter('');
              setSelectedSubcatFilter('');
              setSearchQuery('');
            }}
            className="text-red-600 hover:underline font-bold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Product List Cards */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <div className="animate-spin h-8 w-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Fetching products from database...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 space-y-3">
          <AlertCircle className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-700">No Products Found</h3>
          <p className="text-xs text-gray-400">Try adjusting your search filters or add a new product in the wizard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <div key={prod._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
              <div>
                {/* Category Badge & Action Buttons */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full truncate max-w-[180px]">
                    {prod.category?.name || 'Uncategorized'}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      title="Edit Product"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod._id, prod.brand || prod.name)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {prod.image ? (
                  <div className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden mb-3">
                    <img src={prod.image} alt={prod.brand || prod.name} className="w-full h-full object-contain p-2" />
                  </div>
                ) : (
                  <div className="w-full h-24 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-3xl opacity-20 mb-3">
                    📦
                  </div>
                )}

                {/* Brand Title */}
                <h3 className="text-xl font-bold text-gray-900">{prod.brand}</h3>
                <p className="text-xs text-red-600 font-bold mt-0.5">{prod.name}</p>

                {/* Bullet Points / Features */}
                {prod.features && prod.features.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    {prod.features.slice(0, 3).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center text-[11px] text-gray-600 gap-1.5">
                        <span className="text-red-500 font-bold">•</span>
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                    {prod.features.length > 3 && (
                      <span className="text-[10px] text-gray-400 font-semibold block pt-0.5">
                        +{prod.features.length - 3} more specifications
                      </span>
                    )}
                  </div>
                ) : prod.description ? (
                  <p className="text-xs text-gray-600 mt-3 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                ) : null}
              </div>

              {/* Action bar */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>{prod.features?.length || 0} specs</span>
                <button
                  onClick={() => openEditModal(prod)}
                  className="font-bold text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          EDIT PRODUCT MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-red-600" />
                <h3 className="text-xl font-black text-gray-900">Edit Product / Brand</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Main Category *</label>
                <select
                  value={editProduct.category}
                  onChange={e => setEditProduct(p => ({ ...p, category: e.target.value }))}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-red-500"
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => !c.parentCategory).map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand & Subcategory */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={editProduct.brand}
                    onChange={e => setEditProduct(p => ({ ...p, brand: e.target.value }))}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Product Sub-category *</label>
                  <input
                    type="text"
                    value={editProduct.name}
                    onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Bullet Points / Features */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Specifications / Bullet Points
                  </label>
                  <button
                    type="button"
                    onClick={addEditFeature}
                    className="text-xs text-red-600 font-bold inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Point</span>
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editProduct.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-none w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={feat}
                        onChange={e => handleEditFeatureChange(idx, e.target.value)}
                        placeholder="Bullet point / specification..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-red-500"
                      />
                      {editProduct.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditFeature(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Detailed Description</label>
                <textarea
                  rows="2"
                  value={editProduct.description}
                  onChange={e => setEditProduct(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-red-500"
                />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Product Photo</label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditImageTab('upload')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg ${editImageTab === 'upload' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditImageTab('link')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg ${editImageTab === 'link' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {editImageTab === 'upload' ? (
                  <div>
                    <input type="file" accept="image/*" onChange={handleFileUpload} id="explorer-edit-img-upload" className="hidden" />
                    <label htmlFor="explorer-edit-img-upload" className="cursor-pointer flex items-center justify-center p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-400 bg-gray-50 text-xs font-bold text-gray-700">
                      <Upload className="h-4 w-4 mr-2 text-red-600" />
                      Choose New Image from Device
                    </label>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editProduct.image}
                    onChange={e => setEditProduct(p => ({ ...p, image: e.target.value }))}
                    placeholder="https://example.com/product.jpg"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500"
                  />
                )}

                {editProduct.image && (
                  <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <img src={editProduct.image} alt="Preview" className="h-10 w-10 object-contain rounded-lg bg-white border border-gray-100 p-0.5" />
                    <span className="text-xs text-gray-500 truncate flex-1">Image attached</span>
                    <button type="button" onClick={() => setEditProduct(p => ({ ...p, image: '' }))} className="p-1 text-gray-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md disabled:opacity-60"
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
