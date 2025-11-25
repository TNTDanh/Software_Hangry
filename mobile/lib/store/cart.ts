import { create } from "zustand";

export type Item = {
  _id: string;
  name: string;
  nameEn?: string;
  price: number;
  image?: string | null;
  quantity: number;
  restaurantId?: string;
  deliveryModes?: string[];
};

type Addable =
  | {
      _id?: string;
      id?: string;
      name: string;
      nameEn?: string;
      price: number;
      image?: string | null;
      quantity?: number;
      qty?: number;
      restaurantId?: string;
      deliveryModes?: string[];
    };

type CartState = {
  items: Item[];
  addItem: (it: Addable) => void;
  inc: (_id: string) => void;
  dec: (_id: string) => void;
  remove: (_id: string) => void;
  clearCart: () => void;
  total: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  // Hỗ trợ cả id/qty và _id/quantity, tự normalize về {_id, quantity}
  addItem: (it) =>
    set((s) => {
      const _id = (it._id ?? it.id) as string | undefined;
      if (!_id) return s;

      const qtyToAdd = Number(it.quantity ?? it.qty ?? 1) || 1;
      const price = Number(it.price || 0);
      const nameEn = (it as any)?.nameEn;

      const idx = s.items.findIndex((x) => x._id === _id);
      if (idx >= 0) {
        const next = [...s.items];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + qtyToAdd,
          restaurantId: next[idx].restaurantId || it.restaurantId,
          deliveryModes: next[idx].deliveryModes || it.deliveryModes,
          nameEn: next[idx].nameEn || nameEn,
        };
        return { items: next };
      }
      return {
        items: [
          ...s.items,
          {
            _id,
            name: it.name,
            price,
            image: it.image ?? null,
            quantity: qtyToAdd,
            restaurantId: it.restaurantId,
            deliveryModes: it.deliveryModes,
            nameEn,
          },
        ],
      };
    }),

  inc: (_id) =>
    set((s) => ({
      items: s.items.map((x) =>
        x._id === _id ? { ...x, quantity: x.quantity + 1 } : x
      ),
    })),

  // Giảm nhưng không dưới 1 (CartScreen sẽ hỏi xóa khi đang = 1)
  dec: (_id) =>
    set((s) => ({
      items: s.items.map((x) =>
        x._id === _id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x
      ),
    })),

  remove: (_id) =>
    set((s) => ({ items: s.items.filter((x) => x._id !== _id) })),

  clearCart: () => set({ items: [] }),

  total: () =>
    get().items.reduce((sum, x) => sum + Number(x.price || 0) * x.quantity, 0),
}));
