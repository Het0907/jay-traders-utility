import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FolderPlus,
  PackagePlus,
  Sparkles,
  CheckCircle,
  Eye,
  Upload,
  Link as LinkIcon,
  X,
  ChevronRight,
  Grid,
  Tag,
  Camera,
  ListFilter,
  PlusCircle,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import { toast } from "react-toastify";

const STEP_LABELS = [
  { num: 1, icon: Grid,   label: "Main Category",        sub: "Engineering Hardware, Pharma, IBR..." },
  { num: 2, icon: Tag,    label: "Product Sub-category", sub: "Welding Rods, Abrasives, Cutting Discs..." },
  { num: 3, icon: Camera, label: "Brand & Image",        sub: "Brand name, photo, description" },
];

export default function AddProductWizard({ apiBaseUrl, onProductAdded }) {
  const [categories, setCategories]           = useState([]);
  const [loadingCats, setLoadingCats]         = useState(false);
  const [existingSubcats, setExistingSubcats] = useState([]);
  const [loadingSubcats, setLoadingSubcats]   = useState(false);
  const [subcatMode, setSubcatMode]           = useState("select"); // 'select' or 'new'
  const [submitting, setSubmitting]           = useState(false);
  const [imageTab, setImageTab]               = useState("upload");
  const [step, setStep]                       = useState(1);

  // Category Modals State
  const [showNewCatModal, setShowNewCatModal]   = useState(false);
  const [newCatData, setNewCatData]             = useState({ name: "", slug: "", description: "", parentCategory: "" });
  const [showEditCatModal, setShowEditCatModal] = useState(false);
  const [editCatData, setEditCatData]           = useState({ _id: "", name: "", slug: "", description: "" });

  // Subcategory Modals State
  const [showEditSubcatModal, setShowEditSubcatModal] = useState(false);
  const [editSubcatData, setEditSubcatData]           = useState({ oldName: "", newName: "" });

  // Brands under currently selected subcategory (for Step 3)
  const [currentBrands, setCurrentBrands]             = useState([]);
  const [loadingBrands, setLoadingBrands]             = useState(false);

  // Edit Product / Brand Modal State
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editProductData, setEditProductData]           = useState({
    _id: "",
    brand: "",
    name: "",
    category: "",
    brandDescription: "",
    features: [""],
    image: ""
  });
  const [editProductImageTab, setEditProductImageTab]   = useState("upload");
  const [savingEditProduct, setSavingEditProduct]       = useState(false);

  const [form, setForm] = useState({
    category: "",
    name: "",
    slug: "",
    subcatDescription: "",
    brand: "",
    brandDescription: "",
    features: [""],
    image: "",
  });

  useEffect(() => { 
    fetchCategories(); 
  }, [apiBaseUrl]);

  // When selected category changes, fetch all existing subcategories for it
  useEffect(() => {
    if (form.category) {
      fetchExistingSubcategories(form.category);
    } else {
      setExistingSubcats([]);
      setCurrentBrands([]);
    }
  }, [form.category, apiBaseUrl]);

  // When subcategory name changes and we are in step 3, fetch brands under it
  useEffect(() => {
    if (form.category && form.name) {
      fetchBrandsForSubcat(form.category, form.name);
    } else {
      setCurrentBrands([]);
    }
  }, [form.category, form.name, apiBaseUrl]);

  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await axios.get(`${apiBaseUrl}/api/categories`);
      setCategories(res.data || []);
    } catch {
      toast.error(`Cannot reach backend at ${apiBaseUrl}. Is the server running?`);
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchExistingSubcategories = async (categoryId) => {
    try {
      setLoadingSubcats(true);
      const selectedCat = categories.find(c => c._id === categoryId);
      const catParam = selectedCat?.slug || categoryId;

      // 1. Fetch products to get all used subcategory names
      const prodRes = await axios.get(`${apiBaseUrl}/api/products`, {
        params: { category: catParam }
      });
      const prods = prodRes.data || [];

      // Group products by subcategory name and count brands
      const subcatMap = {};
      prods.forEach(p => {
        const name = (p.name || "").trim();
        if (name) {
          if (!subcatMap[name]) {
            subcatMap[name] = { name, brandCount: 0 };
          }
          subcatMap[name].brandCount += 1;
        }
      });

      // 2. Also include any child categories in DB
      const childCategories = categories.filter(c => c.parentCategory === categoryId);
      childCategories.forEach(c => {
        if (!subcatMap[c.name]) {
          subcatMap[c.name] = { name: c.name, brandCount: 0 };
        }
      });

      const subcatList = Object.values(subcatMap);
      setExistingSubcats(subcatList);

      if (subcatList.length > 0) {
        setSubcatMode("select");
      } else {
        setSubcatMode("new");
      }
    } catch (err) {
      console.error("Failed to load subcategories:", err);
    } finally {
      setLoadingSubcats(false);
    }
  };

  const fetchBrandsForSubcat = async (categoryId, subcatName) => {
    try {
      setLoadingBrands(true);
      const selectedCat = categories.find(c => c._id === categoryId);
      const catParam = selectedCat?.slug || categoryId;

      const prodRes = await axios.get(`${apiBaseUrl}/api/products`, {
        params: { category: catParam }
      });
      const prods = prodRes.data || [];
      const matching = prods.filter(p => (p.name || "").trim().toLowerCase() === subcatName.trim().toLowerCase());
      setCurrentBrands(matching);
    } catch (err) {
      console.error("Failed to load brands:", err);
    } finally {
      setLoadingBrands(false);
    }
  };

  const makeSlug = (text) =>
    text.toLowerCase().trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleFeatureChange = (index, val) => {
    const updated = [...form.features];
    updated[index] = val;
    setForm(p => ({ ...p, features: updated }));
  };

  const addFeature = () => {
    setForm(p => ({ ...p, features: [...p.features, ""] }));
  };

  const removeFeature = (index) => {
    if (form.features.length <= 1) {
      setForm(p => ({ ...p, features: [""] }));
      return;
    }
    setForm(p => ({ ...p, features: form.features.filter((_, i) => i !== index) }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("File must be under 5 MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => { set("image", reader.result); toast.success("Image loaded!"); };
    reader.readAsDataURL(file);
  };

  const handleEditProductFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("File must be under 5 MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => { 
      setEditProductData(p => ({ ...p, image: reader.result })); 
      toast.success("Image loaded!"); 
    };
    reader.readAsDataURL(file);
  };

  const canGoStep2 = form.category.trim() !== "";
  const canGoStep3 = form.name.trim() !== "";
  const canSubmit  = form.brand.trim() !== "";

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY ACTIONS (CREATE, EDIT, DELETE)
  // ═══════════════════════════════════════════════════════════════
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatData.name) { toast.error("Name required"); return; }
    try {
      const res = await axios.post(`${apiBaseUrl}/api/categories`, {
        name:           newCatData.name,
        slug:           newCatData.slug || makeSlug(newCatData.name),
        description:    newCatData.description || `${newCatData.name} products`,
        parentCategory: newCatData.parentCategory || null,
        isMainCategory: !newCatData.parentCategory,
      });
      toast.success(`Category "${res.data.name}" created!`);
      setShowNewCatModal(false);
      setNewCatData({ name: "", slug: "", description: "", parentCategory: "" });
      await fetchCategories();
      set("category", res.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create category");
    }
  };

  const openEditCategory = (cat, e) => {
    if (e) e.stopPropagation();
    setEditCatData({
      _id: cat._id,
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || ""
    });
    setShowEditCatModal(true);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editCatData.name) { toast.error("Name required"); return; }
    try {
      const res = await axios.put(`${apiBaseUrl}/api/categories/${editCatData._id}`, {
        name: editCatData.name.trim(),
        slug: editCatData.slug.trim() || makeSlug(editCatData.name),
        description: editCatData.description.trim()
      });
      toast.success(`Category "${res.data.name}" updated!`);
      setShowEditCatModal(false);
      await fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (cat, e) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete category "${cat.name}"?\n\nWARNING: All subcategories and brand products belonging to this category will also be deleted!`
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${apiBaseUrl}/api/categories/${cat._id}`);
      toast.success(`Category "${cat.name}" deleted!`);
      if (form.category === cat._id) {
        set("category", "");
        set("name", "");
        setStep(1);
      }
      await fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SUBCATEGORY ACTIONS (EDIT / RENAME, DELETE)
  // ═══════════════════════════════════════════════════════════════
  const openEditSubcategory = (sub, e) => {
    if (e) e.stopPropagation();
    setEditSubcatData({
      oldName: sub.name,
      newName: sub.name
    });
    setShowEditSubcatModal(true);
  };

  const handleUpdateSubcategory = async (e) => {
    e.preventDefault();
    if (!editSubcatData.newName.trim()) { toast.error("Subcategory name is required"); return; }
    try {
      await axios.put(`${apiBaseUrl}/api/categories/subcategories/rename`, {
        categoryId: form.category,
        oldName: editSubcatData.oldName,
        newName: editSubcatData.newName.trim()
      });
      toast.success(`Subcategory renamed to "${editSubcatData.newName}"!`);
      setShowEditSubcatModal(false);

      if (form.name === editSubcatData.oldName) {
        set("name", editSubcatData.newName.trim());
      }
      await fetchExistingSubcategories(form.category);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename subcategory");
    }
  };

  const handleDeleteSubcategory = async (sub, e) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete subcategory "${sub.name}"?\n\nWARNING: All ${sub.brandCount} brand products under "${sub.name}" will be deleted!`
    );
    if (!confirmed) return;

    try {
      await axios.post(`${apiBaseUrl}/api/categories/subcategories/delete`, {
        categoryId: form.category,
        subcategoryName: sub.name
      });
      toast.success(`Subcategory "${sub.name}" deleted!`);
      if (form.name === sub.name) {
        set("name", "");
      }
      await fetchExistingSubcategories(form.category);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete subcategory");
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // BRAND / PRODUCT ACTIONS (ADD, EDIT, DELETE)
  // ═══════════════════════════════════════════════════════════════
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) { toast.error("Brand name is required"); return; }
    setSubmitting(true);
    try {
      const baseSlug = makeSlug(`${form.name}-${form.brand}-${Date.now().toString().slice(-4)}`);
      const payload = {
        category:       form.category,
        name:           form.name.trim(),
        slug:           baseSlug,
        description:    form.brandDescription.trim(),
        brand:          form.brand.trim(),
        image:          form.image,
        features:       form.features.map(f => f.trim()).filter(f => f !== ""),
        specifications: { material: "", type: form.subcatDescription, finish: "" },
        variants:       [{ size: "Standard", price: 0, stock: 100 }],
      };
      await axios.post(`${apiBaseUrl}/api/products`, payload);
      toast.success(`Brand "${form.brand}" saved under "${form.name}"!`);
      
      // Refresh subcategories count and current brands
      fetchExistingSubcategories(form.category);
      fetchBrandsForSubcat(form.category, form.name);

      // Keep subcategory so user can quickly add another brand under same subcategory
      setForm(p => ({
        ...p,
        brand: "",
        brandDescription: "",
        features: [""],
        image: ""
      }));
      
      if (onProductAdded) onProductAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save brand");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditProduct = (prod) => {
    setEditProductData({
      _id: prod._id,
      brand: prod.brand || "",
      name: prod.name || form.name,
      category: prod.category?._id || prod.category || form.category,
      brandDescription: prod.description || "",
      features: prod.features && prod.features.length > 0 ? prod.features : [""],
      image: prod.image || ""
    });
    setEditProductImageTab(prod.image?.startsWith("http") ? "link" : "upload");
    setShowEditProductModal(true);
  };

  const handleEditProductFeatureChange = (index, val) => {
    const updated = [...editProductData.features];
    updated[index] = val;
    setEditProductData(p => ({ ...p, features: updated }));
  };

  const addEditProductFeature = () => {
    setEditProductData(p => ({ ...p, features: [...p.features, ""] }));
  };

  const removeEditProductFeature = (index) => {
    if (editProductData.features.length <= 1) {
      setEditProductData(p => ({ ...p, features: [""] }));
      return;
    }
    setEditProductData(p => ({ ...p, features: editProductData.features.filter((_, i) => i !== index) }));
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editProductData.brand.trim()) { toast.error("Brand name is required"); return; }
    setSavingEditProduct(true);
    try {
      await axios.put(`${apiBaseUrl}/api/products/${editProductData._id}`, {
        brand: editProductData.brand.trim(),
        name: editProductData.name.trim(),
        category: editProductData.category,
        description: editProductData.brandDescription.trim(),
        features: editProductData.features.map(f => f.trim()).filter(f => f !== ""),
        image: editProductData.image
      });
      toast.success(`Brand "${editProductData.brand}" updated successfully!`);
      setShowEditProductModal(false);
      fetchBrandsForSubcat(form.category, form.name);
      fetchExistingSubcategories(form.category);
      if (onProductAdded) onProductAdded();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update brand");
    } finally {
      setSavingEditProduct(false);
    }
  };

  const handleDeleteProduct = async (prodId, prodName) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${prodName}"?`);
    if (!confirmed) return;

    try {
      await axios.delete(`${apiBaseUrl}/api/products/${prodId}`);
      toast.success(`Deleted "${prodName}"`);
      fetchBrandsForSubcat(form.category, form.name);
      fetchExistingSubcategories(form.category);
      if (onProductAdded) onProductAdded();
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span>Category → Sub-category → Brand Management</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Catalog Management</h1>
          <p className="mt-2 text-red-100 max-w-xl text-sm leading-relaxed">
            Create, edit, or delete categories, sub-categories, and brand products with live store preview.
          </p>
        </div>
        <button
          onClick={() => setShowNewCatModal(true)}
          className="inline-flex items-center space-x-2 bg-white text-red-600 hover:bg-red-50 font-bold px-5 py-3 rounded-2xl shadow-lg hover:scale-105 transition-all duration-200"
        >
          <FolderPlus className="h-5 w-5" />
          <span>+ New Category</span>
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((s, i) => {
          const done    = step > s.num;
          const current = step === s.num;
          const Icon    = s.icon;
          return (
            <React.Fragment key={s.num}>
              <button
                onClick={() => { if (done || current) setStep(s.num); }}
                className={`flex-1 flex flex-col items-center py-4 px-3 rounded-2xl transition-all text-center
                  ${current ? "bg-red-600 text-white shadow-lg" : done ? "bg-red-50 text-red-600 cursor-pointer" : "bg-gray-50 text-gray-400 cursor-default"}`}
              >
                <div className={`p-2 rounded-xl mb-1 ${current ? "bg-white/20" : done ? "bg-red-100" : "bg-gray-100"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wide">{s.label}</span>
                <span className={`text-[10px] mt-0.5 hidden sm:block ${current ? "text-red-100" : "opacity-60"}`}>{s.sub}</span>
              </button>
              {i < STEP_LABELS.length - 1 && (
                <ChevronRight className={`h-5 w-5 flex-none mx-1 ${step > s.num ? "text-red-400" : "text-gray-200"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Main content: form + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* ═══ STEP 1: MAIN CATEGORY ═══ */}
          {step === 1 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Step 1: Select Main Category</h2>
                  <p className="text-sm text-gray-500 mt-1">Select a category or use the Edit/Delete actions on each item.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewCatModal(true)}
                  className="text-xs text-red-600 bg-red-50 hover:bg-red-100 font-bold px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Category</span>
                </button>
              </div>

              {loadingCats ? (
                <div className="text-center py-10 text-sm text-gray-400">Loading categories...</div>
              ) : (
                <div className="space-y-3">
                  {categories.filter(c => !c.parentCategory).map(cat => {
                    const isSelected = form.category === cat._id;
                    return (
                      <div
                        key={cat._id}
                        onClick={() => set("category", cat._id)}
                        className={`group relative w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-red-500 bg-red-50/80 shadow-sm"
                            : "border-gray-100 bg-gray-50/60 hover:border-red-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-black ${isSelected ? "text-red-700" : "text-gray-900"}`}>
                              {cat.name}
                            </span>
                            {isSelected && <CheckCircle className="h-4 w-4 text-red-600 flex-none" />}
                          </div>
                          {cat.description && (
                            <span className="block text-xs font-normal text-gray-500 mt-1 line-clamp-1">{cat.description}</span>
                          )}
                        </div>

                        {/* Action buttons (Edit & Delete) */}
                        <div className="flex items-center space-x-1.5 flex-none">
                          <button
                            type="button"
                            onClick={(e) => openEditCategory(cat, e)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-white transition-all shadow-xs"
                            title="Edit Category"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCategory(cat, e)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-white transition-all shadow-xs"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {categories.filter(c => !c.parentCategory).length === 0 && (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                      <p className="text-sm font-semibold text-gray-500">No main categories found.</p>
                      <button
                        type="button"
                        onClick={() => setShowNewCatModal(true)}
                        className="text-xs text-red-600 font-bold hover:underline"
                      >
                        + Create your first category
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => { if (canGoStep2) setStep(2); else toast.error("Please select a category first"); }}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:from-red-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
              >
                <span>Next: Product Sub-category</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* ════ STEP 2: PRODUCT SUB-CATEGORY (DROPDOWN OR CREATE NEW) ════ */}
          {step === 2 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Step 2: Product Sub-category</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Under <span className="font-bold text-gray-800">{categories.find(c => c._id === form.category)?.name || "Category"}</span> (Flashcard on site)
                  </p>
                </div>

                {/* Switch between Existing vs New */}
                <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSubcatMode("select")}
                    disabled={existingSubcats.length === 0}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      subcatMode === "select"
                        ? "bg-white text-red-600 shadow-sm"
                        : existingSubcats.length === 0
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <ListFilter className="h-3.5 w-3.5" />
                    <span>Existing ({existingSubcats.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubcatMode("new");
                      set("name", "");
                    }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      subcatMode === "new"
                        ? "bg-white text-red-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>+ New Sub-category</span>
                  </button>
                </div>
              </div>

              {/* Mode A: Select from Existing Subcategories */}
              {subcatMode === "select" && existingSubcats.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Choose or Manage Existing Sub-category *
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">Use icons on cards to Rename or Delete</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {existingSubcats.map((sub) => {
                      const isSelected = form.name.toLowerCase() === sub.name.toLowerCase();
                      return (
                        <div
                          key={sub.name}
                          onClick={() => set("name", sub.name)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                              : "border-gray-100 bg-gray-50 text-gray-700 hover:border-red-200"
                          }`}
                        >
                          <div className="flex-1 pr-2 min-w-0">
                            <span className="text-sm font-bold block truncate">{sub.name}</span>
                            <span className="text-[11px] text-gray-400 font-normal">
                              {sub.brandCount} brand{sub.brandCount === 1 ? "" : "s"} added
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 flex-none">
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-red-600 mr-1" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => openEditSubcategory(sub, e)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition-colors"
                              title="Rename Subcategory"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSubcategory(sub, e)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition-colors"
                              title="Delete Subcategory"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSubcatMode("new");
                        set("name", "");
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Don't see your sub-category? Create a new one</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode B: Add New Sub-category */}
              {subcatMode === "new" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      New Sub-category Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Welding Rods, Abrasives, Cutting Discs, Ball Valves..."
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: makeSlug(e.target.value) }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all font-semibold"
                    />
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      This creates a new category flashcard on the site under <strong className="text-gray-600">{categories.find(c => c._id === form.category)?.name || "Category"}</strong>.
                    </p>
                  </div>

                  {existingSubcats.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSubcatMode("select")}
                      className="text-xs text-gray-500 hover:text-red-600 font-semibold"
                    >
                      ← Back to existing sub-categories
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl transition-colors">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => { if (canGoStep3) setStep(3); else toast.error("Please select or enter a sub-category name"); }}
                  className="flex-[2] bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-3.5 rounded-2xl shadow-xl hover:from-red-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>Next: Add Brand & Image</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 3: BRAND & IMAGE (ADD MULTIPLE BRANDS UNDER THIS SUB-CATEGORY) ════ */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Existing Brands under this subcategory */}
              {currentBrands.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                        Existing Brands in "{form.name}" ({currentBrands.length})
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Quickly edit or delete brands already saved under this sub-category</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentBrands.map((prod) => (
                      <div key={prod._id} className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-2xl flex items-center justify-between gap-3 hover:bg-gray-100/70 transition-colors">
                        <div className="flex items-center space-x-3 min-w-0">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.brand} className="h-10 w-10 object-contain rounded-xl bg-white border border-gray-200 p-0.5 flex-none" />
                          ) : (
                            <div className="h-10 w-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-base flex-none">
                              📦
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{prod.brand}</h4>
                            <span className="text-[11px] text-gray-400 block">
                              {prod.features?.length || 0} bullet point{(prod.features?.length === 1) ? "" : "s"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 flex-none">
                          <button
                            type="button"
                            onClick={() => openEditProduct(prod)}
                            className="p-2 bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl transition-colors shadow-xs"
                            title="Edit Brand Details"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod._id, prod.brand)}
                            className="p-2 bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl transition-colors shadow-xs"
                            title="Delete Brand"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Brand Form */}
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6">
                <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Step 3: Add Brand Details</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Adding brand under: <span className="font-bold text-red-600">{form.name}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl font-semibold transition-colors"
                  >
                    Change Sub-category
                  </button>
                </div>

                {/* Brand name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mangalam, Superon, Taparia, Ador, Totem, Jay Traders"
                    value={form.brand}
                    onChange={e => set("brand", e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                  />
                </div>

                {/* Bullet Points / Specifications List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Key Points / Specifications (Bullet List)
                      </label>
                      <p className="text-[11px] text-gray-400">Add sizes, packaging, materials, or features as separate points</p>
                    </div>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-xs text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Point</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {form.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-none w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <input
                          type="text"
                          placeholder={
                            idx === 0 ? "e.g. Size: 2.50 X 350 MM" :
                            idx === 1 ? "e.g. Pack of 1 (20 rods)" :
                            idx === 2 ? "e.g. Material: 316L Stainless Steel" :
                            "e.g. High tensile strength"
                          }
                          value={feat}
                          onChange={e => handleFeatureChange(idx, e.target.value)}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:bg-white focus:border-red-500 outline-none transition-all font-medium"
                        />
                        {form.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(idx)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove point"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Detailed Description <span className="font-normal text-gray-400">(optional paragraph text)</span>
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Additional product details, applications, and certifications..."
                    value={form.brandDescription}
                    onChange={e => set("brandDescription", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                  />
                </div>

                {/* Image upload / URL */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Product Photo</label>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      {[["upload", Upload, "Upload Device"], ["link", LinkIcon, "Image URL"]].map(([id, Icon, lbl]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setImageTab(id)}
                          className={`flex items-center space-x-1 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                            imageTab === id ? "bg-white text-red-600 shadow-sm" : "text-gray-500"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{lbl}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {imageTab === "upload" ? (
                    <div className="border-2 border-dashed border-gray-200 hover:border-red-400 bg-gray-50/50 rounded-2xl p-6 text-center transition-colors">
                      <input type="file" accept="image/*" onChange={handleFileUpload} id="img-upload" className="hidden" />
                      <label htmlFor="img-upload" className="cursor-pointer flex flex-col items-center space-y-2">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Upload className="h-6 w-6" /></div>
                        <span className="text-sm font-bold text-gray-800">Click to select photo from device</span>
                        <span className="text-xs text-gray-400">PNG, JPG, WEBP (stored in MongoDB)</span>
                      </label>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="https://example.com/product.jpg"
                      value={form.image}
                      onChange={e => set("image", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                    />
                  )}

                  {form.image && (
                    <div className="flex items-center space-x-4 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                      <img src={form.image} alt="Preview" className="h-14 w-14 object-contain rounded-xl bg-white border border-gray-100 p-1" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-gray-700 block">Image ready</span>
                        <span className="text-[11px] text-gray-400 truncate block">
                          {form.image.startsWith("data:") ? "Local file Base64" : form.image}
                        </span>
                      </div>
                      <button type="button" onClick={() => set("image", "")} className="p-2 text-gray-400 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl transition-colors">
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !canSubmit}
                    className="flex-[2] bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:from-red-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span>Saving Brand...</span>
                    ) : (
                      <>
                        <PackagePlus className="h-5 w-5" />
                        <span>Save Brand to Database</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-800">
                  <p className="font-bold">Tip for adding multiple brands:</p>
                  <p className="mt-0.5 text-amber-700">
                    After clicking "Save Brand", you remain on this step with "{form.name}" selected. Just type the next brand name, add its points, and save!
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Live Preview Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24 space-y-5">
            <div className="flex items-center space-x-2 text-gray-900 border-b border-gray-100 pb-4">
              <Eye className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-lg">Live Store Card Preview</h3>
            </div>

            {/* Flashcard preview */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Category Flashcard (Level 2)</p>
              <div className="relative flex items-center justify-center bg-white border-2 border-gray-100 rounded-2xl px-5 py-8 min-h-[90px] overflow-hidden shadow-sm">
                <span className="absolute top-2 right-3 text-[10px] font-bold text-gray-200">01</span>
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-t-2xl" />
                <p className="text-base font-black text-gray-800 text-center">
                  {form.name || <span className="text-gray-300">Sub-category name</span>}
                </p>
              </div>
            </div>

            {/* Brand card preview */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">Brand Card (Level 3 - Fixed 380px)</p>
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col" style={{ height: "340px" }}>
                <div className="flex-none h-32 bg-gray-50 border-b border-gray-100 overflow-hidden">
                  {form.image ? (
                    <img src={form.image} alt="preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl opacity-20">📦</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1 p-4 min-h-0">
                  <h2 className="flex-none text-base font-black text-gray-900 line-clamp-2 mb-1">
                    {form.brand || <span className="text-gray-300">Brand name</span>}
                  </h2>
                  {form.features && form.features.filter(f => f.trim() !== "").length > 0 ? (
                    <div className="flex-1 mt-1 space-y-1 overflow-y-auto pr-1">
                      {form.features.filter(f => f.trim() !== "").map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center text-[11px] text-gray-600 gap-1">
                          <span className="text-red-500 font-bold">•</span>
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  ) : form.brandDescription ? (
                    <p className="flex-1 mt-1 text-xs text-gray-500 overflow-y-auto leading-relaxed pr-1">
                      {form.brandDescription}
                    </p>
                  ) : (
                    <p className="flex-1 text-xs text-gray-300 italic">Key points & description (scrollable)</p>
                  )}
                  <div className="flex-none pt-3 border-t border-gray-100 mt-2">
                    <span className="block w-full text-center py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-bold">
                      Request Quotation
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded-2xl border border-red-100 text-xs text-red-700 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Modal Popup Enabled
              </p>
              <p className="text-red-600/80">Clicking this brand card on the site opens a large modal with photo on the left and structured bullet points on the right.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CREATE CATEGORY MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {showNewCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-xl font-black text-gray-900">Create Main Category</h3>
              <button onClick={() => setShowNewCatModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Engineering Hardware"
                  value={newCatData.name}
                  onChange={e => setNewCatData(p => ({ ...p, name: e.target.value, slug: makeSlug(e.target.value) }))}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Slug (URL)</label>
                <input
                  type="text"
                  placeholder="engineering-hardware"
                  value={newCatData.slug}
                  onChange={e => setNewCatData(p => ({ ...p, slug: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Short category summary"
                  value={newCatData.description}
                  onChange={e => setNewCatData(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewCatModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          EDIT CATEGORY MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {showEditCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-red-600" />
                <h3 className="text-xl font-black text-gray-900">Edit Main Category</h3>
              </div>
              <button onClick={() => setShowEditCatModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Category Name *</label>
                <input
                  type="text"
                  value={editCatData.name}
                  onChange={e => setEditCatData(p => ({ ...p, name: e.target.value }))}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={editCatData.slug}
                  onChange={e => setEditCatData(p => ({ ...p, slug: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows="3"
                  value={editCatData.description}
                  onChange={e => setEditCatData(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditCatModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          EDIT SUBCATEGORY MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {showEditSubcatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-red-600" />
                <h3 className="text-xl font-black text-gray-900">Rename Sub-category</h3>
              </div>
              <button onClick={() => setShowEditSubcatModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateSubcategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Current Name</label>
                <input
                  type="text"
                  value={editSubcatData.oldName}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">New Sub-category Name *</label>
                <input
                  type="text"
                  value={editSubcatData.newName}
                  onChange={e => setEditSubcatData(p => ({ ...p, newName: e.target.value }))}
                  required
                  placeholder="e.g. Welding Rods"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-500 font-semibold"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  This will update the subcategory name on all associated brand cards automatically.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditSubcatModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md">
                  Update Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          EDIT BRAND / PRODUCT MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {showEditProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2">
                <Pencil className="h-5 w-5 text-red-600" />
                <h3 className="text-xl font-black text-gray-900">Edit Brand / Product</h3>
              </div>
              <button onClick={() => setShowEditProductModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={editProductData.brand}
                    onChange={e => setEditProductData(p => ({ ...p, brand: e.target.value }))}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Sub-category Name *</label>
                  <input
                    type="text"
                    value={editProductData.name}
                    onChange={e => setEditProductData(p => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Bullet Points / Features */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Bullet Points / Specifications
                  </label>
                  <button
                    type="button"
                    onClick={addEditProductFeature}
                    className="text-xs text-red-600 font-bold inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Point</span>
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editProductData.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-none w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={feat}
                        onChange={e => handleEditProductFeatureChange(idx, e.target.value)}
                        placeholder="Bullet point / specification..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-red-500"
                      />
                      {editProductData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditProductFeature(idx)}
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
                  value={editProductData.brandDescription}
                  onChange={e => setEditProductData(p => ({ ...p, brandDescription: e.target.value }))}
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
                      onClick={() => setEditProductImageTab("upload")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg ${editProductImageTab === "upload" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditProductImageTab("link")}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg ${editProductImageTab === "link" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {editProductImageTab === "upload" ? (
                  <div>
                    <input type="file" accept="image/*" onChange={handleEditProductFileUpload} id="edit-img-upload" className="hidden" />
                    <label htmlFor="edit-img-upload" className="cursor-pointer flex items-center justify-center p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-red-400 bg-gray-50 text-xs font-bold text-gray-700">
                      <Upload className="h-4 w-4 mr-2 text-red-600" />
                      Choose New Image from Device
                    </label>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={editProductData.image}
                    onChange={e => setEditProductData(p => ({ ...p, image: e.target.value }))}
                    placeholder="https://example.com/product.jpg"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-red-500"
                  />
                )}

                {editProductData.image && (
                  <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <img src={editProductData.image} alt="Preview" className="h-10 w-10 object-contain rounded-lg bg-white border border-gray-100 p-0.5" />
                    <span className="text-xs text-gray-500 truncate flex-1">Image attached</span>
                    <button type="button" onClick={() => setEditProductData(p => ({ ...p, image: "" }))} className="p-1 text-gray-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditProductModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditProduct}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md disabled:opacity-60"
                >
                  {savingEditProduct ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
