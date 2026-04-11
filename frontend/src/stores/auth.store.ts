import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProfileInfo {
  id: string;
  name: string;
  avatar: string;
  type: "kind" | "erwachsen";
  role: "patient" | "admin" | "caregiver" | "observer";
  hasPin: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  elevatedToken: string | null;
  activeProfile: ProfileInfo | null;
  isElevated: boolean;
  setAuth: (token: string, refreshToken: string, profile: ProfileInfo) => void;
  setElevated: (elevatedToken: string) => void;
  clearAuth: () => void;
  clearElevated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      elevatedToken: null,
      activeProfile: null,
      isElevated: false,

      setAuth: (token, refreshToken, profile) =>
        set({ token, refreshToken, activeProfile: profile, isElevated: false, elevatedToken: null }),

      setElevated: (elevatedToken) => set({ elevatedToken, isElevated: true }),

      clearAuth: () =>
        set({ token: null, refreshToken: null, elevatedToken: null, activeProfile: null, isElevated: false }),

      clearElevated: () => set({ elevatedToken: null, isElevated: false }),
    }),
    {
      name: "zucker-held-auth",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        activeProfile: state.activeProfile,
      }),
    }
  )
);
