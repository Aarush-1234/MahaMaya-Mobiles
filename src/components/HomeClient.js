'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Smartphone, Filter, RefreshCw, ChevronDown, Check, ArrowRight, MessageSquare,
  Shield, Zap, Cable, Headphones, Battery, Layers, Grid, Home, ArrowLeft, X 
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import HeroBanner from './HeroBanner';
import ProductGrid from './ProductGrid';
import ProductDetailModal from './ProductDetailModal';
import { useShop } from '../context/ShopContext';
import useBackButtonClose from '../hooks/useBackButtonClose';

export default function HomeClient() {
  const { deviceBrands, deviceModels, categories, products, productsLoading, settings } = useShop();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search query from URL
  const searchQuery = searchParams.get('search') || '';

  // Core state
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Interactive expanded views
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null); // { id, title, products }
  const [expandedCategories, setExpandedCategories] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);

  useBackButtonClose({
    isOpen: !!selectedProduct,
    onClose: () => setSelectedProduct(null),
    stateKey: 'product-detail-modal'
  });

  useBackButtonClose({
    isOpen: !!expandedSection,
    onClose: () => setExpandedSection(null),
    stateKey: 'expanded-section'
  });

  useBackButtonClose({
    isOpen: expandedCategories,
    onClose: () => setExpandedCategories(false),
    stateKey: 'expanded-categories'
  });

  // Resize listener for responsive limit calculations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Sync selectedBrandId, selectedModelId, and selectedCategoryId with URL search params on mount or param change
  useEffect(() => {
    const brandId = searchParams.get('brand_id') || '';
    const modelId = searchParams.get('model_id') || '';
    const catId = searchParams.get('category_id') || '';
    setSelectedBrandId(brandId);
    setSelectedModelId(modelId);
    setSelectedCategoryId(catId);
  }, [searchParams]);

  // Open product detail modal if product_id is in URL query parameters
  useEffect(() => {
    const urlProductId = searchParams.get('product_id');
    if (urlProductId && products && products.length > 0) {
      const prod = products.find(p => p.id === urlProductId);
      if (prod) {
        setSelectedProduct(prod);
        // Clean up URL product_id param so back button doesn't re-open it
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('product_id');
          window.history.replaceState({}, '', url.pathname + url.search);
        }
      }
    }
  }, [searchParams, products]);

  const getResponsiveLimit = (customLimit) => {
    if (customLimit && Number(customLimit) > 0) return Number(customLimit);
    if (windowWidth < 640) return 4;   // Mobile
    if (windowWidth < 1024) return 6;  // Tablet
    if (windowWidth < 1440) return 8;  // Desktop
    return 10;                         // Large screen
  };

  const getResponsiveCategoryLimit = () => {
    if (windowWidth < 640) return 4;
    if (windowWidth < 1024) return 6;
    return 8;
  };

  // Helper to determine brand/model change
  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    setSelectedBrandId(brandId);
    setSelectedModelId('');
    
    const params = new URLSearchParams(searchParams.toString());
    if (brandId) {
      params.set('brand_id', brandId);
    } else {
      params.delete('brand_id');
    }
    params.delete('model_id');
    router.push(`/?${params.toString()}`);
  };

  const handleModelChange = (e) => {
    const modelId = e.target.value;
    setSelectedModelId(modelId);
    
    const params = new URLSearchParams(searchParams.toString());
    if (modelId) {
      params.set('model_id', modelId);
    } else {
      params.delete('model_id');
    }
    router.push(`/?${params.toString()}`);
  };

  // Filter and sort products
  useEffect(() => {
    if (productsLoading) return;

    let result = [...(products || [])];

    // 1. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const brandMatch = p.brand?.toLowerCase().includes(q);
        const skuMatch = p.sku?.toLowerCase().includes(q);
        
        // Match tags
        const tagMatch = p.tags?.some((t) => t.tag?.toLowerCase().includes(q));

        // Match category name
        const catMatch = p.categories?.name?.toLowerCase().includes(q);
        
        // Match compatible devices
        const deviceMatch = p.product_device_models?.some((pdm) => {
          const mName = pdm.device_models?.name?.toLowerCase();
          const bName = pdm.device_models?.device_brands?.name?.toLowerCase();
          return mName?.includes(q) || bName?.includes(q);
        });

        return nameMatch || descMatch || brandMatch || skuMatch || tagMatch || catMatch || deviceMatch;
      });
    }

    // 2. Category Filter
    if (selectedCategoryId) {
      result = result.filter((p) => p.category_id === selectedCategoryId);
    }

    // 3. Device Model Filter
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
        const isBrandCompatible = modelRelations.some(
          (pdm) => pdm.device_models?.brand_id === selectedBrandId
        );
        const isUniversal = modelRelations.length === 0;
        return isBrandCompatible || isUniversal;
      });
    }

    // 4. Sorting
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
      return new Date(b.created_at) - new Date(a.created_at);
    });

    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategoryId, selectedBrandId, selectedModelId, sortBy, productsLoading]);

  // Filter models based on brand selection
  const filteredModels = selectedBrandId
    ? deviceModels.filter((m) => m.brand_id === selectedBrandId)
    : [];

  const isFilterActive = searchQuery || selectedCategoryId || selectedBrandId || selectedModelId;

  // Split products for homepage structure
  const availableProducts = filteredProducts.filter((p) => p.available);
  const outOfStockProducts = filteredProducts.filter((p) => !p.available);

  const featuredProducts = availableProducts.filter((p) => p.is_featured);
  const newArrivals = [...availableProducts]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const homepageSections = settings.sections || [];

  const clearFilters = () => {
    setSelectedBrandId('');
    setSelectedModelId('');
    setSelectedCategoryId('');
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete('brand_id');
    params.delete('model_id');
    params.delete('category_id');
    
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  const backToStore = () => {
    setSelectedBrandId('');
    setSelectedModelId('');
    setSelectedCategoryId('');
    router.push('/');
  };

  const getFilterHeader = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    
    const activeModelId = searchParams.get('model_id') || selectedModelId;
    const activeBrandId = searchParams.get('brand_id') || selectedBrandId;
    const activeCategoryId = searchParams.get('category_id') || selectedCategoryId;
    
    if (activeModelId) {
      const model = deviceModels.find(m => m.id === activeModelId);
      if (model) {
        const brandName = model.device_brands?.name || '';
        return `Products compatible with ${brandName} ${model.name}`;
      }
    } else if (activeBrandId) {
      const brand = deviceBrands.find(b => b.id === activeBrandId);
      if (brand) {
        return `Products compatible with ${brand.name}`;
      }
    }
    if (activeCategoryId) {
      const cat = categories.find(c => c.id === activeCategoryId);
      if (cat) {
        return `Products in ${cat.name}`;
      }
    }
    return 'Filtered Products';
  };

  // Slug-based Category Icons helper
  const getCategoryIcon = (slug) => {
    const s = slug?.toLowerCase() || '';
    if (s.includes('cover') || s.includes('case')) return <Smartphone size={24} />;
    if (s.includes('glass') || s.includes('tempered') || s.includes('screen') || s.includes('guard')) return <Shield size={24} />;
    if (s.includes('charger') || s.includes('power') || s.includes('plug')) return <Zap size={24} />;
    if (s.includes('cable') || s.includes('wire') || s.includes('cord')) return <Cable size={24} />;
    if (s.includes('headphone') || s.includes('audio') || s.includes('sound')) return <Headphones size={24} />;
    if (s.includes('earbud') || s.includes('airpod') || s.includes('tws')) return <Headphones size={24} />;
    if (s.includes('bank') || s.includes('battery')) return <Battery size={24} />;
    return <Layers size={24} />;
  };

  const displayedCategories = expandedCategories 
    ? categories 
    : (categories || []).slice(0, getResponsiveCategoryLimit());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <main className="container" style={{ flex: 1, paddingBottom: '40px' }}>
        {/* Render Hero Banner only when no filter/search is active */}
        {!isFilterActive && <HeroBanner />}

        {/* Device Compatibility and Sorting Filters Strip */}
        <section className="filter-strip" id="catalog-section" style={{ marginTop: isFilterActive ? '24px' : '0' }}>
          <div className="filter-title">
            <Filter size={16} />
            <span>Filter Catalog</span>
          </div>

          <div className="filter-selects">
            {/* Category Dropdown */}
            <div className="filter-select-wrapper">
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  const catId = e.target.value;
                  setSelectedCategoryId(catId);
                  const params = new URLSearchParams(searchParams.toString());
                  if (catId) {
                    params.set('category_id', catId);
                  } else {
                    params.delete('category_id');
                  }
                  router.push(`/?${params.toString()}`);
                }}
                className="filter-select"
                aria-label="Select Category"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="select-arrow">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Brand Dropdown */}
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

            {/* Model Dropdown */}
            <div className="filter-select-wrapper">
              <select
                value={selectedModelId}
                onChange={handleModelChange}
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

            {/* Sorting Dropdown */}
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

        {/* Loading / Error States */}
        {productsLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <RefreshCw className="no-scrollbar" size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto' }} />
            <p>Loading catalog products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
            <p>No products available at the moment.</p>
          </div>
        ) : (
          <>
            {/* Catalog Display */}
            {isFilterActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Back to Store Navigation Button */}
                <div style={{ animation: 'fadeIn var(--transition-fast)' }}>
                  <button 
                    onClick={backToStore}
                    className="admin-secondary-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <ArrowLeft size={16} />
                    Back to Store
                  </button>
                </div>

                <section style={{ animation: 'fadeIn var(--transition-normal)' }}>
                  <div className="products-section-header">
                    <h2 className="section-title">
                      {getFilterHeader()} 
                      <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ({availableProducts.length} items)
                      </span>
                    </h2>
                    {availableProducts.length > getResponsiveLimit() && (
                      <button 
                        onClick={() => setExpandedSection({ id: 'search-results', title: getFilterHeader(), products: availableProducts })} 
                        className="view-all-link"
                      >
                        View All
                      </button>
                    )}
                  </div>
                  {availableProducts.length === 0 && outOfStockProducts.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '60px 20px', 
                      background: 'var(--bg-secondary)', 
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-color)',
                      margin: '20px 0'
                    }}>
                      <p style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '16px' }}>
                        Sorry, nothing found. Try searching something else.
                      </p>
                    </div>
                  ) : (
                    <>
                      {availableProducts.length > 0 ? (
                        <ProductGrid products={availableProducts.slice(0, getResponsiveLimit())} onViewProduct={setSelectedProduct} />
                      ) : (
                        <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                          No in-stock items found matching your filters. See out-of-stock options below.
                        </div>
                      )}
                    </>
                  )}
                </section>

                {outOfStockProducts.length > 0 && (
                  <section style={{ animation: 'slideUp var(--transition-normal)' }}>
                    <div className="products-section-header">
                      <h2 className="section-title">Currently Out of Stock</h2>
                      {outOfStockProducts.length > getResponsiveLimit() && (
                        <button 
                          onClick={() => setExpandedSection({ id: 'oos-results', title: 'Currently Out of Stock', products: outOfStockProducts })} 
                          className="view-all-link"
                        >
                          View All
                        </button>
                      )}
                    </div>
                    <ProductGrid products={outOfStockProducts.slice(0, getResponsiveLimit())} onViewProduct={setSelectedProduct} />
                  </section>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {homepageSections.map((section) => {
                  if (!section.enabled) return null;

                  // Render CATEGORIES section type
                  if (section.type === 'categories') {
                    return (
                      <section key={section.id} style={{ animation: 'slideUp var(--transition-normal)' }}>
                        <div className="products-section-header">
                          <h2 className="section-title">{section.title}</h2>
                        </div>
                        <div className="categories-grid">
                          {categories.slice(0, getResponsiveCategoryLimit()).map((cat) => (
                            <div 
                              key={cat.id} 
                              onClick={() => {
                                const catProducts = availableProducts.filter(p => p.category_id === cat.id);
                                setExpandedSection({ id: `cat-${cat.id}`, title: cat.name, products: catProducts });
                              }}
                              className="category-card"
                            >
                              <div className="category-card-icon-wrapper">
                                {getCategoryIcon(cat.slug)}
                              </div>
                              <h3 className="category-card-title">{cat.name}</h3>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  }

                  // Render PRODUCTS section type
                  let sectionProducts = [];
                  if (section.mode === 'manual') {
                    sectionProducts = (section.productIds || [])
                      .map(id => availableProducts.find(p => p.id === id))
                      .filter(Boolean);
                  } else {
                    if (section.id === 'featured') {
                      sectionProducts = featuredProducts;
                    } else if (section.id === 'arrivals') {
                      sectionProducts = newArrivals;
                    } else {
                      sectionProducts = availableProducts;
                    }
                  }

                  if (sectionProducts.length === 0) return null;

                  const limit = getResponsiveLimit(section.limit);

                  return (
                    <section key={section.id} style={{ animation: 'slideUp var(--transition-normal)' }}>
                      <div className="products-section-header">
                        <h2 className="section-title">{section.title}</h2>
                        {sectionProducts.length > limit && (
                          <button 
                            onClick={() => setExpandedSection({ id: section.id, title: section.title, products: sectionProducts })}
                            className="view-all-link"
                          >
                            View All
                          </button>
                        )}
                      </div>
                      <ProductGrid products={sectionProducts.slice(0, limit)} onViewProduct={setSelectedProduct} />
                    </section>
                  );
                })}

                {/* Explore Categories section before CTA */}
                {settings.categories_section_enabled && categories.length > 0 && (
                  <section style={{ animation: 'slideUp var(--transition-normal)' }}>
                    <div className="products-section-header">
                      <h2 className="section-title">{settings.categories_section_title || 'Explore Categories'}</h2>
                      {categories.length > displayedCategories.length && (
                        <button 
                          onClick={() => setExpandedCategories(true)} 
                          className="view-all-link"
                        >
                          View All
                        </button>
                      )}
                    </div>
                    <div className="categories-grid">
                      {displayedCategories.map((cat) => (
                        <div 
                          key={cat.id} 
                          onClick={() => {
                            const catProducts = availableProducts.filter(p => p.category_id === cat.id);
                            setExpandedSection({ id: `cat-${cat.id}`, title: cat.name, products: catProducts });
                          }}
                          className="category-card"
                        >
                          <div className="category-card-icon-wrapper">
                            {getCategoryIcon(cat.slug)}
                          </div>
                          <h3 className="category-card-title">{cat.name}</h3>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Out of Stock products displayed at the bottom */}
                {outOfStockProducts.length > 0 && (
                  <section style={{ animation: 'slideUp var(--transition-normal)' }}>
                    <div className="products-section-header">
                      <h2 className="section-title">Currently Out of Stock</h2>
                      {outOfStockProducts.length > getResponsiveLimit() && (
                        <button 
                          onClick={() => setExpandedSection({ id: 'oos-general', title: 'Currently Out of Stock', products: outOfStockProducts })}
                          className="view-all-link"
                        >
                          View All
                        </button>
                      )}
                    </div>
                    <ProductGrid products={outOfStockProducts.slice(0, getResponsiveLimit())} onViewProduct={setSelectedProduct} />
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {/* WhatsApp CTA Section */}
        {settings.cta_enabled && (
          <section className="whatsapp-cta-section" style={{ animation: 'slideUp var(--transition-normal)' }}>
            <MessageSquare size={36} style={{ color: 'var(--whatsapp-green)' }} />
            <h2 className="whatsapp-cta-title">{settings.cta_title}</h2>
            <p className="whatsapp-cta-desc">
              {settings.cta_description}
            </p>
            <a
              href={`https://wa.me/${settings.whatsapp_number || '919796628335'}?text=${encodeURIComponent(settings.cta_whatsapp_text || 'Hello, I have a query about custom covers.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-checkout-btn"
              style={{ width: 'fit-content', padding: '12px 32px', marginTop: '8px' }}
            >
              {settings.cta_btn_text}
            </a>
          </section>
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

      {/* Expanded Section View Overlay Drawer */}
      {expandedSection && (
        <div className="expanded-overlay">
          <div className="expanded-header">
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {expandedSection.title}
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {expandedSection.products?.length || 0} Products Found
              </span>
            </div>
            <button 
              onClick={() => setExpandedSection(null)} 
              className="admin-secondary-btn"
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} />
              Back to Catalog
            </button>
          </div>
          <div className="expanded-body">
            <ProductGrid products={expandedSection.products} onViewProduct={setSelectedProduct} />
          </div>
        </div>
      )}

      {/* View All Categories Expanded Overlay */}
      {expandedCategories && (
        <div className="expanded-overlay">
          <div className="expanded-header">
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                All Categories
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                Explore our full line of {categories.length} accessory types
              </span>
            </div>
            <button 
              onClick={() => setExpandedCategories(false)} 
              className="admin-secondary-btn"
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} />
              Back to Catalog
            </button>
          </div>
          <div className="expanded-body">
            <div className="categories-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  onClick={() => {
                    setExpandedCategories(false);
                    const catProducts = availableProducts.filter(p => p.category_id === cat.id);
                    setExpandedSection({ id: `cat-${cat.id}`, title: cat.name, products: catProducts });
                  }}
                  className="category-card"
                >
                  <div className="category-card-icon-wrapper">
                    {getCategoryIcon(cat.slug)}
                  </div>
                  <h3 className="category-card-title">{cat.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
