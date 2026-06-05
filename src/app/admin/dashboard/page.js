'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  FolderOpen,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  TrendingUp,
  Smartphone
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProducts: 0,
    availableProducts: 0,
    outOfStockProducts: 0,
    totalCategories: 0,
    totalBrands: 0,
    totalModels: 0
  });
  const [outOfStockList, setOutOfStockList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch products
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, available, price, sku');
      
      if (prodError) throw prodError;

      // 2. Fetch categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id');
      
      if (catError) throw catError;

      // 3. Fetch brands & models
      const { data: brands } = await supabase.from('device_brands').select('id');
      const { data: models } = await supabase.from('device_models').select('id');

      const total = products?.length || 0;
      const available = products?.filter(p => p.available).length || 0;
      const oos = total - available;
      const oosList = products?.filter(p => !p.available) || [];

      setStats({
        totalProducts: total,
        availableProducts: available,
        outOfStockProducts: oos,
        totalCategories: categories?.length || 0,
        totalBrands: brands?.length || 0,
        totalModels: models?.length || 0
      });

      setOutOfStockList(oosList);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto' }} />
        <p>Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Catalog Overview</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Real-time status of COVERS ZONE inventory and settings
          </p>
        </div>
        <button onClick={fetchDashboardData} className="admin-secondary-btn" aria-label="Refresh stats">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats Cards Row */}
      <section className="admin-stats-grid">
        {/* Total Products */}
        <div className="admin-stat-card" onClick={() => router.push('/admin/products?filter=all')}>
          <div className="stat-card-details">
            <span className="stat-card-label">Total Products</span>
            <span className="stat-card-value">{stats.totalProducts}</span>
          </div>
          <div className="stat-card-icon">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Available Products */}
        <div className="admin-stat-card" onClick={() => router.push('/admin/products?filter=in-stock')} style={{ borderLeft: '4px solid var(--whatsapp-green)' }}>
          <div className="stat-card-details">
            <span className="stat-card-label">Active / In Stock</span>
            <span className="stat-card-value">{stats.availableProducts}</span>
          </div>
          <div className="stat-card-icon" style={{ color: 'var(--whatsapp-green)' }}>
            <CheckCircle size={20} />
          </div>
        </div>

        {/* Out of Stock Products */}
        <div className="admin-stat-card" onClick={() => router.push('/admin/products?filter=out-of-stock')} style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-card-details">
            <span className="stat-card-label">Out of Stock</span>
            <span className="stat-card-value">{stats.outOfStockProducts}</span>
          </div>
          <div className="stat-card-icon" style={{ color: 'var(--danger)' }}>
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Total Categories */}
        <div className="admin-stat-card" onClick={() => router.push('/admin/categories')}>
          <div className="stat-card-details">
            <span className="stat-card-label">Categories</span>
            <span className="stat-card-value">{stats.totalCategories}</span>
          </div>
          <div className="stat-card-icon">
            <FolderOpen size={20} />
          </div>
        </div>
      </section>

      {/* Device Stats and Quick Actions Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '32px' }}>
        {/* Quick Actions Panel */}
        <div className="admin-card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Quick Admin Tasks
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <button
              onClick={() => router.push('/admin/products?new=true')}
              className="admin-primary-btn"
              style={{ padding: '12px', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
            >
              <Plus size={16} />
              Configure New Item
            </button>
            <button
              onClick={() => router.push('/admin/categories?new=true')}
              className="admin-secondary-btn"
              style={{ padding: '12px', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
            >
              <Plus size={16} />
              Add Category
            </button>
            <button
              onClick={() => router.push('/admin/brands-models')}
              className="admin-secondary-btn"
              style={{ padding: '12px', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
            >
              <Smartphone size={16} />
              Manage Devices
            </button>
            <button
              onClick={() => router.push('/admin/settings')}
              className="admin-secondary-btn"
              style={{ padding: '12px', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
            >
              Configure Shop
            </button>
          </div>
        </div>

        {/* Compatibility Overview */}
        <div className="admin-card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Device Support Stats
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Active Brands:</span>
              <span style={{ fontWeight: '700' }}>{stats.totalBrands}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Active Phone Models:</span>
              <span style={{ fontWeight: '700' }}>{stats.totalModels}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
              Brands and models let you filter covers and tempered glass. Products not associated with a specific device will show up as universal items.
            </p>
          </div>
        </div>
      </div>

      {/* Out of Stock Products List */}
      <section className="admin-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700' }}>⚠️ Out of Stock Inventory ({outOfStockList.length})</h2>
          {outOfStockList.length > 0 && (
            <button onClick={() => router.push('/admin/products')} className="clear-filters-btn" style={{ padding: '4px 8px' }}>
              Manage Products
            </button>
          )}
        </div>
        <div className="admin-table-container">
          {outOfStockList.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <CheckCircle size={24} style={{ color: 'var(--whatsapp-green)', marginBottom: '8px', display: 'inline' }} />
              <p style={{ fontSize: '14px', marginTop: '6px' }}>All products are currently in stock!</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {outOfStockList.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600' }}>{item.name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{item.sku || 'N/A'}</td>
                    <td>₹{item.price}</td>
                    <td>
                      <span className="badge danger">Out of Stock</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
