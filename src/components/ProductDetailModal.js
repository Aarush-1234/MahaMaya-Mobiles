'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingCart, Check, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart } = useCart();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Reset states when product changes
  useEffect(() => {
    setActiveImageIdx(0);
    setQuantity(1);
    setAddedAnimation(false);
  }, [product]);

  if (!product) return null;

  // Extract images
  const images = product.images && product.images.length > 0
    ? [...product.images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    : [{ image_url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&auto=format&fit=crop&q=60' }];

  const activePrice = product.discount_price !== null && product.discount_price !== undefined
    ? Number(product.discount_price)
    : Number(product.price);
  const originalPrice = Number(product.price);
  const hasDiscount = product.discount_price !== null && product.discount_price !== undefined;

  // Extract compatible models
  const compatibleDevices = product.product_device_models?.map(pdm => {
    const model = pdm.device_models;
    if (!model) return null;
    const brand = model.device_brands?.name || '';
    return brand ? `${brand} ${model.name}` : model.name;
  }).filter(Boolean) || [];

  const handlePrevImage = () => {
    setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = () => {
    if (product.available) {
      addToCart(product, quantity);
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 2000);
    }
  };

  const renderActionBlock = () => {
    return (
      <div className="product-detail-action" style={{ borderTop: 'none', paddingTop: 0 }}>
        {product.available ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
              <span className="spec-label" style={{ fontSize: '14px' }}>Quantity:</span>
              <div className="cart-item-qty-selector" style={{ padding: '4px' }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ padding: '6px 12px' }}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span style={{ fontSize: '15px', fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{ padding: '6px 12px' }}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="whatsapp-checkout-btn"
              style={{
                background: addedAnimation ? 'var(--bg-dark)' : 'var(--bg-dark)',
                color: 'var(--text-light)',
                marginTop: '8px',
                boxShadow: 'none',
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {addedAnimation ? (
                <>
                  <Check size={16} />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart size={16} />
                  Add to Cart • ₹{activePrice * quantity}
                </>
              )}
            </button>
          </div>
        ) : (
          <button disabled className="product-card-btn" style={{ padding: '14px', width: '100%' }}>
            Product Out of Stock
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
          <X size={20} />
        </button>
 
        <div className="product-detail-layout">
          {/* Left Column: Gallery & Actions (Desktop) */}
          <div className="product-gallery">
            <div className="product-gallery-main">
              <img
                src={images[activeImageIdx]?.image_url}
                alt={product.name}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&auto=format&fit=crop&q=60';
                }}
              />
              
              {images.length > 1 && (
                <>
                  <button onClick={handlePrevImage} className="gallery-arrow left" aria-label="Previous image">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={handleNextImage} className="gallery-arrow right" aria-label="Next image">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="product-gallery-thumbs no-scrollbar">
                {images.map((img, idx) => (
                  <img
                    key={img.id || idx}
                    src={img.image_url}
                    alt={`${product.name} thumbnail ${idx}`}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`gallery-thumb ${activeImageIdx === idx ? 'active' : ''}`}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&auto=format&fit=crop&q=60';
                    }}
                  />
                ))}
              </div>
            )}

            {/* Desktop Actions Container (shown on desktop, hidden on mobile) */}
            <div className="modal-desktop-actions">
              {renderActionBlock()}
            </div>
          </div>
 
          {/* Right Column: Content */}
          <div className="product-details-content">
            <div className="product-detail-header">
              <span className="product-detail-brand">{product.brand || 'Generic'}</span>
              <h2 className="product-detail-title">{product.name}</h2>
            </div>
 
            {/* Price section */}
            <div className="detail-price-row">
              <span className={`detail-price ${hasDiscount ? 'sale' : ''}`}>
                ₹{activePrice}
              </span>
              {hasDiscount && (
                <span className="detail-price-old">
                  ₹{originalPrice}
                </span>
              )}
              {hasDiscount && (
                <span className="badge success" style={{ fontSize: '10px' }}>
                  Save ₹{originalPrice - activePrice}
                </span>
              )}
            </div>
 
            <p className="product-detail-desc">
              {product.description || 'No description available for this product.'}
            </p>
 
            {/* Specs & Compatibility */}
            <div className="spec-list" style={{ marginBottom: 0 }}>
              {product.sku && (
                <div className="spec-item">
                  <span className="spec-label">SKU:</span>
                  <span className="spec-val">{product.sku}</span>
                </div>
              )}
              <div className="spec-item">
                <span className="spec-label">Category:</span>
                <span className="spec-val">{product.categories?.name || 'Accessories'}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Availability:</span>
                <span className={`spec-val ${product.available ? 'badge success' : 'badge danger'}`} style={{ padding: '0 8px' }}>
                  {product.available ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              
              {compatibleDevices.length > 0 ? (
                <div className="spec-item" style={{ flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  <span className="spec-label">Compatible Devices:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {compatibleDevices.map((device, i) => (
                      <span key={i} className="badge active" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {device}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="spec-item">
                  <span className="spec-label">Device Compatibility:</span>
                  <span className="spec-val">Universal / Non-device specific</span>
                </div>
              )}

              {/* Product Tags Display */}
              {product.tags && product.tags.length > 0 && (
                <div className="spec-item" style={{ flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                  <span className="spec-label">Tags:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {product.tags.map((tagObj, i) => (
                      <span key={i} className="badge active" style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {tagObj.tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Actions Container (shown on mobile, hidden on desktop) */}
            <div className="modal-mobile-actions">
              {renderActionBlock()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
