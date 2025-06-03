'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Check if shop is enabled
    setIsEnabled(process.env.NEXT_PUBLIC_ENABLE_SHOP === 'true');

    // Only load cart if shop is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_SHOP === 'true') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to parse cart from localStorage:', e);
        }
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes, but only if shop is enabled
  useEffect(() => {
    if (isEnabled) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isEnabled]);

  const addToCart = (item) => {
    if (!isEnabled) return;
    setCart(prevCart => {
      // Check if item already exists in cart
      const existingItemIndex = prevCart.findIndex(
        cartItem => cartItem.id === item.id && cartItem.size === item.size
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += item.quantity;
        return newCart;
      }

      // Add new item if it doesn't exist
      return [...prevCart, item];
    });
    setIsOpen(true);
  };

  const removeFromCart = (itemId, size) => {
    if (!isEnabled) return;
    setCart(prevCart => 
      prevCart.filter(item => !(item.id === itemId && item.size === size))
    );
  };

  const updateQuantity = (itemId, size, quantity) => {
    if (!isEnabled) return;
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === itemId && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    if (!isEnabled) return;
    setCart([]);
  };

  const getCartTotal = () => {
    if (!isEnabled) return 0;
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    if (!isEnabled) return 0;
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      isOpen,
      setIsOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      isEnabled,
    }}>
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