import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  fabricType?: string;
  suitPieces?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  sessionId: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const generateSessionId = (): string => {
  return 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const getOrCreateSessionId = (): string => {
  const existing = localStorage.getItem('cart_session_id');
  if (existing) return existing;
  const newId = generateSessionId();
  localStorage.setItem('cart_session_id', newId);
  return newId;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [sessionId] = useState<string>(getOrCreateSessionId);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart_items');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'id'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId);
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, { ...item, id: Math.random().toString(36).substring(2) }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(i => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart_items');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        sessionId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
