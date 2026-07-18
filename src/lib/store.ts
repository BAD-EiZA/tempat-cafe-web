import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartLine = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  modifiers?: { name: string; priceDelta: number }[];
};

type AppState = {
  organizationId: string | null;
  branchId: string | null;
  tableSessionId: string | null;
  tableId: string | null;
  cart: CartLine[];
  setTenant: (orgId: string, branchId: string) => void;
  setSession: (sessionId: string, tableId: string) => void;
  addToCart: (line: CartLine) => void;
  updateQty: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      organizationId: null,
      branchId: null,
      tableSessionId: null,
      tableId: null,
      cart: [],
      setTenant: (organizationId, branchId) => set({ organizationId, branchId }),
      setSession: (tableSessionId, tableId) => set({ tableSessionId, tableId }),
      addToCart: (line) =>
        set((s) => {
          const idx = s.cart.findIndex(
            (c) => c.menuItemId === line.menuItemId && JSON.stringify(c.modifiers) === JSON.stringify(line.modifiers),
          );
          if (idx >= 0) {
            const cart = [...s.cart];
            cart[idx] = { ...cart[idx], quantity: cart[idx].quantity + line.quantity };
            return { cart };
          }
          return { cart: [...s.cart, line] };
        }),
      updateQty: (menuItemId, quantity) =>
        set((s) => ({
          cart:
            quantity <= 0
              ? s.cart.filter((c) => c.menuItemId !== menuItemId)
              : s.cart.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity } : c)),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    { name: 'cafe-app' },
  ),
);
