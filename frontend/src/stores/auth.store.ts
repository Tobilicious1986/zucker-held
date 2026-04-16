import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProfileInfo {
  id: string;
  name: string;
  avatar: string;
  type: "kind" | "erwachsen";
  role: "patient" | "admin" | "caregiver" | "observer";
  hasPin: boolean;
  pinLength: 4 | 6;
  ageGroup: "child_young" | "child_teen" | "adult";
}

export interface WatchedProfile {
  linkId: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  role: "observer" | "caregiver" | "admin";
  relationshipKind: "FAMILY" | "PROFESSIONAL" | "SCHOOL" | "LEARNING_GUEST";
  accessScope: "LIVE_MEDICAL" | "SUMMARY_ONLY" | "LEARNING_ONLY";
  purpose: string;
  lastBz?: number | null;
}

export interface PrivacyRequestState {
  status: "none" | "requested" | "revoked";
  requestedAt: string | null;
  revokedAt: string | null;
  transport: "backend" | "local" | null;
  note: string | null;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  elevatedToken: string | null;
  activeProfile: ProfileInfo | null;
  isElevated: boolean;
  // Sprint 3: Observer-Mode + Familie
  viewingProfileId: string | null;   // Fremdes Profil das ich gerade beobachte
  watchedProfiles: WatchedProfile[]; // Liste aller Profile die ich beobachte
  elevationExpiresAt: number | null; // BL-H02: Timestamp wann Elevation abläuft
  privacyRequest: PrivacyRequestState;

  setAuth: (token: string, refreshToken: string, profile: ProfileInfo) => void;
  setElevated: (elevatedToken: string) => void;
  clearAuth: () => void;
  clearElevated: () => void;

  // Observer-Mode
  setViewingProfile: (profileId: string | null) => void;
  setWatchedProfiles: (profiles: WatchedProfile[]) => void;
  setPrivacyRequest: (request: PrivacyRequestState) => void;

  // BL-H02: Elevation mit Timeout
  setElevatedWithTimeout: (elevatedToken: string, durationMs?: number) => void;
  checkElevationExpiry: () => void;
}

const ELEVATION_DURATION_MS = 15 * 60 * 1000; // 15 Minuten

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      elevatedToken: null,
      activeProfile: null,
      isElevated: false,
      viewingProfileId: null,
      watchedProfiles: [],
      elevationExpiresAt: null,
      privacyRequest: {
        status: "none",
        requestedAt: null,
        revokedAt: null,
        transport: null,
        note: null,
      },

      setAuth: (token, refreshToken, profile) =>
        set({
          token,
          refreshToken,
          activeProfile: profile,
          isElevated: false,
          elevatedToken: null,
          elevationExpiresAt: null,
          viewingProfileId: null,
          watchedProfiles: [],
          privacyRequest: {
            status: "none",
            requestedAt: null,
            revokedAt: null,
            transport: null,
            note: null,
          },
        }),

      setElevated: (elevatedToken) => set({ elevatedToken, isElevated: true }),

      // BL-H02: Elevation mit 15-Min-Timeout
      setElevatedWithTimeout: (elevatedToken, durationMs = ELEVATION_DURATION_MS) => {
        set({
          elevatedToken,
          isElevated: true,
          elevationExpiresAt: Date.now() + durationMs,
        });
      },

      // BL-H02: Prüfen ob Elevation abgelaufen ist
      checkElevationExpiry: () => {
        const { elevationExpiresAt, isElevated } = get();
        if (isElevated && elevationExpiresAt && Date.now() > elevationExpiresAt) {
          set({ elevatedToken: null, isElevated: false, elevationExpiresAt: null });
        }
      },

      clearAuth: () =>
        set({
          token: null,
          refreshToken: null,
          elevatedToken: null,
          activeProfile: null,
          isElevated: false,
          viewingProfileId: null,
          watchedProfiles: [],
          elevationExpiresAt: null,
          privacyRequest: {
            status: "none",
            requestedAt: null,
            revokedAt: null,
            transport: null,
            note: null,
          },
        }),

      clearElevated: () =>
        set({ elevatedToken: null, isElevated: false, elevationExpiresAt: null }),

      setViewingProfile: (profileId) => set({ viewingProfileId: profileId }),

      setWatchedProfiles: (profiles) => set({ watchedProfiles: profiles }),

      setPrivacyRequest: (request) => set({ privacyRequest: request }),
    }),
    {
      name: "zucker-held-auth",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        activeProfile: state.activeProfile,
        watchedProfiles: state.watchedProfiles,
        viewingProfileId: state.viewingProfileId,
        privacyRequest: state.privacyRequest,
        // elevationExpiresAt wird NICHT persistiert — soll nach Browser-Neustart weg sein
      }),
    }
  )
);
