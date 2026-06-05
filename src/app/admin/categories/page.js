'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Edit2, Trash2, X, Save, RefreshCw, FolderOpen, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useShop } from '../../../context/ShopContext';

function AdminCategoriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshShopData } = useShop();

  // Categories list state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null means adding new
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    display_order: 0,
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch all categories (active & inactive)
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // If URL contains ?new=true, open form
    if (searchParams.get('new') === 'true') {
      handleOpenAddForm();
    }
  }, [searchParams]);

  // Generate slug from name
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e) => {
    const nameVal = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      // Auto-generate slug only if not editing (or if user wants auto-slug)
      slug: editingId ? prev.slug : generateSlug(nameVal)
    }));
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      display_order: categories.length + 1,
      is_active: true
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (cat) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      display_order: cat.display_order,
      is_active: cat.is_active
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormError('');
    // Remove new=true from URL if present
    if (searchParams.get('new') === 'true') {
      router.push('/admin/categories');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setFormError('Category name and slug are required.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      if (editingId) {
        // Edit existing
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            slug: formData.slug.trim(),
            display_order: Number(formData.display_order),
            is_active: formData.is_active
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Add new
        const { error } = await supabase
          .from('categories')
          .insert([
            {
              name: formData.name.trim(),
              slug: formData.slug.trim(),
              display_order: Number(formData.display_order),
              is_active: formData.is_active
            }
          ]);

        if (error) throw error;
      }

      await fetchCategories();
      await refreshShopData(); // Refresh global shop context
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving category:', err);
      setFormError(err.message || 'Error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the category "${name}"? This might cause issues if products are still assigned to it.`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCategories();
      await refreshShopData();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category. It might be referenced by existing products.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !cat.is_active })
        .eq('id', cat.id);

      if (error) throw error;
      await fetchCategories();
      await refreshShopData();
    } catch (err) {
      console.error('Error toggling active state:', err);
    }
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categories Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Organize products into sections for the storefront
          </p>
        </div>
        {!isFormOpen && (
          <button onClick={handleOpenAddForm} className="admin-primary-btn">
            <Plus size={16} />
            Add Category
          </button>
        )}
      </div>

      {/* Form Area (Add / Edit inline form) */}
      {isFormOpen && (
        <section className="admin-card" style={{ marginBottom: '24px', animation: 'slideUp var(--transition-normal)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>
              {editingId ? 'Edit Category' : 'Create New Category'}
            </h2>
            <button onClick={handleCloseForm} style={{ color: 'var(--text-secondary)' }}>
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="badge danger" style={{ margin: '16px 20px 0 20px', padding: '10px', display: 'block', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSaveCategory}>
            <div className="form-grid" style={{ padding: '20px' }}>
              {/* Category Name */}
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mobile Covers"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className="form-input"
                />
              </div>

              {/* Category Slug */}
              <div className="form-group">
                <label className="form-label">Slug (URL identifier)</label>
                <input
                  type="text"
                  placeholder="e.g. mobile-covers"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                  required
                  className="form-input"
                />
              </div>

              {/* Display Order */}
              <div className="form-group">
                <label className="form-label">Display Order (Sorting)</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* Active Toggle */}
              <div className="form-group" style={{ justifyContent: 'center' }}>
                <label className="form-checkbox-group">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span className="form-label" style={{ margin: 0 }}>Activate Category (Show on Storefront)</span>
                </label>
              </div>
            </div>

            <div className="form-footer">
              <button type="button" onClick={handleCloseForm} className="admin-secondary-btn">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="admin-primary-btn">
                {saving ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Category
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Categories List Table */}
      <section className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 12px auto' }} />
            <p>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <FolderOpen size={32} style={{ marginBottom: '12px', display: 'inline' }} />
            <h3>No categories configured</h3>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Click "Add Category" at the top to create your first category.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Display Order</th>
                  <th>Category Name</th>
                  <th>Slug (URL)</th>
                  <th>Active Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: '700', paddingLeft: '24px' }}>{cat.display_order}</td>
                    <td style={{ fontWeight: '600' }}>{cat.name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>/category/{cat.slug}</td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(cat)}
                        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        aria-label={cat.is_active ? 'Deactivate category' : 'Activate category'}
                      >
                        {cat.is_active ? (
                          <span className="badge success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ToggleRight size={16} /> Active
                          </span>
                        ) : (
                          <span className="badge inactive" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ToggleLeft size={16} /> Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          onClick={() => handleOpenEditForm(cat)}
                          className="admin-action-btn edit"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="admin-action-btn delete"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminCategories() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto' }} />
        <p>Loading categories page...</p>
      </div>
    }>
      <AdminCategoriesContent />
    </Suspense>
  );
}
