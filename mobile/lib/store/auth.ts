import { create } from "zustand";

type AuthState = {
  token: string | null;
  setToken: (t: string) => void;
  clearToken: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (t) => set({ token: t }),
  clearToken: () => set({ token: null }),
}));
