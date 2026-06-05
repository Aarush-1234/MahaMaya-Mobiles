'use client';

import React from 'react';
import { ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, onView }) {
  const { addToCart } = useCart();

  const activePrice = product.discount_price !== null && product.discount_price !== undefined
    ? Number(product.discount_price)
    : Number(product.price);

  const originalPrice = Number(product.price);
  const hasDiscount = product.discount_price !== null && product.discount_price !== undefined;
  
  // Calculate discount percentage
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - activePrice) / originalPrice) * 100)
    : 0;

  // Get primary image
  const imageUrl = product.images?.[0]?.image_url || '/placeholder.png';

  // Get tags (product_tags table joins)
  const tags = product.tags || [];

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (product.available) {
      addToCart(product, 1);
    }
  };

  return (
    <div className="product-card" onClick={() => onView(product)}>
      {/* Badges */}
      {!product.available ? (
        <span className="product-card-badge out-of-stock">Out of Stock</span>
      ) : hasDiscount ? (
        <span className="product-card-badge">-{discountPercent}% OFF</span>
      ) : tags.length > 0 ? (
        <span className="product-card-badge">{tags[0].tag}</span>
      ) : null}

      {/* Image Container */}
      <div className="product-card-image-wrapper">
        <img
          src={imageUrl}
          alt={product.name}
          className="product-card-image"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&auto=format&fit=crop&q=60';
          }}
        />
      </div>

      {/* Product Details */}
      <div className="product-card-info">
        <span className="product-card-brand">{product.brand || 'Generic'}</span>
        <h3 className="product-card-name" onClick={() => onView(product)}>
          {product.name}
        </h3>
        
        {/* Price Row */}
        <div className="product-card-price-row">
          <span className={`product-price ${hasDiscount ? 'sale' : ''}`}>
            ₹{activePrice}
          </span>
          {hasDiscount && (
            <span className="product-price-old">
              ₹{originalPrice}
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.available}
          className="product-card-btn"
          aria-label={product.available ? 'Add to cart' : 'Out of stock'}
        >
          <ShoppingCart size={15} />
          {product.available ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
