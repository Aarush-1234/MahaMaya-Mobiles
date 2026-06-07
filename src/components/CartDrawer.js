'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, Send } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useShop } from '../context/ShopContext';
import useBackButtonClose from '../hooks/useBackButtonClose';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartTotal,
    cartCount,
    toast,
    clearCart
  } = useCart();

  const { settings } = useShop();

  useBackButtonClose({
    isOpen: isCartOpen,
    onClose: () => setIsCartOpen(false),
    stateKey: 'cart-drawer'
  });

  useBodyScrollLock(isCartOpen);

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  // Load customer details from localStorage on mount (for convenience)
  useEffect(() => {
    try {
      const storedDetails = localStorage.getItem('covers_zone_customer_details');
      if (storedDetails) {
        setCustomerDetails(JSON.parse(storedDetails));
      }
    } catch (e) {
      console.error('Failed to load customer details:', e);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails((prev) => {
      const updated = { ...prev, [name]: value };
      localStorage.setItem('covers_zone_customer_details', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCheckout = (e) => {
    e.preventDefault();

    if (!customerDetails.name.trim() || !customerDetails.phone.trim() || !customerDetails.address.trim()) {
      alert('Please fill in your Name, Phone Number, and Delivery Address.');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    // Build the WhatsApp message
    let message = `Hello ${settings.shop_name || 'Shop Owner'},\n`;
    message += `I want to place an order.\n\n`;
    message += `*Customer Details:*\n`;
    message += `Name: ${customerDetails.name.trim()}\n`;
    message += `Phone: ${customerDetails.phone.trim()}\n`;
    if (customerDetails.email.trim()) {
      message += `Email: ${customerDetails.email.trim()}\n`;
    }
    message += `Address: ${customerDetails.address.trim()}\n\n`;
    
    message += `*Order Items:*\n`;
    cart.forEach((item) => {
      const activePrice = item.discount_price !== null ? item.discount_price : item.price;
      message += `• ${item.name} (${item.brand || 'Generic'})\n`;
      message += `  Qty: ${item.quantity} | Price: ₹${activePrice} each\n`;
    });
    
    message += `\n*Total: ₹${cartTotal}*\n\n`;
    message += `Please confirm availability.`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = settings.whatsapp_number || '919796628335';
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappLink, '_blank');

    // Clear cart and customer details for privacy and clean state post-order
    clearCart();
    setCustomerDetails({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    localStorage.removeItem('covers_zone_customer_details');
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && toast.visible && (
        <div className="toast-popup">
          <span>{toast.message}</span>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          {/* Background Overlay */}
          <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />

          {/* Drawer */}
          <div className="cart-drawer">
            <div className="cart-header">
              <h2 className="cart-title">
                Shopping Cart ({cartCount})
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="cart-close-btn"
                aria-label="Close cart"
              >
                <X size={22} />
              </button>
            </div>

            {/* Cart items */}
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <p>Your cart is empty.</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="admin-secondary-btn"
                    style={{ borderRadius: 'var(--radius-full)' }}
                  >
                    Continue Browsing
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const activePrice = item.discount_price !== null ? item.discount_price : item.price;
                  return (
                    <div key={item.id} className="cart-item">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="cart-item-image"
                      />
                      <div className="cart-item-details">
                        <h3 className="cart-item-name">{item.name}</h3>
                        <div className="cart-item-price-row">
                          <span className="product-price">₹{activePrice}</span>
                          {item.discount_price !== null && (
                            <span className="product-price-old">₹{item.price}</span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="cart-item-qty-selector">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="cart-qty-btn"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="cart-qty-val">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="cart-qty-btn"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="cart-item-remove"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Checkout Details Form */}
            {cart.length > 0 && (
              <div className="cart-checkout-section">
                <div className="cart-summary-row">
                  <span>Subtotal:</span>
                  <span className="cart-summary-total">₹{cartTotal}</span>
                </div>

                <form onSubmit={handleCheckout} className="checkout-form">
                  <div>
                    <label className="checkout-label">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={customerDetails.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="checkout-input"
                    />
                  </div>

                  <div>
                    <label className="checkout-label">WhatsApp Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={customerDetails.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      required
                      className="checkout-input"
                    />
                  </div>

                  <div>
                    <label className="checkout-label">Email (Optional)</label>
                    <input
                      type="email"
                      name="email"
                      value={customerDetails.email}
                      onChange={handleInputChange}
                      placeholder="e.g. rahul@gmail.com"
                      className="checkout-input"
                    />
                  </div>

                  <div>
                    <label className="checkout-label">Delivery Address *</label>
                    <textarea
                      name="address"
                      value={customerDetails.address}
                      onChange={handleInputChange}
                      placeholder="Full address with pincode..."
                      required
                      className="checkout-textarea"
                    />
                  </div>

                  <button type="submit" className="whatsapp-checkout-btn">
                    <Send size={16} />
                    Order on WhatsApp (₹{cartTotal})
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
