'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, RefreshCw, ChevronDown, ChevronRight, Home } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import ProductGrid from './ProductGrid';
import ProductDetailModal from './ProductDetailModal';
import { useShop } from '../context/ShopContext';
import { supabase } from '../lib/supabase';
import useBackButtonClose from '../hooks/useBackButtonClose';

export default function CategoryClient({ slug }) {
  const { deviceBrands, deviceModels } = useShop();
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get('search') || '';

  // Core States
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useBackButtonClose({
    isOpen: !!selectedProduct,
    onClose: () => setSelectedProduct(null),
    stateKey: 'product-detail-modal'
  });

  // Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleBrandChange = (e) => {
    setSelectedBrandId(e.target.value);
    setSelectedModelId('');
  };

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch category metadata
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (catError || !catData) {
        throw new Error('Category not found');
      }

      setCategory(catData);

      // 2. Fetch products in this category
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name, slug),
          images: product_images (*),
          tags: product_tags (*),
          product_device_models (
            device_model_id,
            device_models (
              id,
              name,
              slug,
              brand_id,
              device_brands (id, name, slug)
            )
          )
        `)
        .eq('available', true)
        .eq('category_id', catData.id);

      if (prodError) throw prodError;
      setProducts(prodData || []);

    } catch (err) {
      console.error('Error fetching category or products:', err);
      setError(err.message === 'Category not found' ? 'Category not found.' : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryAndProducts();
  }, [slug]);

  // Handle client-side filters & sorting
  useEffect(() => {
    if (loading || !category) return;

    let result = [...products];

    // 1. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const brandMatch = p.brand?.toLowerCase().includes(q);
        const skuMatch = p.sku?.toLowerCase().includes(q);
        
        const tagMatch = p.tags?.some((t) => t.tag?.toLowerCase().includes(q));
        const deviceMatch = p.product_device_models?.some((pdm) => {
          const mName = pdm.device_models?.name?.toLowerCase();
          const bName = pdm.device_models?.device_brands?.name?.toLowerCase();
          return mName?.includes(q) || bName?.includes(q);
        });

        return nameMatch || descMatch || brandMatch || skuMatch || tagMatch || deviceMatch;
      });
    }

    // 2. Device Model Filter
    if (selectedModelId) {
      result = result.filter((p) => {
        const modelRelations = p.product_device_models || [];
        const isCompatible = modelRelations.some((pdm) => pdm.device_model_id === selectedModelId);
        const isUniversal = modelRelations.length === 0;
        return isCompatible || isUniversal;
      });
    } else if (selectedBrandId) {
      result = result.filter((p) => {
        const modelRelations = p.product_device_models || [];
        const isBrandCompatible = modelRelations.some((pdm) => pdm.device_models?.brand_id === selectedBrandId);
        const isUniversal = modelRelations.length === 0;
        return isBrandCompatible || isUniversal;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      const priceA = a.discount_price !== null ? Number(a.discount_price) : Number(a.price);
      const priceB = b.discount_price !== null ? Number(b.discount_price) : Number(b.price);

      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'price_asc') {
        return priceA - priceB;
      }
      if (sortBy === 'price_desc') {
        return priceB - priceA;
      }
      return new Date(b.created_at) - new Date(a.created_at); // default: newest
    });

    setFilteredProducts(result);
  }, [products, searchQuery, selectedBrandId, selectedModelId, sortBy, loading, category]);

  const filteredModels = selectedBrandId
    ? deviceModels.filter((m) => m.brand_id === selectedBrandId)
    : [];

  const isFilterActive = searchQuery || selectedBrandId || selectedModelId;

  const clearFilters = () => {
    setSelectedBrandId('');
    setSelectedModelId('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        {/* Loading / Error States */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto' }} />
            <p>Loading category products...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--danger)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{error}</h2>
            <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              The category you are looking for might have been deactivated or removed.
            </p>
            <Link href="/" className="admin-primary-btn" style={{ margin: '24px auto 0 auto', width: 'fit-content' }}>
              Return to Homepage
            </Link>
          </div>
        ) : (
          <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
            {/* Breadcrumb navigation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              margin: '20px 0'
            }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Home size={13} />
                <span>Home</span>
              </Link>
              <ChevronRight size={12} />
              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{category.name}</span>
            </div>

            {/* Category Page Title */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '850', letterSpacing: '-0.02em' }}>
                {category.name}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Showing {filteredProducts.length} accessories in this category.
              </p>
            </div>

            {/* Device Filter Strip */}
            <section className="filter-strip">
              <div className="filter-title">
                <Filter size={16} />
                <span>Filter Compatibility</span>
              </div>

              <div className="filter-selects">
                {/* Brand Selector */}
                <div className="filter-select-wrapper">
                  <select
                    value={selectedBrandId}
                    onChange={handleBrandChange}
                    className="filter-select"
                    aria-label="Select Phone Brand"
                  >
                    <option value="">All Phone Brands</option>
                    {deviceBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <div className="select-arrow">
                    <ChevronDown size={14} />
                  </div>
                </div>

                {/* Model Selector */}
                <div className="filter-select-wrapper">
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    disabled={!selectedBrandId}
                    className="filter-select"
                    aria-label="Select Phone Model"
                  >
                    <option value="">All Models</option>
                    {filteredModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <div className="select-arrow">
                    <ChevronDown size={14} />
                  </div>
                </div>

                {/* Sorting Selector */}
                <div className="filter-select-wrapper">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="filter-select"
                    aria-label="Sort products"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="name_asc">Sort: A to Z</option>
                    <option value="price_asc">Sort: Price Low to High</option>
                    <option value="price_desc">Sort: Price High to Low</option>
                  </select>
                  <div className="select-arrow">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {isFilterActive && (
                <button onClick={clearFilters} className="clear-filters-btn">
                  Clear Filters
                </button>
              )}
            </section>

            {/* Product Grid section */}
            <section>
              {searchQuery && (
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-secondary)' }}>
                  Search results for "{searchQuery}" inside {category.name}
                </h3>
              )}
              <ProductGrid products={filteredProducts} onViewProduct={setSelectedProduct} />
            </section>
          </div>
        )}
      </main>

      <Footer />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
