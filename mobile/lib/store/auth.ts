import { create } from "zustand";

type AuthState = {
  token: string | null;
  userId: string | null;
  role?: string | null;
  restaurantIds?: string[];
  setToken: (t: string) => void;
  setUser: (u: { token: string; userId?: string; role?: string; restaurantIds?: string[] }) => void;
  clearToken: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  role: null,
  restaurantIds: [],
  setToken: (t) => set({ token: t }),
  setUser: (u) =>
    set({
      token: u.token,
      userId: u.userId || null,
      role: u.role || null,
      restaurantIds: u.restaurantIds || [],
    }),
  clearToken: () => set({ token: null, userId: null, role: null, restaurantIds: [] }),
}));
