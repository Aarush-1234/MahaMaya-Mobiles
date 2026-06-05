'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [toastTimeoutId, setToastTimeoutId] = useState(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('covers_zone_cart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('covers_zone_cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  const showToast = (message) => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToast({ message, visible: true });
    const id = setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 3000);
    setToastTimeoutId(id);
  };

  const addToCart = (product, quantity = 1) => {
    let isExisting = false;
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        isExisting = true;
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // Get the first image from product images if available
      const image = product.images?.[0]?.image_url || '/placeholder.png';
      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          discount_price: product.discount_price ? Number(product.discount_price) : null,
          image: image,
          quantity: quantity,
          sku: product.sku,
          brand: product.brand
        }
      ];
    });
    
    // Trigger toast instead of opening the cart drawer
    showToast(isExisting ? 'Quantity updated in cart' : 'Item added to cart');
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = cart.reduce((total, item) => {
    const activePrice = item.discount_price !== null ? item.discount_price : item.price;
    return total + activePrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isInitialized,
        toast,
        showToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
