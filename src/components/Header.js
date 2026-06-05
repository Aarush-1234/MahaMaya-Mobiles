'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, ShoppingBag, Smartphone, Sun, Moon, FolderOpen, ChevronUp, X, MapPin, Phone, Mail, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useShop } from '../context/ShopContext';

function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, categories, deviceModels } = useShop();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [], models: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  // Sync state with URL search param
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) {
      setQuery(q);
    } else {
      setQuery('');
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) {
      setSuggestions({ products: [], categories: [], models: [] });
      setShowDropdown(false);
      return;
    }

    // 1. Match products
    const matchedProducts = (products || [])
      .filter(p => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
      .slice(0, 4);

    // 2. Match categories
    const matchedCategories = (categories || [])
      .filter(c => c.name?.toLowerCase().includes(q))
      .slice(0, 3);

    // 3. Match models
    const matchedModels = (deviceModels || [])
      .filter(m => m.name?.toLowerCase().includes(q) || m.device_brands?.name?.toLowerCase().includes(q))
      .slice(0, 3);

    setSuggestions({
      products: matchedProducts,
      categories: matchedCategories,
      models: matchedModels
    });

    setShowDropdown(
      matchedProducts.length > 0 ||
      matchedCategories.length > 0 ||
      matchedModels.length > 0
    );
  }, [query, products, categories, deviceModels]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    if (query.trim()) {
      router.push(`/?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/');
    }
  };

  const handleSuggestionClick = (type, item) => {
    setShowDropdown(false);
    if (type === 'product') {
      setQuery(item.name);
      router.push(`/?product_id=${item.id}`);
    } else if (type === 'category') {
      setQuery(item.name);
      router.push(`/?category_id=${item.id}`);
    } else if (type === 'model') {
      const brandName = item.device_brands?.name || '';
      const fullName = brandName ? `${brandName} ${item.name}` : item.name;
      setQuery(fullName);
      router.push(`/?brand_id=${item.brand_id}&model_id=${item.id}`);
    }
  };

  return (
    <div ref={containerRef} className="search-form-container" style={{ flex: 1, maxWidth: '480px', position: 'relative' }}>
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          placeholder="Search covers, chargers, models..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.products.length || suggestions.categories.length || suggestions.models.length) {
              setShowDropdown(true);
            }
          }}
          className="search-input"
        />
        <button type="submit" className="search-icon-btn" aria-label="Submit search">
          <Search size={18} />
        </button>
      </form>

      {showDropdown && (
        <div className="search-suggestions-dropdown">
          {/* Category Suggestions */}
          {suggestions.categories.length > 0 && (
            <div className="suggestion-group">
              <div className="suggestion-group-title">Categories</div>
              {suggestions.categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => handleSuggestionClick('category', cat)}
                  className="suggestion-item"
                >
                  <FolderOpen size={14} className="suggestion-item-icon" />
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Model Suggestions */}
          {suggestions.models.length > 0 && (
            <div className="suggestion-group">
              <div className="suggestion-group-title">Compatible Devices</div>
              {suggestions.models.map(model => (
                <div
                  key={model.id}
                  onClick={() => handleSuggestionClick('model', model)}
                  className="suggestion-item"
                >
                  <Smartphone size={14} className="suggestion-item-icon" />
                  <span>{model.name} ({model.device_brands?.name || 'Device'})</span>
                </div>
              ))}
            </div>
          )}

          {/* Product Suggestions */}
          {suggestions.products.length > 0 && (
            <div className="suggestion-group">
              <div className="suggestion-group-title">Products</div>
              {suggestions.products.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => handleSuggestionClick('product', prod)}
                  className="suggestion-item"
                >
                  <ShoppingBag size={14} className="suggestion-item-icon" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '500' }}>{prod.name}</span>
                    {prod.brand && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{prod.brand}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { cartCount, setIsCartOpen } = useCart();
  const { categories, settings, isLoading } = useShop();
  const pathname = usePathname();
  const [theme, setTheme] = useState('light');

  // Popup & Scroll states
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [infoModal, setInfoModal] = useState(null); // null, 'about', 'contact'

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Scroll listener for Back to Top and Sticky styling
  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 350);
      setIsScrolled(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Helper to determine if a category is active based on current path
  const getActiveCategory = () => {
    if (pathname === '/') return 'all';
    if (pathname.startsWith('/category/')) {
      return pathname.split('/').pop();
    }
    return '';
  };

  const activeCategory = getActiveCategory();

  return (
    <>
      {/* Top Announcement Bar (Not sticky, outside header) */}
      {settings.announcement_enabled && (
        <div className="announcement-bar">
          <div className="announcement-track">
            <span>{settings.announcement_text}</span>
          </div>
        </div>
      )}

      {/* Sticky Top Navbar Header */}
      <header className="header-container">
        <div className="container">
          {/* Main Header */}
          <div className="header-main">
            {/* Logo */}
            <Link href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.shop_name || 'COVERS ZONE'}
                  className="logo-img"
                />
              ) : (
                <>
                  <div className="logo-icon">
                    <Smartphone size={20} />
                  </div>
                  COVERS<span className="zone">ZONE</span>
                </>
              )}
            </Link>

            {/* Search bar wrapped in Suspense */}
            <div className="search-bar-wrapper">
              <Suspense fallback={
                <div className="search-form">
                  <input type="text" placeholder="Search..." disabled className="search-input" />
                </div>
              }>
                <SearchInput />
              </Suspense>
            </div>

            {/* Actions */}
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* About Us Button */}
              <button
                onClick={() => setInfoModal("about")}
                className="nav-action-btn"
                aria-label="About Us"
                type="button"
              >
                <span className="desktop-only-text">About Us</span>
                <span className="mobile-only-icon"><Info size={20} /></span>
              </button>

              {/* Contact Button */}
              <button
                onClick={() => setInfoModal("contact")}
                className="nav-action-btn"
                aria-label="Contact Us"
                type="button"
              >
                <span className="desktop-only-text">Contact</span>
                <span className="mobile-only-icon"><Mail size={20} /></span>
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="theme-toggle-btn"
                aria-label="Toggle theme"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  borderRadius: 'var(--radius-full)',
                  transition: 'background var(--transition-fast)'
                }}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="cart-trigger"
                aria-label="Open shopping cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Pills Navigation (Sticky with style transition) */}
      <nav className={`category-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="category-list no-scrollbar">
            <Link
              href="/"
              className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
            >
              All Products
            </Link>
            
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={`category-pill ${activeCategory === category.slug ? 'active' : ''}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="back-to-top-btn"
          aria-label="Back to top"
        >
          ↑
        </button>
      )}

      {/* Info Modal (About Us or Contact) */}
      {infoModal && (
        <div className="modal-overlay" onClick={() => setInfoModal(null)}>
          <div className="modal-content" style={{ maxWidth: '500px', display: 'block', padding: '32px' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setInfoModal(null)} className="modal-close-btn" aria-label="Close modal">
              <X size={20} />
            </button>
            
            {infoModal === 'about' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt={settings.shop_name}
                      style={{ maxHeight: '60px', objectFit: 'contain', margin: '0 auto 12px auto', display: 'block' }}
                    />
                  ) : (
                    <div className="logo-icon" style={{ width: '48px', height: '48px', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', background: 'var(--bg-dark)', color: 'var(--accent-yellow)' }}>
                      <Smartphone size={24} />
                    </div>
                  )}
                  <h2 className="section-title" style={{ fontSize: '24px', fontWeight: '800' }}>About Us</h2>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{settings.shop_name}</span>
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', textAlign: 'center', marginBottom: '20px' }}>
                  {settings.footer_description || 'Your one-stop destination for premium mobile accessories. We specialize in durable mobile covers, tempered glass, fast chargers, and top-tier Bluetooth sound accessories.'}
                </p>

                {settings.ordering_guidelines && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em' }}>Ordering Guidelines</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>{settings.ordering_guidelines}</p>
                  </div>
                )}
              </>
            )}

            {infoModal === 'contact' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h2 className="section-title" style={{ fontSize: '24px', fontWeight: '800' }}>Contact Us</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Get in touch with us for support, custom order queries, or store visits</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                  {/* Address */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--accent-yellow)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Our Store Address</h4>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.4' }}>{settings.address || 'Address not configured'}</p>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <a 
                    href={`https://wa.me/${settings.whatsapp_number}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', textDecoration: 'none' }}
                  >
                    <div style={{ color: 'var(--whatsapp-green)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Phone size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>WhatsApp Chat</h4>
                      <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px', fontWeight: '600', textDecoration: 'underline' }}>+{settings.whatsapp_number}</p>
                    </div>
                  </a>

                  {/* Email */}
                  {settings.email && (
                    <a 
                      href={`mailto:${settings.email}`} 
                      style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', textDecoration: 'none' }}
                    >
                      <div style={{ color: 'var(--accent-yellow)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: '750', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Email Address</h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px', textDecoration: 'underline' }}>{settings.email}</p>
                      </div>
                    </a>
                  )}
                </div>

                <a
                  href={`https://wa.me/${settings.whatsapp_number}?text=Hello%20COVERS%20ZONE,%20I%20have%20a%20query.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-checkout-btn"
                  style={{ width: '100%', textDecoration: 'none', padding: '12px' }}
                >
                  Chat on WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
