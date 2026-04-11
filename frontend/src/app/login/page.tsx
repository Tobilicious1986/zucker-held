"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore, type ProfileInfo, type WatchedProfile } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { getBzStatus } from "@/lib/utils";

interface ProfileListItem {
  id: string;
  name: string;
  avatar: string;
  type: "kind" | "erwachsen";
  role: "patient" | "admin" | "caregiver" | "observer";
  hasPin: boolean;
  pinLength: 4 | 6;
  ageGroup: "child_young" | "child_teen" | "adult";
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: ProfileInfo;
}

interface ProfileLinkResponse {
  id: string;
  owner: { id: string; name: string; avatar: string; role: string };
  watcher: { id: string; name: string; avatar: string };
  role: "OBSERVER" | "CAREGIVER" | "ADMIN";
  status: string;
}

export default function LoginPage() {
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const setAuth      = useAuthStore((s) => s.setAuth);
  const setWatched   = useAuthStore((s) => s.setWatchedProfiles);
  const setViewing   = useAuthStore((s) => s.setViewingProfile);
  const showToast    = useUiStore((s) => s.showToast);
  const currentAuth  = useAuthStore((s) => s.activeProfile);
  const watchedInStore = useAuthStore((s) => s.watchedProfiles);

  const [selectedProfile, setSelectedProfile] = useState<ProfileListItem | null>(null);
  const [pin, setPin]                         = useState("");
  const [showCodeInput, setShowCodeInput]     = useState(false);
  const [inviteCode, setInviteCode]           = useState("");

  // Meine eigenen Profile laden
  const { data: profiles = [], isLoading } = useQuery<ProfileListItem[]>({
    queryKey: ["profiles"],
    queryFn: () => apiClient.get("/api/v1/profiles"),
  });

  // Wenn ich eingeloggt bin: Profile die ich beobachte laden
  const { data: watchingLinks = [] } = useQuery<ProfileLinkResponse[]>({
    queryKey: ["watching", currentAuth?.id],
    queryFn: () => apiClient.get(`/api/v1/profiles/${currentAuth!.id}/watching`),
    enabled: !!currentAuth,
    onSuccess: (links) => {
      const watched: WatchedProfile[] = links.map((l) => ({
        linkId: l.id,
        ownerId: l.owner.id,
        ownerName: l.owner.name,
        ownerAvatar: l.owner.avatar,
        role: l.role.toLowerCase() as WatchedProfile["role"],
      }));
      setWatched(watched);
    },
  } as any);

  const loginMutation = useMutation({
    mutationFn: (vars: { profileId: string; pin?: string }) =>
      apiClient.post<AuthResponse>("/api/v1/auth/login", vars),
    onSuccess: (data) => {
      setAuth(data.token, data.refreshToken, data.user);
      router.replace("/dashboard");
    },
    onError: () => {
      showToast("Falscher PIN. Bitte erneut versuchen.", "error");
      setPin("");
    },
  });

  // Einladungscode einlösen
  const acceptMutation = useMutation({
    mutationFn: (code: string) =>
      apiClient.post("/api/v1/profile-links/accept", { inviteCode: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watching"] });
      showToast("Zugriff gewährt ✅ Du kannst jetzt dieses Profil beobachten.", "success");
      setShowCodeInput(false);
      setInviteCode("");
    },
    onError: () => showToast("Ungültiger oder abgelaufener Code.", "error"),
  });

  function handleProfileSelect(profile: ProfileListItem) {
    if (!profile.hasPin) {
      loginMutation.mutate({ profileId: profile.id });
    } else {
      setSelectedProfile(profile);
      setPin("");
    }
  }

  function handlePinKey(key: string) {
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const maxLen = selectedProfile?.pinLength ?? 4;
    if (pin.length >= maxLen) return;
    const newPin = pin + key;
    setPin(newPin);
    if (newPin.length === maxLen && selectedProfile) {
      loginMutation.mutate({ profileId: selectedProfile.id, pin: newPin });
    }
  }

  function handleObserverLogin(watched: WatchedProfile) {
    // Observer-Mode: als aktuell angemeldetes Profil die Daten eines anderen ansehen
    setViewing(watched.ownerId);
    router.push("/observer");
  }

  // ── PIN-Eingabe-Screen ─────────────────────────────────────────────────
  if (selectedProfile) {
    const pinLen = selectedProfile.pinLength ?? 4;
    return (
      <div className="min-h-screen bg-zh-bg flex flex-col items-center justify-center p-6 relative">
        <button
          onClick={() => { setSelectedProfile(null); setPin(""); }}
          className="absolute top-4 left-4 text-zh-muted text-2xl"
        >
          ←
        </button>
        <div className="text-6xl mb-4">{selectedProfile.avatar}</div>
        <h1 className="text-2xl font-bold text-zh-text mb-1">{selectedProfile.name}</h1>
        <p className="text-zh-muted mb-8">
          {pinLen === 6 ? "6-stellige PIN eingeben" : "PIN eingeben"}
        </p>

        {/* PIN-Punkte */}
        <div className="flex gap-3 mb-8">
          {Array.from({ length: pinLen }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length ? "bg-zh-green border-zh-green" : "border-gray-300"
              }`}
            />
          ))}
        </div>

        {/* PIN-Tastatur */}
        <div className="grid grid-cols-3 gap-3 w-72">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => (
            <button
              key={idx}
              disabled={!key}
              onClick={() => key && handlePinKey(key)}
              className={`h-16 rounded-2xl text-2xl font-semibold transition-all active:scale-95 ${
                key
                  ? "bg-white shadow text-zh-text hover:bg-gray-50"
                  : "invisible"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {loginMutation.isPending && (
          <p className="mt-6 text-zh-muted animate-pulse">Anmelden…</p>
        )}
      </div>
    );
  }

  // ── Hauptbildschirm: 3 Bereiche ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-zh-bg flex flex-col p-6 pt-12">
      <div className="text-center mb-8">
        <div className="text-5xl mb-2">🩸</div>
        <h1 className="text-3xl font-bold text-zh-text">Zucker-Held</h1>
      </div>

      {/* Bereich 1: Meine Profile */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-zh-muted mb-3 uppercase tracking-wide">
          Meine Profile
        </p>
        {isLoading ? (
          <div className="text-3xl text-center animate-pulse">⏳</div>
        ) : (
          <div className="flex flex-col gap-3">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProfileSelect(p)}
                className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-98"
              >
                <span className="text-4xl">{p.avatar}</span>
                <div className="text-left flex-1">
                  <div className="font-semibold text-zh-text">{p.name}</div>
                  <div className="text-sm text-zh-muted capitalize">
                    {p.role === "admin" ? "Admin" :
                     p.role === "caregiver" ? "Betreuer" :
                     p.role === "observer" ? "Beobachter" : "Patient"}
                    {" · "}
                    {p.ageGroup === "child_young" ? "Kind" :
                     p.ageGroup === "child_teen"  ? "Jugendlich" : "Erwachsen"}
                  </div>
                </div>
                {p.hasPin && <span className="text-gray-400">🔒</span>}
              </button>
            ))}
            {profiles.length === 0 && (
              <p className="text-center text-zh-muted text-sm py-4">
                Keine Profile gefunden.<br />Bitte Backend starten.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bereich 2: Ich beobachte (nur wenn eingeloggt und Watching-Links vorhanden) */}
      {watchedInStore.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-zh-muted mb-3 uppercase tracking-wide">
            Ich beobachte
          </p>
          <div className="flex flex-col gap-2">
            {watchedInStore.map((w) => (
              <button
                key={w.linkId}
                onClick={() => handleObserverLogin(w)}
                className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-98"
              >
                <span className="text-3xl">{w.ownerAvatar}</span>
                <div className="text-left flex-1">
                  <div className="font-semibold text-zh-text">{w.ownerName}</div>
                  <div className="text-sm text-zh-muted">
                    {w.role === "admin" ? "Admin-Zugang" :
                     w.role === "caregiver" ? "Betreuer" : "Beobachter"}
                    {w.lastBz != null && (
                      <span className={`ml-2 font-medium ${getBzStatus(w.lastBz).color}`}>
                        · {w.lastBz} mg/dL {getBzStatus(w.lastBz).emoji}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-zh-muted">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bereich 3: Einladungscode eingeben */}
      <div>
        {!showCodeInput ? (
          <button
            onClick={() => setShowCodeInput(true)}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-zh-muted text-sm font-medium"
          >
            + Einladungscode eingeben
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-sm font-medium text-zh-text">Einladungscode eingeben</p>
            <p className="text-xs text-zh-muted">
              Jemand hat dir einen 8-stelligen Code geschickt um seine Werte mit dir zu teilen.
            </p>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="z.B. AB3X9YKL"
              maxLength={8}
              className="w-full bg-gray-50 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCodeInput(false); setInviteCode(""); }}
                className="flex-1 py-2 rounded-xl text-sm text-zh-muted bg-gray-100"
              >
                Abbrechen
              </button>
              <button
                onClick={() => inviteCode.length === 8 && acceptMutation.mutate(inviteCode)}
                disabled={inviteCode.length !== 8 || acceptMutation.isPending}
                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-zh-green text-white disabled:opacity-50"
              >
                {acceptMutation.isPending ? "…" : "Einlösen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
