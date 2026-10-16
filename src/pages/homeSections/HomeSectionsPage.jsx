import { useEffect, useState } from "react";
import {
  FiPlus, FiEdit2, FiTrash2, FiArrowUp, FiArrowDown, FiImage,
  FiCheck, FiAlertCircle, FiX, FiGrid, FiLayers,
} from "react-icons/fi";
import Modal from "../../components/common/Modal";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api`;

const emptyTile = () => ({ label: '', image: '', featured: false, priceLabel: '', link: { type: 'none', value: '' } });

const emptyForm = {
  title: '',
  subtitle: '',
  type: 'product_carousel',
  theme: { bannerImage: '', backgroundColor: '', textColor: '' },
  productSource: { mode: 'manual', manualProducts: [], tag: '', maxPrice: '', minDiscountPercent: '', limit: 20 },
  tiles: [emptyTile()],
  viewAllLink: { type: 'none', value: '' },
  isActive: true,
  startDate: '',
  endDate: '',
};

const HomeSectionsPage = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [toast, setToast] = useState(null);

  const getHeaders = (json = true) => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token') || ''}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/home-sections`, { headers: getHeaders() });
      const result = await res.json();
      if (result.success) setSections(result.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPickerData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${BASE_URL}/product/get-products-admin?limit=1000`),
        fetch(`${BASE_URL}/category/getall`),
      ]);
      const productsJson = await productsRes.json();
      const categoriesJson = await categoriesRes.json();
      setProducts(productsJson.products || productsJson.data || []);
      setCategories(categoriesJson.categories || categoriesJson.data || []);

      const subRes = await fetch(`${BASE_URL}/subcategory/getall`);
      const subJson = await subRes.json();
      setSubcategories(subJson.subcategories || subJson.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchPickerData();
  }, []);

  // ==================== FORM HELPERS ====================

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors([]);
    setShowModal(true);
  };

  const openEdit = (section) => {
    setEditingId(section._id);
    setForm({
      title: section.title || '',
      subtitle: section.subtitle || '',
      type: section.type,
      theme: { bannerImage: section.theme?.bannerImage || '', backgroundColor: section.theme?.backgroundColor || '', textColor: section.theme?.textColor || '' },
      productSource: {
        mode: section.productSource?.mode || 'manual',
        manualProducts: (section.productSource?.manualProducts || []).map((p) => (typeof p === 'string' ? p : p._id)),
        tag: section.productSource?.tag || '',
        maxPrice: section.productSource?.maxPrice ?? '',
        minDiscountPercent: section.productSource?.minDiscountPercent ?? '',
        limit: section.productSource?.limit || 20,
      },
      tiles: section.tiles?.length ? section.tiles.map((t) => ({ ...t, link: t.link || { type: 'none', value: '' } })) : [emptyTile()],
      viewAllLink: section.viewAllLink || { type: 'none', value: '' },
      isActive: section.isActive,
      startDate: section.startDate ? section.startDate.slice(0, 10) : '',
      endDate: section.endDate ? section.endDate.slice(0, 10) : '',
    });
    setErrors([]);
    setShowModal(true);
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateNested = (parent, field, value) => setForm((prev) => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));

  const toggleManualProduct = (productId) => {
    setForm((prev) => {
      const list = prev.productSource.manualProducts;
      const next = list.includes(productId) ? list.filter((id) => id !== productId) : [...list, productId];
      return { ...prev, productSource: { ...prev.productSource, manualProducts: next } };
    });
  };

  const updateTile = (index, field, value) => {
    setForm((prev) => {
      const tiles = [...prev.tiles];
      tiles[index] = { ...tiles[index], [field]: value };
      return { ...prev, tiles };
    });
  };
  const updateTileLink = (index, field, value) => {
    setForm((prev) => {
      const tiles = [...prev.tiles];
      tiles[index] = { ...tiles[index], link: { ...tiles[index].link, [field]: value } };
      return { ...prev, tiles };
    });
  };
  const addTile = () => setForm((prev) => ({ ...prev, tiles: [...prev.tiles, emptyTile()] }));
  const removeTile = (index) => setForm((prev) => ({ ...prev, tiles: prev.tiles.filter((_, i) => i !== index) }));

  const uploadImage = async (file, onDone) => {
    const data = new FormData();
    data.append('image', file);
    try {
      const res = await fetch(`${BASE_URL}/admin/home-sections/upload-image`, {
        method: 'POST',
        headers: getHeaders(false),
        body: data,
      });
      const result = await res.json();
      if (result.success) onDone(result.url);
      else showToast(result.message || 'Image upload failed', 'error');
    } catch {
      showToast('Image upload failed', 'error');
    }
  };

  // ==================== SAVE / DELETE / REORDER ====================

  const validate = () => {
    const errs = [];
    if (!form.title.trim()) errs.push('Title is required');
    if (form.type === 'product_carousel') {
      const s = form.productSource;
      if (s.mode === 'manual' && !s.manualProducts.length) errs.push('Pick at least one product');
      if (s.mode === 'tag' && !s.tag.trim()) errs.push('Enter a tag');
      if (s.mode === 'maxPrice' && !s.maxPrice) errs.push('Enter a max price');
      if (s.mode === 'minDiscount' && !s.minDiscountPercent) errs.push('Enter a minimum discount %');
    } else {
      if (!form.tiles.length || form.tiles.some((t) => !t.label.trim() || !t.image)) {
        errs.push('Every tile needs a label and an image');
      }
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      type: form.type,
      theme: form.theme,
      isActive: form.isActive,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      viewAllLink: form.viewAllLink.type === 'none' ? { type: 'none', value: '' } : form.viewAllLink,
      ...(form.type === 'product_carousel'
        ? {
            productSource: {
              mode: form.productSource.mode,
              manualProducts: form.productSource.mode === 'manual' ? form.productSource.manualProducts : [],
              tag: form.productSource.mode === 'tag' ? form.productSource.tag.trim() : '',
              maxPrice: form.productSource.mode === 'maxPrice' ? Number(form.productSource.maxPrice) : null,
              minDiscountPercent: form.productSource.mode === 'minDiscount' ? Number(form.productSource.minDiscountPercent) : null,
              limit: Number(form.productSource.limit) || 20,
            },
            tiles: [],
          }
        : { tiles: form.tiles, productSource: { mode: 'manual', manualProducts: [] } }),
    };

    try {
      const url = editingId ? `${BASE_URL}/admin/home-sections/${editingId}` : `${BASE_URL}/admin/home-sections`;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        showToast(editingId ? 'Section updated' : 'Section created');
        setShowModal(false);
        fetchSections();
      } else {
        setErrors([result.message || 'Failed to save section']);
      }
    } catch {
      setErrors(['Failed to save section']);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this section? This cannot be undone.')) return;
    try {
      const res = await fetch(`${BASE_URL}/admin/home-sections/${id}`, { method: 'DELETE', headers: getHeaders() });
      const result = await res.json();
      if (result.success) {
        showToast('Section deleted');
        fetchSections();
      }
    } catch {
      showToast('Failed to delete section', 'error');
    }
  };

  const toggleActive = async (section) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/home-sections/${section._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: !section.isActive }),
      });
      const result = await res.json();
      if (result.success) fetchSections();
    } catch {
      showToast('Failed to update section', 'error');
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setSections(reordered);
    try {
      await fetch(`${BASE_URL}/admin/home-sections/reorder`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ sections: reordered.map((s, i) => ({ id: s._id, order: i })) }),
      });
    } catch {
      showToast('Failed to save order', 'error');
      fetchSections();
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400";
  const filteredProducts = products.filter((p) => p.name?.toLowerCase().includes(productSearch.toLowerCase()));

  const toggleBtn = (active, onClick, label, icon) => (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
      style={{
        backgroundColor: active ? 'black' : 'white',
        color: active ? 'white' : '#374151',
        border: active ? '1px solid black' : '1px solid #d1d5db',
      }}
    >
      {icon} {label}
    </button>
  );

  const LinkEditor = ({ value, onChange, categoryLabel = 'Category', showProduct = false }) => (
    <div className="grid grid-cols-2 gap-2">
      <select className={inputClass} value={value.type} onChange={(e) => onChange('type', e.target.value)}>
        <option value="none">No link</option>
        <option value="category">{categoryLabel}</option>
        <option value="subcategory">Subcategory</option>
        <option value="tag">Tag</option>
        {showProduct && <option value="product">Product</option>}
        <option value="url">External URL</option>
      </select>
      {value.type === 'category' && (
        <select className={inputClass} value={value.value} onChange={(e) => onChange('value', e.target.value)}>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      )}
      {value.type === 'subcategory' && (
        <select className={inputClass} value={value.value} onChange={(e) => onChange('value', e.target.value)}>
          <option value="">Select subcategory</option>
          {subcategories.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      )}
      {value.type === 'product' && (
        <select className={inputClass} value={value.value} onChange={(e) => onChange('value', e.target.value)}>
          <option value="">Select product</option>
          {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      )}
      {(value.type === 'tag' || value.type === 'url') && (
        <input
          className={inputClass}
          value={value.value}
          onChange={(e) => onChange('value', e.target.value)}
          placeholder={value.type === 'tag' ? 'e.g. combo' : 'https://...'}
        />
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Page Sections</h1>
          <p className="text-gray-500 mt-1 text-sm">Curated product rows and festive tile banners shown on the home page — fully configurable, no code changes needed per campaign.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap"
          style={{ backgroundColor: 'black', color: 'white' }}
        >
          <FiPlus className="w-4 h-4" /> New Section
        </button>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
          {toast.type === 'error' ? <FiAlertCircle className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 py-12 text-center">Loading...</p>
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <FiLayers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No sections yet. Create one to start curating the home page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={section._id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button disabled={index === 0} onClick={() => move(index, -1)} className="p-1 rounded disabled:opacity-30" style={{ border: '1px solid #d1d5db' }}>
                  <FiArrowUp className="w-3.5 h-3.5" />
                </button>
                <button disabled={index === sections.length - 1} onClick={() => move(index, 1)} className="p-1 rounded disabled:opacity-30" style={{ border: '1px solid #d1d5db' }}>
                  <FiArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                {section.type === 'product_carousel' ? <FiLayers className="w-5 h-5 text-gray-500" /> : <FiGrid className="w-5 h-5 text-gray-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm truncate">{section.title}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                    {section.type === 'product_carousel' ? 'Product carousel' : 'Tile grid'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${section.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {section.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {section.type === 'product_carousel'
                    ? `${section.productSource?.mode === 'manual' ? `${section.productSource?.manualProducts?.length || 0} picked products` : section.productSource?.mode === 'tag' ? `Tag: ${section.productSource?.tag}` : section.productSource?.mode === 'maxPrice' ? `Under ₹${section.productSource?.maxPrice}` : `${section.productSource?.minDiscountPercent}%+ discount`}`
                    : `${section.tiles?.length || 0} tiles`}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(section)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ border: '1px solid #d1d5db', color: '#374151' }}
                >
                  {section.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => openEdit(section)} className="p-2 rounded-md hover:bg-gray-50" style={{ border: '1px solid #d1d5db' }}>
                  <FiEdit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => handleDelete(section._id)} className="p-2 rounded-md hover:bg-red-50" style={{ border: '1px solid #fecaca' }}>
                  <FiTrash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editingId ? 'Edit Section' : 'New Section'} onClose={() => setShowModal(false)} maxWidth="820px">
          <div className="space-y-5">
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input className={inputClass} value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="e.g. Under ₹199" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (optional)</label>
                <input className={inputClass} value={form.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section type</label>
              <div className="flex gap-2">
                {toggleBtn(form.type === 'product_carousel', () => updateField('type', 'product_carousel'), 'Product Carousel', <FiLayers className="w-4 h-4" />)}
                {toggleBtn(form.type === 'tile_grid', () => updateField('type', 'tile_grid'), 'Tile Grid (festive banners)', <FiGrid className="w-4 h-4" />)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner image (optional header image for the section)</label>
              <div className="flex items-center gap-3">
                {form.theme.bannerImage && <img src={form.theme.bannerImage} alt="" className="w-16 h-16 rounded-lg object-cover border" />}
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ border: '1px solid #d1d5db' }}>
                  <FiImage className="w-4 h-4" /> {form.theme.bannerImage ? 'Change' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0], (url) => updateNested('theme', 'bannerImage', url))} />
                </label>
                {form.theme.bannerImage && (
                  <button type="button" onClick={() => updateNested('theme', 'bannerImage', '')} className="text-xs text-red-500 flex items-center gap-1">
                    <FiX className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            </div>

            {form.type === 'product_carousel' ? (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">How should products be picked?</label>
                  <div className="grid grid-cols-4 gap-2">
                    {toggleBtn(form.productSource.mode === 'manual', () => updateNested('productSource', 'mode', 'manual'), 'Pick manually', null)}
                    {toggleBtn(form.productSource.mode === 'tag', () => updateNested('productSource', 'mode', 'tag'), 'By tag', null)}
                    {toggleBtn(form.productSource.mode === 'maxPrice', () => updateNested('productSource', 'mode', 'maxPrice'), 'Under a price', null)}
                    {toggleBtn(form.productSource.mode === 'minDiscount', () => updateNested('productSource', 'mode', 'minDiscount'), 'Min discount %', null)}
                  </div>
                </div>

                {form.productSource.mode === 'manual' && (
                  <div>
                    <input
                      className={inputClass}
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                    <div className="mt-2 max-h-56 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
                      {filteredProducts.slice(0, 100).map((p) => (
                        <label key={p._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                          <input type="checkbox" checked={form.productSource.manualProducts.includes(p._id)} onChange={() => toggleManualProduct(p._id)} />
                          <span className="truncate">{p.name}</span>
                          <span className="ml-auto text-xs text-gray-400">₹{p.price}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{form.productSource.manualProducts.length} selected</p>
                  </div>
                )}
                {form.productSource.mode === 'tag' && (
                  <input className={inputClass} placeholder="Tag name, e.g. combo" value={form.productSource.tag} onChange={(e) => updateNested('productSource', 'tag', e.target.value)} />
                )}
                {form.productSource.mode === 'maxPrice' && (
                  <input type="number" className={inputClass} placeholder="e.g. 199" value={form.productSource.maxPrice} onChange={(e) => updateNested('productSource', 'maxPrice', e.target.value)} />
                )}
                {form.productSource.mode === 'minDiscount' && (
                  <input type="number" className={inputClass} placeholder="e.g. 20" value={form.productSource.minDiscountPercent} onChange={(e) => updateNested('productSource', 'minDiscountPercent', e.target.value)} />
                )}
                {form.productSource.mode !== 'manual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max products to show</label>
                    <input type="number" className={inputClass} value={form.productSource.limit} onChange={(e) => updateNested('productSource', 'limit', e.target.value)} />
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700">Tiles</label>
                {form.tiles.map((tile, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      {tile.image && <img src={tile.image} alt="" className="w-12 h-12 rounded-lg object-cover border" />}
                      <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer" style={{ border: '1px solid #d1d5db' }}>
                        <FiImage className="w-3.5 h-3.5" /> {tile.image ? 'Change image' : 'Upload image'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0], (url) => updateTile(i, 'image', url))} />
                      </label>
                      <button type="button" onClick={() => removeTile(i)} className="ml-auto text-red-500">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className={inputClass} placeholder="Label, e.g. Kids Mela" value={tile.label} onChange={(e) => updateTile(i, 'label', e.target.value)} />
                      <input className={inputClass} placeholder="Price label (optional), e.g. Starting at ₹29" value={tile.priceLabel} onChange={(e) => updateTile(i, 'priceLabel', e.target.value)} />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input type="checkbox" checked={tile.featured} onChange={(e) => updateTile(i, 'featured', e.target.checked)} />
                      Show larger (featured tile)
                    </label>
                    <LinkEditor value={tile.link} onChange={(field, value) => updateTileLink(i, field, value)} />
                  </div>
                ))}
                <button type="button" onClick={addTile} className="flex items-center gap-2 text-sm font-medium" style={{ color: '#374151' }}>
                  <FiPlus className="w-4 h-4" /> Add tile
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">"View All" button link (optional)</label>
              <LinkEditor value={form.viewAllLink} onChange={(field, value) => updateField('viewAllLink', { ...form.viewAllLink, [field]: value })} />
            </div>

            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date (optional)</label>
                <input type="date" className={inputClass} value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End date (optional)</label>
                <input type="date" className={inputClass} value={form.endDate} onChange={(e) => updateField('endDate', e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} />
                Active
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: '1px solid #d1d5db', color: '#374151' }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'black', color: 'white', opacity: saving ? 0.5 : 1 }}
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Section'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HomeSectionsPage;
