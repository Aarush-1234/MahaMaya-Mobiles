'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Upload,
  RefreshCw,
  Search,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useShop } from '../../../context/ShopContext';

function AdminProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories: shopCategories, deviceBrands, deviceModels, refreshShopData } = useShop();

  // Core products list state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = add new
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    category_id: '',
    sku: '',
    brand: '',
    available: true,
    is_featured: false,
    sort_order: 0
  });

  // Compatibility states
  const [compatibilityInput, setCompatibilityInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Images state
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImageUrls, setNewImageUrls] = useState([]); // local blobs for preview
  const fileInputRef = useRef(null);
  const editFormRef = useRef(null);

  // Tags state
  const [tagsInput, setTagsInput] = useState(''); // comma-separated

  // Saving states
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch products and join categories, images, tags, compatibility
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name),
          images: product_images (*),
          tags: product_tags (*),
          product_device_models (
            device_model_id,
            device_models (
              id,
              name,
              brand_id,
              device_brands (id, name)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    
    // If URL contains ?new=true, open add form
    if (searchParams.get('new') === 'true') {
      handleOpenAddForm();
    }
  }, [searchParams, shopCategories]);

  // Set default category when categories load
  useEffect(() => {
    if (shopCategories.length > 0 && !formData.category_id) {
      setFormData(prev => ({ ...prev, category_id: shopCategories[0].id }));
    }
  }, [shopCategories]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // --- COMPATIBILITY INPUT HANDLERS ---
  const handleCompatibilityChange = (e) => {
    const value = e.target.value;
    setCompatibilityInput(value);

    const parts = value.split(',');
    const currentInput = parts[parts.length - 1].trim();

    if (currentInput.length >= 2) {
      // Find matching models from shop context that aren't already added
      const typedLower = currentInput.toLowerCase();
      const matched = deviceModels.filter(model => {
        const brandName = model.device_brands?.name || '';
        const modelFullName = brandName ? `${brandName} ${model.name}` : model.name;
        
        const isMatch = modelFullName.toLowerCase().includes(typedLower) || model.name.toLowerCase().includes(typedLower);
        const isAlreadySelected = parts.slice(0, -1).some(p => p.trim().toLowerCase() === model.name.toLowerCase() || p.trim().toLowerCase() === modelFullName.toLowerCase());
        
        return isMatch && !isAlreadySelected;
      });
      setSuggestions(matched.slice(0, 5)); // max 5 suggestions
      setShowSuggestions(matched.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (model) => {
    const brandName = model.device_brands?.name || '';
    const modelFullName = brandName ? `${brandName} ${model.name}` : model.name;

    const parts = compatibilityInput.split(',');
    parts[parts.length - 1] = ` ${modelFullName}`;
    
    const updated = parts.join(', ').trim() + ', ';
    setCompatibilityInput(updated);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // --- FORM TRIGGERS ---
  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      discount_price: '',
      category_id: shopCategories[0]?.id || '',
      sku: '',
      brand: '',
      available: true,
      is_featured: false,
      sort_order: products.length + 1
    });
    setCompatibilityInput('');
    setExistingImages([]);
    setNewImageFiles([]);
    setNewImageUrls([]);
    setTagsInput('');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = async (prod) => {
    try {
      setFormError('');
      setEditingId(prod.id);
      
      setFormData({
        name: prod.name || '',
        description: prod.description || '',
        price: prod.price || '',
        discount_price: prod.discount_price || '',
        category_id: prod.category_id || '',
        sku: prod.sku || '',
        brand: prod.brand || '',
        available: prod.available ?? true,
        is_featured: prod.is_featured ?? false,
        sort_order: prod.sort_order ?? 0
      });

      // Load images
      setExistingImages(prod.images || []);
      setNewImageFiles([]);
      setNewImageUrls([]);

      // Load tags
      const tagsStr = prod.tags?.map(t => t.tag).join(', ') || '';
      setTagsInput(tagsStr);

      // Load compatibility string
      const compStr = prod.product_device_models
        ?.map(pdm => {
          const model = pdm.device_models;
          if (!model) return '';
          const brandName = model.device_brands?.name || '';
          return brandName ? `${brandName} ${model.name}` : model.name;
        })
        .filter(Boolean)
        .join(', ') || '';
      
      setCompatibilityInput(compStr ? compStr + ', ' : '');

      setIsFormOpen(true);
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    } catch (err) {
      console.error('Error loading product details for edit:', err);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormError('');
    if (searchParams.get('new') === 'true') {
      router.push('/admin/products');
    }
  };

  // --- IMAGE MANAGEMENT ---
  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setNewImageFiles(prev => [...prev, ...files]);
    
    const urls = files.map(file => URL.createObjectURL(file));
    setNewImageUrls(prev => [...prev, ...urls]);
  };

  const handleRemoveExistingImage = async (imgId) => {
    const confirmed = window.confirm('Delete this image permanently?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imgId);

      if (error) throw error;
      setExistingImages(prev => prev.filter(img => img.id !== imgId));
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image.');
    }
  };

  const handleRemoveNewImage = (idx) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
    setNewImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  // --- SAVE PRODUCT ---
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || !formData.category_id) {
      setFormError('Product Name, Price, and Category are required.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      let productId = editingId;

      // 1. Insert or Update Product info
      const productPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        category_id: formData.category_id,
        sku: formData.sku.trim() || null,
        brand: formData.brand.trim() || null,
        available: formData.available,
        is_featured: formData.is_featured,
        sort_order: Number(formData.sort_order)
      };

      if (editingId) {
        // Update product
        const { error: prodUpdateError } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingId);

        if (prodUpdateError) throw prodUpdateError;
      } else {
        // Insert product
        const { data: newProd, error: prodInsertError } = await supabase
          .from('products')
          .insert([productPayload])
          .select()
          .single();

        if (prodInsertError) throw prodInsertError;
        productId = newProd.id;
      }

      // 2. Upload and save new images to Supabase Storage bucket `product-images`
      if (newImageFiles.length > 0) {
        for (let i = 0; i < newImageFiles.length; i++) {
          const file = newImageFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath);

          // Save image reference in product_images table
          const { error: imgDbError } = await supabase
            .from('product_images')
            .insert([{
              product_id: productId,
              image_url: publicUrl,
              display_order: existingImages.length + i + 1
            }]);

          if (imgDbError) throw imgDbError;
        }
      }

      // 3. Update Tags (Delete existing and insert new ones)
      const tagsArray = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const { error: tagDeleteError } = await supabase
        .from('product_tags')
        .delete()
        .eq('product_id', productId);

      if (tagDeleteError) throw tagDeleteError;

      if (tagsArray.length > 0) {
        const tagObjects = tagsArray.map(tag => ({
          product_id: productId,
          tag: tag
        }));

        const { error: tagInsertError } = await supabase
          .from('product_tags')
          .insert(tagObjects);

        if (tagInsertError) throw tagInsertError;
      }

      // 4. Update Device Compatibility links (Delete existing, resolve brand/model dynamically, insert new links)
      // Delete existing relations
      const { error: compatDeleteError } = await supabase
        .from('product_device_models')
        .delete()
        .eq('product_id', productId);

      if (compatDeleteError) throw compatDeleteError;

      // Parse comma-separated compatible model list
      const modelNames = compatibilityInput
        .split(',')
        .map(m => m.trim())
        .filter(m => m.length > 0);

      if (modelNames.length > 0) {
        // Fetch current brands and models to match existing ones
        const { data: currentBrands } = await supabase.from('device_brands').select('*');
        const resolvedModelIds = [];

        for (const rawModelName of modelNames) {
          let resolvedBrandName = 'Other';
          let modelName = rawModelName;
          const lowerModel = rawModelName.toLowerCase();

          // Brand Resolution Algorithm
          if (lowerModel.includes('iphone') || lowerModel.includes('ipad') || lowerModel.includes('apple')) {
            resolvedBrandName = 'Apple';
          } else {
            // Check if model name starts with an existing brand name
            const matchedBrand = currentBrands?.find(b => 
              lowerModel.startsWith(b.name.toLowerCase() + ' ') || 
              lowerModel === b.name.toLowerCase()
            );

            if (matchedBrand) {
              resolvedBrandName = matchedBrand.name;
              // Clean model name (remove brand prefix if present)
              if (lowerModel.startsWith(matchedBrand.name.toLowerCase() + ' ')) {
                modelName = rawModelName.substring(matchedBrand.name.length + 1).trim();
              }
            } else {
              // Extract first word as brand name
              const firstWord = rawModelName.split(/\s+/)[0];
              if (firstWord && firstWord.length > 1) {
                resolvedBrandName = firstWord;
                // Model name is what's left after the first word
                const rest = rawModelName.substring(firstWord.length).trim();
                if (rest) {
                  modelName = rest;
                }
              }
            }
          }

          // Find or create Brand
          let brandId = null;
          const brandObj = currentBrands?.find(b => b.name.toLowerCase() === resolvedBrandName.toLowerCase());

          if (brandObj) {
            brandId = brandObj.id;
          } else {
            const brandSlug = resolvedBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const { data: newBrand, error: brandErr } = await supabase
              .from('device_brands')
              .insert([{
                name: resolvedBrandName,
                slug: brandSlug,
                is_active: true,
                display_order: 100
              }])
              .select()
              .single();

            if (brandErr) throw brandErr;
            brandId = newBrand.id;
            currentBrands.push(newBrand);
          }

          // Find or create Model
          let modelId = null;
          // Match full model name under the brand
          const { data: matchModels } = await supabase
            .from('device_models')
            .select('*')
            .eq('brand_id', brandId)
            .eq('name', modelName);

          if (matchModels && matchModels.length > 0) {
            modelId = matchModels[0].id;
          } else {
            const modelSlug = modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const { data: newModel, error: modelErr } = await supabase
              .from('device_models')
              .insert([{
                brand_id: brandId,
                name: modelName,
                slug: modelSlug,
                is_active: true,
                display_order: 100
              }])
              .select()
              .single();

            if (modelErr) throw modelErr;
            modelId = newModel.id;
          }

          if (modelId && !resolvedModelIds.includes(modelId)) {
            resolvedModelIds.push(modelId);
          }
        }

        // Save relations
        if (resolvedModelIds.length > 0) {
          const compatObjects = resolvedModelIds.map(modelId => ({
            product_id: productId,
            device_model_id: modelId
          }));

          const { error: compatInsertError } = await supabase
            .from('product_device_models')
            .insert(compatObjects);

          if (compatInsertError) throw compatInsertError;
        }
      }

      await fetchProducts();
      await refreshShopData(); // Refresh global storefront context
      setIsFormOpen(false);

    } catch (err) {
      console.error('Error saving product:', err);
      setFormError(err.message || 'An error occurred while saving the product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await supabase.from('product_tags').delete().eq('product_id', id);
      await supabase.from('product_images').delete().eq('product_id', id);
      await supabase.from('product_device_models').delete().eq('product_id', id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
      await refreshShopData();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailable = async (prod) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ available: !prod.available })
        .eq('id', prod.id);

      if (error) throw error;
      setProducts(prev =>
        prev.map(p => p.id === prod.id ? { ...p, available: !p.available } : p)
      );
      await refreshShopData();
    } catch (err) {
      console.error('Error toggling product availability:', err);
    }
  };

  // --- FILTERS LOGIC ---
  const stockFilter = searchParams.get('filter') || 'all';

  const filteredProducts = products.filter(p => {
    const matchesSearch = searchQuery.trim() === '' || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === '' || p.category_id === filterCategory;

    let matchesStock = true;
    if (stockFilter === 'in-stock') {
      matchesStock = p.available === true;
    } else if (stockFilter === 'out-of-stock') {
      matchesStock = p.available === false;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Add, update, or remove mobile accessories and covers
          </p>
        </div>
        {!isFormOpen && (
          <button onClick={handleOpenAddForm} className="admin-primary-btn">
            <Plus size={16} />
            Configure New Item
          </button>
        )}
      </div>

      {/* --- FORM PANEL (Add / Edit Product) --- */}
      {isFormOpen && (
        <section ref={editFormRef} className="admin-card" style={{ marginBottom: '32px', animation: 'slideUp var(--transition-normal)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContext: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700' }}>
              {editingId ? `Edit Product: ${formData.name}` : 'Create New Product'}
            </h2>
            <button onClick={handleCloseForm} style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }} aria-label="Close form">
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="badge danger" style={{ margin: '16px 20px 0 20px', padding: '10px', display: 'block', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSaveProduct}>
            <div className="form-grid">
              
              {/* Product Name */}
              <div className="form-group full-width">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Silicone Case for iPhone 15 Pro Max"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Select Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  required
                  className="form-input"
                  style={{ background: '#fff', border: '1px solid var(--border-color)' }}
                >
                  {shopCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand / Compatible Models Selector */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Brand / Compatible Model *</label>
                <input
                  type="text"
                  placeholder="e.g. Apple iPhone 15, Apple iPhone 15 Pro Max"
                  value={compatibilityInput}
                  onChange={handleCompatibilityChange}
                  className="form-input"
                  autoComplete="off"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Type models separated by commas. Typing triggers existing model suggestions.
                </span>

                {/* Autocomplete Suggestions Box */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    style={{
                      position: 'absolute',
                      top: '72px',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 50,
                      maxHeight: '180px',
                      overflowY: 'auto'
                    }}
                  >
                    {suggestions.map((model) => {
                      const brandName = model.device_brands?.name || '';
                      const modelFullName = brandName ? `${brandName} ${model.name}` : model.name;
                      return (
                        <div
                          key={model.id}
                          onClick={() => handleSelectSuggestion(model)}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            borderBottom: '1px solid var(--bg-tertiary)'
                          }}
                          onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          {modelFullName}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="form-group">
                <label className="form-label">Original Price (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 599"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>

              {/* Discount Price */}
              <div className="form-group">
                <label className="form-label">Discount Price (₹ - Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 399"
                  value={formData.discount_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_price: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* Brand */}
              <div className="form-group">
                <label className="form-label">Product Brand (e.g. Spigen, COVERS ZONE)</label>
                <input
                  type="text"
                  placeholder="e.g. Spigen"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* SKU */}
              <div className="form-group">
                <label className="form-label">SKU Code (Inventory ID)</label>
                <input
                  type="text"
                  placeholder="e.g. COV-IP15-SIL-BLK"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* Sort Order */}
              <div className="form-group">
                <label className="form-label">Sort Order (Higher displays first)</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">Product Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. New Arrival, Trending, Premium, Best Seller"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Description */}
              <div className="form-group full-width">
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Tell customers about material, thickness, wireless charging support..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="form-textarea"
                />
              </div>

              {/* Availability & Featured Toggles */}
              <div className="form-group" style={{ flexDirection: 'row', gap: '24px', alignItems: 'center' }}>
                <label className="form-checkbox-group">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span className="form-label" style={{ margin: 0 }}>Available / In Stock</span>
                </label>
                
                <label className="form-checkbox-group">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span className="form-label" style={{ margin: 0 }}>Mark as Featured</span>
                </label>
              </div>

              {/* Images Manager */}
              <div className="form-group full-width" style={{ marginTop: '16px' }}>
                <label className="form-label">Product Images</label>
                
                {/* File Uploader */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="image-upload-zone"
                >
                  <Upload size={24} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Click to upload product images</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Supports multiple files (PNG, JPG, WEBP)</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Previews grid */}
                {(existingImages.length > 0 || newImageUrls.length > 0) && (
                  <div className="uploaded-images-preview">
                    {/* Existing saved images */}
                    {existingImages.map((img) => (
                      <div key={img.id} className="preview-thumb-container">
                        <img src={img.image_url} alt="Saved product" className="preview-thumb" />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(img.id)}
                          className="preview-thumb-remove"
                          title="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Newly selected files */}
                    {newImageUrls.map((url, idx) => (
                      <div key={idx} className="preview-thumb-container" style={{ borderColor: 'var(--accent-yellow)' }}>
                        <img src={url} alt="New upload preview" className="preview-thumb" />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(idx)}
                          className="preview-thumb-remove"
                          title="Remove file"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    Saving Product...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Product
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* --- PRODUCTS TABLE LIST PANEL --- */}
      <section className="admin-card">
        {/* Table Filters */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '13px' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Category & Stock Filter Container */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '11px' }}>Category:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="form-input"
                style={{ fontSize: '13px', padding: '6px 28px 6px 12px', background: '#fff', border: '1px solid var(--border-color)', width: 'auto' }}
              >
                <option value="">All Categories</option>
                {shopCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '11px' }}>Stock:</label>
              <select
                value={stockFilter}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value === 'all') {
                    params.delete('filter');
                  } else {
                    params.set('filter', e.target.value);
                  }
                  router.push(`/admin/products?${params.toString()}`);
                }}
                className="form-input"
                style={{ fontSize: '13px', padding: '6px 28px 6px 12px', background: '#fff', border: '1px solid var(--border-color)', width: 'auto' }}
              >
                <option value="all">All Items</option>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 12px auto' }} />
            <p>Loading products list...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <ImageIcon size={32} style={{ marginBottom: '12px', display: 'inline' }} />
            <h3>No products found</h3>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Try resetting your search query or click "Configure New Item" to populate stock.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Image</th>
                  <th>Product Name</th>
                  <th>SKU / Brand</th>
                  <th>Price</th>
                  <th>Stock Availability</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => {
                  const hasDiscount = prod.discount_price !== null;
                  const firstImg = prod.images?.[0]?.image_url || null;

                  return (
                    <tr key={prod.id}>
                      <td style={{ paddingLeft: '24px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                          {firstImg ? (
                            <img src={firstImg} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                              <ImageIcon size={16} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{prod.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{prod.categories?.name || 'Accessories'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                          <span style={{ fontFamily: 'monospace' }}>{prod.sku || 'No SKU'}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{prod.brand || 'No Brand'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '750', color: hasDiscount ? 'var(--danger)' : 'inherit' }}>₹{hasDiscount ? prod.discount_price : prod.price}</span>
                          {hasDiscount && <span style={{ textDecoration: 'line-through', fontSize: '11px', color: 'var(--text-muted)' }}>₹{prod.price}</span>}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleAvailable(prod)}
                          style={{ display: 'flex', alignItems: 'center' }}
                          aria-label={prod.available ? 'Mark out of stock' : 'Mark in stock'}
                        >
                          {prod.available ? (
                            <span className="badge success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ToggleRight size={16} /> In Stock
                            </span>
                          ) : (
                            <span className="badge danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ToggleLeft size={16} /> Out of Stock
                            </span>
                          )}
                        </button>
                      </td>
                      <td>
                        {prod.is_featured ? (
                          <span className="badge active" style={{ fontSize: '10px' }}>Featured</span>
                        ) : (
                          <span className="badge inactive" style={{ fontSize: '10px' }}>Standard</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            onClick={() => handleOpenEditForm(prod)}
                            className="admin-action-btn edit"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="admin-action-btn delete"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminProducts() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto' }} />
        <p>Loading products page...</p>
      </div>
    }>
      <AdminProductsContent />
    </Suspense>
  );
}
