import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartLine = {
  lineId?: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  modifiers?: { modifierId: string; name: string; priceDelta: number }[];
};

type AppState = {
  organizationId: string | null;
  branchId: string | null;
  tableSessionId: string | null;
  tableId: string | null;
  cafeSlug: string | null;
  cart: CartLine[];
  setTenant: (orgId: string, branchId: string) => void;
  setSession: (sessionId: string, tableId: string) => void;
  setCafeSlug: (slug: string | null) => void;
  addToCart: (line: CartLine) => void;
  updateQty: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  reset: () => void;
};

export function lineId(line: CartLine) {
  const modifiers = (line.modifiers || [])
    .map((modifier) => modifier.modifierId)
    .sort()
    .join(',');
  const notes = (line.notes || '').trim();
  return `${line.menuItemId}:${modifiers}:${notes}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      organizationId: null,
      branchId: null,
      tableSessionId: null,
      tableId: null,
      cafeSlug: null,
      cart: [],
      setTenant: (organizationId, branchId) =>
        set((state) => {
          if (state.branchId && state.branchId !== branchId) {
            localStorage.removeItem('pos_shift');
            return {
              organizationId,
              branchId,
              tableSessionId: null,
              tableId: null,
              cart: [],
            };
          }
          return { organizationId, branchId };
        }),
      setSession: (tableSessionId, tableId) =>
        set((state) => {
          const tableChanged = state.tableId && state.tableId !== tableId;
          const sessionChanged =
            state.tableSessionId && state.tableSessionId !== tableSessionId;
          if (tableChanged || sessionChanged) {
            return { tableSessionId, tableId, cart: [] };
          }
          return { tableSessionId, tableId };
        }),
      setCafeSlug: (cafeSlug) =>
        set((state) => {
          if (state.cafeSlug && cafeSlug && state.cafeSlug !== cafeSlug) {
            return {
              cafeSlug,
              cart: [],
              tableSessionId: null,
              tableId: null,
            };
          }
          return { cafeSlug };
        }),
      addToCart: (line) =>
        set((s) => {
          const id = line.lineId || lineId(line);
          const idx = s.cart.findIndex((c) => (c.lineId || lineId(c)) === id);
          if (idx >= 0) {
            const cart = [...s.cart];
            cart[idx] = { ...cart[idx], lineId: id, quantity: cart[idx].quantity + line.quantity };
            return { cart };
          }
          return { cart: [...s.cart, { ...line, lineId: id }] };
        }),
      updateQty: (id, quantity) =>
        set((s) => {
          const byLine = s.cart.some((c) => (c.lineId || lineId(c)) === id);
          const matches = (c: CartLine) =>
            byLine ? (c.lineId || lineId(c)) === id : c.menuItemId === id;
          return {
            cart:
              quantity <= 0
                ? s.cart.filter((c) => !matches(c))
                : s.cart.map((c) => (matches(c) ? { ...c, quantity } : c)),
          };
        }),
      clearCart: () => set({ cart: [] }),
      reset: () => {
        localStorage.removeItem('pos_shift');
        set({
          organizationId: null,
          branchId: null,
          tableSessionId: null,
          tableId: null,
          cafeSlug: null,
          cart: [],
        });
      },
    }),
    { name: 'cafe-app' },
  ),
);
