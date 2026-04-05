import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CartItem, MenuItem } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number, specialInstructions?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateSpecialInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  const syncToLocalStorage = (newItems: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(newItems));
  };

  const addItem = useCallback((item: MenuItem, quantity = 1, specialInstructions?: string) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.menu_item.id === item.id);
      let updated: CartItem[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
      } else {
        updated = [...prev, { menu_item: item, quantity, special_instructions: specialInstructions }];
      }
      syncToLocalStorage(updated);
      return updated;
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setItems(prev => {
      const updated = prev.filter(i => i.menu_item.id !== menuItemId);
      syncToLocalStorage(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems(prev => {
      const updated = prev.map(i => 
        i.menu_item.id === menuItemId ? { ...i, quantity } : i
      );
      syncToLocalStorage(updated);
      return updated;
    });
  }, [removeItem]);

  const updateSpecialInstructions = useCallback((menuItemId: string, instructions: string) => {
    setItems(prev => {
      const updated = prev.map(i => 
        i.menu_item.id === menuItemId ? { ...i, special_instructions: instructions } : i
      );
      syncToLocalStorage(updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart');
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + (item.menu_item.price * item.quantity), 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateSpecialInstructions,
      clearCart,
      getTotal,
      getItemCount,
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
