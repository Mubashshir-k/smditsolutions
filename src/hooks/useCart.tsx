import { useState, createContext, useContext, ReactNode, useCallback } from "react";

export interface CartItem {
  itemId: string;
  name: string;
  portion: "half" | "full" | "single";
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (itemId: string, portion: string) => void;
  updateQuantity: (itemId: string, portion: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.itemId === item.itemId && i.portion === item.portion
      );
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.itemId && i.portion === item.portion
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((itemId: string, portion: string) => {
    setItems((prev) => prev.filter((i) => !(i.itemId === itemId && i.portion === portion)));
  }, []);

  const updateQuantity = useCallback((itemId: string, portion: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId, portion);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.itemId === itemId && i.portion === portion ? { ...i, quantity } : i
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
