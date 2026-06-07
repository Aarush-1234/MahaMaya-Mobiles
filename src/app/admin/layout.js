'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderOpen,
  Smartphone,
  Sliders,
  LogOut,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Layers,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useShop } from '../../context/ShopContext';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { settings } = useShop();

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingAuth(false);
      
      // If no session and not on login page, redirect to login
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // If we are checking authentication, show a clean loader
  if (checkingAuth && pathname !== '/admin/login') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)'
      }}>
        <RefreshCw size={32} style={{ animation: 'spin 1.5s linear infinite', marginBottom: '16px' }} />
        <p style={{ fontWeight: '500' }}>Verifying admin authorization...</p>
      </div>
    );
  }

  // If on login page, do not show sidebar/nav
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If not logged in and not checking, wait for redirect
  if (!session) {
    return null;
  }

  // Navigation items config
  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Products', path: '/admin/products', icon: <ShoppingBag size={18} /> },
    { name: 'Categories', path: '/admin/categories', icon: <FolderOpen size={18} /> },
    { name: 'Brands & Models', path: '/admin/brands-models', icon: <Smartphone size={18} /> },
    { name: 'Shop Settings', path: '/admin/settings', icon: <Sliders size={18} /> },
  ];

  return (
    <div className="admin-layout-container">
      {/* Mobile Top Header */}
      <div className="admin-mobile-header">
        <button onClick={() => setIsMobileOpen(true)} className="admin-hamburger-btn" aria-label="Open navigation menu">
          <Menu size={20} />
        </button>
        <div className="logo" style={{ fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.shop_name || 'Admin'}
              style={{ maxHeight: '38px', maxWidth: '140px', objectFit: 'contain' }}
            />
          ) : (
            <span>{settings.shop_name || 'MahaMaya Mobiles'}</span>
          )}
          <span style={{
            fontSize: '10px',
            fontWeight: '600',
            color: 'var(--accent-yellow)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: 'rgba(234, 179, 8, 0.15)',
            padding: '2px 6px',
            borderRadius: '4px',
            marginLeft: '4px'
          }}>
            Admin
          </span>
        </div>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', color: '#fff' }}>
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.shop_name || 'Admin'}
                style={{ maxHeight: '42px', maxWidth: '150px', objectFit: 'contain' }}
              />
            ) : (
              <>
                <div className="logo-icon" style={{ padding: '3px' }}>
                  <Layers size={16} />
                </div>
                <span>{settings.shop_name || 'MahaMaya Mobiles'}</span>
              </>
            )}
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              color: 'var(--accent-yellow)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: 'rgba(234, 179, 8, 0.15)',
              padding: '2px 6px',
              borderRadius: '4px',
              marginLeft: '4px'
            }}>
              Admin
            </span>
          </div>
          {/* Close button inside sidebar on mobile */}
          <button onClick={() => setIsMobileOpen(false)} className="admin-sidebar-close-btn" aria-label="Close navigation menu">
            <X size={18} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsMobileOpen(false)} // close menu on navigate
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-nav-item"
            style={{ marginTop: 'auto', borderTop: '1px solid #222', paddingTop: '16px' }}
          >
            <ExternalLink size={18} />
            <span>View Storefront</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Page Area */}
      <main className="admin-main-content">
        {children}
      </main>
    </div>
  );
}
