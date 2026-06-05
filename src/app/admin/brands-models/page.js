'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save, RefreshCw, Smartphone, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useShop } from '../../../context/ShopContext';

export default function AdminBrandsModels() {
  const { refreshShopData } = useShop();

  // Data states
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(true);

  // Brand Form states
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [brandFormData, setBrandFormData] = useState({
    name: '',
    slug: '',
    display_order: 0,
    is_active: true
  });
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandFormError, setBrandFormError] = useState('');

  // Model Form states
  const [isModelFormOpen, setIsModelFormOpen] = useState(false);
  const [editingModelId, setEditingModelId] = useState(null);
  const [modelFormData, setModelFormData] = useState({
    brand_id: '',
    name: '',
    slug: '',
    display_order: 0,
    is_active: true
  });
  const [savingModel, setSavingModel] = useState(false);
  const [modelFormError, setModelFormError] = useState('');

  // Fetch Brands
  const fetchBrands = async () => {
    try {
      setLoadingBrands(true);
      const { data, error } = await supabase
        .from('device_brands')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('Error fetching device brands:', err);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Fetch Models
  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      const { data, error } = await supabase
        .from('device_models')
        .select(`
          *,
          device_brands (id, name)
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setModels(data || []);
    } catch (err) {
      console.error('Error fetching device models:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchModels();
  }, []);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  // --- BRAND ACTIONS ---
  const handleBrandNameChange = (e) => {
    const val = e.target.value;
    setBrandFormData(prev => ({
      ...prev,
      name: val,
      slug: editingBrandId ? prev.slug : generateSlug(val)
    }));
  };

  const handleOpenAddBrand = () => {
    setEditingBrandId(null);
    setBrandFormData({
      name: '',
      slug: '',
      display_order: brands.length + 1,
      is_active: true
    });
    setBrandFormError('');
    setIsBrandFormOpen(true);
  };

  const handleOpenEditBrand = (brand) => {
    setEditingBrandId(brand.id);
    setBrandFormData({
      name: brand.name,
      slug: brand.slug,
      display_order: brand.display_order,
      is_active: brand.is_active
    });
    setBrandFormError('');
    setIsBrandFormOpen(true);
  };

  const handleSaveBrand = async (e) => {
    e.preventDefault();
    if (!brandFormData.name.trim() || !brandFormData.slug.trim()) {
      setBrandFormError('Brand name and slug are required.');
      return;
    }

    try {
      setSavingBrand(true);
      setBrandFormError('');

      if (editingBrandId) {
        const { error } = await supabase
          .from('device_brands')
          .update({
            name: brandFormData.name.trim(),
            slug: brandFormData.slug.trim(),
            display_order: Number(brandFormData.display_order),
            is_active: brandFormData.is_active
          })
          .eq('id', editingBrandId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('device_brands')
          .insert([{
            name: brandFormData.name.trim(),
            slug: brandFormData.slug.trim(),
            display_order: Number(brandFormData.display_order),
            is_active: brandFormData.is_active
          }]);

        if (error) throw error;
      }

      await fetchBrands();
      await refreshShopData();
      setIsBrandFormOpen(false);
    } catch (err) {
      console.error('Error saving brand:', err);
      setBrandFormError(err.message || 'Error saving brand.');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteBrand = async (id, name) => {
    const confirmed = window.confirm(`Delete device brand "${name}"? This will fail if there are phone models linked under this brand.`);
    if (!confirmed) return;

    try {
      setLoadingBrands(true);
      const { error } = await supabase
        .from('device_brands')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBrands();
      await refreshShopData();
    } catch (err) {
      console.error('Error deleting brand:', err);
      alert('Failed to delete brand. Make sure all models under this brand are deleted first.');
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleToggleBrandActive = async (brand) => {
    try {
      const { error } = await supabase
        .from('device_brands')
        .update({ is_active: !brand.is_active })
        .eq('id', brand.id);

      if (error) throw error;
      await fetchBrands();
      await refreshShopData();
    } catch (err) {
      console.error('Error toggling brand active state:', err);
    }
  };

  // --- MODEL ACTIONS ---
  const handleModelNameChange = (e) => {
    const val = e.target.value;
    setModelFormData(prev => ({
      ...prev,
      name: val,
      slug: editingModelId ? prev.slug : generateSlug(val)
    }));
  };

  const handleOpenAddModel = () => {
    setEditingModelId(null);
    setModelFormData({
      brand_id: brands[0]?.id || '',
      name: '',
      slug: '',
      display_order: models.length + 1,
      is_active: true
    });
    setModelFormError('');
    setIsModelFormOpen(true);
  };

  const handleOpenEditModel = (model) => {
    setEditingModelId(model.id);
    setModelFormData({
      brand_id: model.brand_id,
      name: model.name,
      slug: model.slug,
      display_order: model.display_order,
      is_active: model.is_active
    });
    setModelFormError('');
    setIsModelFormOpen(true);
  };

  const handleSaveModel = async (e) => {
    e.preventDefault();
    if (!modelFormData.brand_id || !modelFormData.name.trim() || !modelFormData.slug.trim()) {
      setModelFormError('Brand, model name, and slug are required.');
      return;
    }

    try {
      setSavingModel(true);
      setModelFormError('');

      if (editingModelId) {
        const { error } = await supabase
          .from('device_models')
          .update({
            brand_id: modelFormData.brand_id,
            name: modelFormData.name.trim(),
            slug: modelFormData.slug.trim(),
            display_order: Number(modelFormData.display_order),
            is_active: modelFormData.is_active
          })
          .eq('id', editingModelId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('device_models')
          .insert([{
            brand_id: modelFormData.brand_id,
            name: modelFormData.name.trim(),
            slug: modelFormData.slug.trim(),
            display_order: Number(modelFormData.display_order),
            is_active: modelFormData.is_active
          }]);

        if (error) throw error;
      }

      await fetchModels();
      await refreshShopData();
      setIsModelFormOpen(false);
    } catch (err) {
      console.error('Error saving model:', err);
      setModelFormError(err.message || 'Error saving model.');
    } finally {
      setSavingModel(false);
    }
  };

  const handleDeleteModel = async (id, name) => {
    const confirmed = window.confirm(`Delete phone model "${name}"? Existing compatible products will lose their link to this model.`);
    if (!confirmed) return;

    try {
      setLoadingModels(true);
      const { error } = await supabase
        .from('device_models')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchModels();
      await refreshShopData();
    } catch (err) {
      console.error('Error deleting model:', err);
      alert('Failed to delete model.');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleToggleModelActive = async (model) => {
    try {
      const { error } = await supabase
        .from('device_models')
        .update({ is_active: !model.is_active })
        .eq('id', model.id);

      if (error) throw error;
      await fetchModels();
      await refreshShopData();
    } catch (err) {
      console.error('Error toggling model active state:', err);
    }
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      {/* Page Title */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Device Compatibility Manager</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Set up device brands (Apple, Samsung) and models (iPhone 15, Galaxy S24)
          </p>
        </div>
      </div>

      {/* Split grid for Brands (left) and Models (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        
        {/* --- LEFT COLUMN: BRANDS --- */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Device Brands</h2>
            {!isBrandFormOpen && (
              <button onClick={handleOpenAddBrand} className="admin-primary-btn" style={{ padding: '6px 12px', fontSize: '12px' }}>
                <Plus size={14} /> Add Brand
              </button>
            )}
          </div>

          {isBrandFormOpen && (
            <div className="admin-card" style={{ padding: '16px', marginBottom: '16px', animation: 'slideUp var(--transition-fast)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '750' }}>{editingBrandId ? 'Edit Brand' : 'Add Brand'}</h3>
                <button onClick={() => setIsBrandFormOpen(false)} style={{ color: 'var(--text-secondary)' }}><X size={16} /></button>
              </div>
              {brandFormError && <div className="badge danger" style={{ width: '100%', marginBottom: '8px', padding: '6px', textAlign: 'center' }}>{brandFormError}</div>}
              <form onSubmit={handleSaveBrand} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px' }}>Brand Name</label>
                  <input type="text" placeholder="e.g. Apple" value={brandFormData.name} onChange={handleBrandNameChange} required className="form-input" style={{ padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px' }}>Slug</label>
                  <input type="text" placeholder="e.g. apple" value={brandFormData.slug} onChange={(e) => setBrandFormData(p => ({ ...p, slug: generateSlug(e.target.value) }))} required className="form-input" style={{ padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px' }}>Sort Order</label>
                  <input type="number" value={brandFormData.display_order} onChange={(e) => setBrandFormData(p => ({ ...p, display_order: e.target.value }))} className="form-input" style={{ padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label className="form-checkbox-group">
                    <input type="checkbox" checked={brandFormData.is_active} onChange={(e) => setBrandFormData(p => ({ ...p, is_active: e.target.checked }))} className="form-checkbox" />
                    <span className="form-label" style={{ fontSize: '11px', margin: 0 }}>Active</span>
                  </label>
                </div>
                <button type="submit" disabled={savingBrand} className="admin-primary-btn" style={{ padding: '8px', justifyContent: 'center', fontSize: '12px' }}>
                  {savingBrand ? 'Saving...' : 'Save Brand'}
                </button>
              </form>
            </div>
          )}

          <div className="admin-card">
            {loadingBrands ? (
              <div style={{ padding: '24px', textAlign: 'center' }}><RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} /></div>
            ) : brands.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No brands configured.</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: '600' }}>{b.name}</td>
                        <td>
                          <button onClick={() => handleToggleBrandActive(b)} aria-label={b.is_active ? 'Deactivate brand' : 'Activate brand'}>
                            {b.is_active ? (
                              <span className="badge success" style={{ padding: '2px 6px', fontSize: '10px' }}>Active</span>
                            ) : (
                              <span className="badge inactive" style={{ padding: '2px 6px', fontSize: '10px' }}>Inactive</span>
                            )}
                          </button>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button onClick={() => handleOpenEditBrand(b)} className="admin-action-btn edit" style={{ padding: '4px' }}><Edit2 size={13} /></button>
                            <button onClick={() => handleDeleteBrand(b.id, b.name)} className="admin-action-btn delete" style={{ padding: '4px' }}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: MODELS --- */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Phone Models</h2>
            {!isModelFormOpen && brands.length > 0 && (
              <button onClick={handleOpenAddModel} className="admin-primary-btn" style={{ padding: '6px 12px', fontSize: '12px' }}>
                <Plus size={14} /> Add Model
              </button>
            )}
          </div>

          {isModelFormOpen && (
            <div className="admin-card" style={{ padding: '16px', marginBottom: '16px', animation: 'slideUp var(--transition-fast)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '750' }}>{editingModelId ? 'Edit Model' : 'Add Model'}</h3>
                <button onClick={() => setIsModelFormOpen(false)} style={{ color: 'var(--text-secondary)' }}><X size={16} /></button>
              </div>
              {modelFormError && <div className="badge danger" style={{ width: '100%', marginBottom: '8px', padding: '6px', textAlign: 'center' }}>{modelFormError}</div>}
              <form onSubmit={handleSaveModel} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px' }}>Select Brand</label>
                  <select value={modelFormData.brand_id} onChange={(e) => setModelFormData(p => ({ ...p, brand_id: e.target.value }))} required className="form-input" style={{ padding: '8px', background: '#fff', border: '1px solid var(--border-color)' }}>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px' }}>Model Name</label>
                  <input type="text" placeholder="e.g. iPhone 15 Pro" value={modelFormData.name} onChange={handleModelNameChange} required className="form-input" style={{ padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px' }}>Slug</label>
                  <input type="text" placeholder="e.g. iphone-15-pro" value={modelFormData.slug} onChange={(e) => setModelFormData(p => ({ ...p, slug: generateSlug(e.target.value) }))} required className="form-input" style={{ padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px' }}>Sort Order</label>
                  <input type="number" value={modelFormData.display_order} onChange={(e) => setModelFormData(p => ({ ...p, display_order: e.target.value }))} className="form-input" style={{ padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label className="form-checkbox-group">
                    <input type="checkbox" checked={modelFormData.is_active} onChange={(e) => setModelFormData(p => ({ ...p, is_active: e.target.checked }))} className="form-checkbox" />
                    <span className="form-label" style={{ fontSize: '11px', margin: 0 }}>Active</span>
                  </label>
                </div>
                <button type="submit" disabled={savingModel} className="admin-primary-btn" style={{ padding: '8px', justifyContent: 'center', fontSize: '12px' }}>
                  {savingModel ? 'Saving...' : 'Save Model'}
                </button>
              </form>
            </div>
          )}

          <div className="admin-card">
            {loadingModels ? (
              <div style={{ padding: '24px', textAlign: 'center' }}><RefreshCw size={18} style={{ animation: 'spin 1.5s linear infinite' }} /></div>
            ) : models.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {brands.length === 0 ? 'Configure at least one brand first.' : 'No phone models configured.'}
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map(m => (
                      <tr key={m.id}>
                        <td style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{m.device_brands?.name || 'N/A'}</td>
                        <td style={{ fontWeight: '600' }}>{m.name}</td>
                        <td>
                          <button onClick={() => handleToggleModelActive(m)} aria-label={m.is_active ? 'Deactivate model' : 'Activate model'}>
                            {m.is_active ? (
                              <span className="badge success" style={{ padding: '2px 6px', fontSize: '10px' }}>Active</span>
                            ) : (
                              <span className="badge inactive" style={{ padding: '2px 6px', fontSize: '10px' }}>Inactive</span>
                            )}
                          </button>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button onClick={() => handleOpenEditModel(m)} className="admin-action-btn edit" style={{ padding: '4px' }}><Edit2 size={13} /></button>
                            <button onClick={() => handleDeleteModel(m.id, m.name)} className="admin-action-btn delete" style={{ padding: '4px' }}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
