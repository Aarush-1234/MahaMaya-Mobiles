'use client';

import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, onViewProduct }) {
  if (!products || products.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-secondary)',
        margin: '20px 0'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>No products found</h3>
        <p style={{ fontSize: '14px', marginTop: '6px' }}>Try adjusting your filters, selecting a different brand/model, or changing your search query.</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onView={onViewProduct}
        />
      ))}
    </div>
  );
}
