"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore, type ProfileInfo, type WatchedProfile } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { getBzStatus } from "@/lib/utils";
import { RegisterForm } from "@/components/RegisterForm";
import { ConsentNotice } from "@/components/ui/ConsentNotice";

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
  profile: ProfileInfo;
}

interface ProfileLinkResponse {
  id: string;
  owner: { id: string; name: string; avatar: string; role: string };
  watcher: { id: string; name: string; avatar: string };
  role: "OBSERVER" | "CAREGIVER" | "ADMIN";
  relationshipKind: "FAMILY" | "PROFESSIONAL" | "SCHOOL" | "LEARNING_GUEST";
  accessScope: "LIVE_MEDICAL" | "SUMMARY_ONLY" | "LEARNING_ONLY";
  purpose: string;
  status: string;
}

const EMPTY_PROFILE_LINKS: ProfileLinkResponse[] = [];

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
  const [showRegister, setShowRegister]       = useState(false);

  // Meine eigenen Profile laden
  const { data: profiles = [], isLoading } = useQuery<ProfileListItem[]>({
    queryKey: ["profiles"],
    queryFn: () => apiClient.get("/api/v1/profiles"),
  });

  // Wenn ich eingeloggt bin: alle Profile die ich beobachte laden (alle Scopes)
  const watchingLinksQuery = useQuery<ProfileLinkResponse[]>({
    queryKey: ["all-watching", currentAuth?.id],
    queryFn: () => apiClient.get(`/api/v1/profiles/${currentAuth!.id}/all-watching`),
    enabled: !!currentAuth,
  });
  const watchingLinks = watchingLinksQuery.data ?? EMPTY_PROFILE_LINKS;

  useEffect(() => {
    const watched: WatchedProfile[] = watchingLinks.map((link) => ({
      linkId: link.id,
      ownerId: link.owner.id,
      ownerName: link.owner.name,
      ownerAvatar: link.owner.avatar,
      role: link.role.toLowerCase() as WatchedProfile["role"],
      relationshipKind: link.relationshipKind,
      accessScope: link.accessScope,
      purpose: link.purpose,
    }));
    setWatched(watched);
  }, [setWatched, watchingLinks]);

  const loginMutation = useMutation({
    mutationFn: (vars: { profileId: string; pin?: string }) =>
      apiClient.post<AuthResponse>("/api/v1/auth/login", vars),
    onSuccess: (data) => {
      setAuth(data.token, data.refreshToken, data.profile);
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
      apiClient.post<ProfileLinkResponse>("/api/v1/profile-links/accept", { inviteCode: code }),
    onSuccess: (link) => {
      queryClient.invalidateQueries({ queryKey: ["watching"] });
      if (link.accessScope === "LIVE_MEDICAL") {
        showToast("Freigabe aktiviert ✅ Das Profil erscheint jetzt in deiner Beobachtungsliste.", "success");
      } else if (link.accessScope === "SUMMARY_ONLY") {
        showToast("Freigabe aktiviert ✅ Diese Rolle ist aktuell auf Überblick und Zweckbindung begrenzt.", "success");
      } else {
        showToast("Lernzugang aktiviert ✅ Es werden keine Live-Daten freigegeben.", "success");
      }
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

  function handleWatchedLogin(watched: WatchedProfile) {
    setViewing(watched.ownerId);
    // Scope-basiertes Routing: jeder Zugriffstyp bekommt seinen eigenen Flow
    if (watched.accessScope === "SUMMARY_ONLY") {
      router.push(`/summary/${watched.ownerId}`);
    } else if (watched.accessScope === "LEARNING_ONLY") {
      router.push(`/learning/${watched.ownerId}`);
    } else {
      // LIVE_MEDICAL → klassischer Observer-Flow
      router.push("/observer");
    }
  }

  if (showRegister) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5">
        <RegisterForm onCancel={() => setShowRegister(false)} />
      </div>
    );
  }

  // ── PIN-Eingabe-Screen ─────────────────────────────────────────────────
  if (selectedProfile) {
    const pinLen = selectedProfile.pinLength ?? 4;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5 relative">
        <button
          onClick={() => { setSelectedProfile(null); setPin(""); }}
          className="icon-button absolute top-4 left-4"
        >
          ←
        </button>
        <div className="w-full max-w-sm space-y-5">
          <div className="surface-hero p-6 text-center">
            <div className="text-6xl mb-4">{selectedProfile.avatar}</div>
            <p className="page-eyebrow">Sicherer Profilzugang</p>
            <h1 className="page-title mt-2">{selectedProfile.name}</h1>
            <p className="page-subtitle">
              {pinLen === 6 ? "Bitte 6-stellige PIN eingeben" : "Bitte PIN eingeben"}
            </p>
          </div>

          <div className="surface-card p-6 space-y-6">
            <div className="flex justify-center gap-3">
              {Array.from({ length: pinLen }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 transition-all ${
                    i < pin.length
                      ? "bg-zh-green border-zh-green scale-110"
                      : "border-gray-300"
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => (
                <button
                  key={idx}
                  disabled={!key}
                  onClick={() => key && handlePinKey(key)}
                  className={`min-h-[4.25rem] rounded-[1.4rem] text-2xl font-bold transition-all active:scale-95 ${
                    key
                      ? "bg-gray-50 border border-gray-200 text-zh-text hover:bg-white"
                      : "invisible"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {loginMutation.isPending && (
            <p className="text-center text-zh-muted animate-pulse">Anmelden…</p>
          )}
        </div>
      </div>
    );
  }

  // ── Hauptbildschirm: 3 Bereiche ───────────────────────────────────────
  return (
    <div className="min-h-screen page-shell">
      <div className="page-stack max-w-xl mx-auto">
        <section className="surface-hero p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Adaptive Diabetes-Begleitung</p>
              <h1 className="page-title mt-3">Zucker-Held</h1>
              <p className="page-subtitle max-w-sm">
                Ein gemeinsamer Ort für Kind, Familie, Betreuung und Arztansicht.
                Schnell, ruhig und sicher im Alltag.
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-white/15 px-4 py-3 text-4xl shadow-lg">
              🩸
            </div>
          </div>
        </section>

        <section className="surface-card p-5 space-y-4">
          <div>
            <p className="section-eyebrow">Meine Profile</p>
            <h2 className="section-title text-xl mt-2">Schnell wieder einsteigen</h2>
            <p className="section-subtitle">
              Wähle dein Profil und starte direkt mit deinem passenden Modus.
            </p>
          </div>

          {isLoading ? (
            <div className="empty-state text-3xl animate-pulse">⏳</div>
          ) : (
            <div className="space-y-3">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProfileSelect(p)}
                  className="surface-muted w-full rounded-[1.6rem] p-4 flex items-center gap-4 text-left transition-transform active:scale-[0.99]"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-[1.35rem] bg-white text-4xl shadow-sm">
                    {p.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-zh-text text-base">{p.name}</div>
                    <div className="text-sm text-zh-muted capitalize mt-1">
                      {p.role === "admin" ? "Admin" :
                       p.role === "caregiver" ? "Betreuer" :
                       p.role === "observer" ? "Beobachter" : "Patient"}
                      {" · "}
                      {p.ageGroup === "child_young" ? "Kind" :
                       p.ageGroup === "child_teen" ? "Jugendlich" : "Erwachsen"}
                    </div>
                  </div>
                  <div className="text-right">
                    {p.hasPin ? (
                      <span className="status-pill status-pill--neutral">🔒 PIN</span>
                    ) : (
                      <span className="status-pill status-pill--good">Direkt</span>
                    )}
                  </div>
                </button>
              ))}
              {profiles.length === 0 && (
                <div className="empty-state">
                  <p>
                    Keine Profile gefunden.
                    <br />
                    Du kannst direkt ein neues Konto anlegen.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setShowRegister(true)}
            className="secondary-button w-full"
          >
            ✨ Neues Konto erstellen
          </button>
        </section>

        {watchedInStore.length > 0 && (
          <section className="surface-card p-5 space-y-4">
            <div>
              <p className="section-eyebrow">Ich beobachte</p>
              <h2 className="section-title text-xl mt-2">Freigegebene Profile</h2>
            </div>

            <div className="space-y-3">
              {watchedInStore.map((w) => (
                <button
                  key={w.linkId}
                  onClick={() => handleWatchedLogin(w)}
                  className="surface-muted w-full rounded-[1.6rem] p-4 flex items-center gap-4 text-left transition-transform active:scale-[0.99]"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-[1.2rem] bg-white text-3xl shadow-sm">
                    {w.ownerAvatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-zh-text">{w.ownerName}</div>
                    <div className="text-sm text-zh-muted mt-1">
                      {w.accessScope === "SUMMARY_ONLY"
                        ? "Wochenzusammenfassung · kein Live-Zugriff"
                        : w.accessScope === "LEARNING_ONLY"
                        ? "Lern- & Notfallzugang · keine Messwerte"
                        : w.relationshipKind === "PROFESSIONAL"
                        ? "Fachperson · Live-Medizinansicht"
                        : w.role === "admin"
                        ? "Familie · Verwaltung"
                        : "Familie · Betreuung"}
                    </div>
                    <div className="text-xs text-zh-muted mt-1">{w.purpose}</div>
                    {w.accessScope === "LIVE_MEDICAL" && w.lastBz != null && (
                      <div className={`text-sm mt-1 font-semibold ${getBzStatus(w.lastBz).color}`}>
                        {w.lastBz} mg/dL {getBzStatus(w.lastBz).emoji}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      w.accessScope === "SUMMARY_ONLY"
                        ? "bg-blue-100 text-blue-700"
                        : w.accessScope === "LEARNING_ONLY"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {w.accessScope === "SUMMARY_ONLY" ? "Überblick"
                       : w.accessScope === "LEARNING_ONLY" ? "Lernen"
                       : "Live"}
                    </span>
                    <span className="text-xl text-zh-muted">→</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {!showCodeInput ? (
          <button
            onClick={() => setShowCodeInput(true)}
            className="ghost-button w-full"
          >
            + Einladungscode eingeben
          </button>
        ) : (
          <section className="surface-card p-5 space-y-4">
            <div>
              <p className="section-eyebrow">Familie & Betreuung</p>
              <h2 className="section-title text-xl mt-2">Einladungscode einlösen</h2>
              <p className="section-subtitle">
                Gib den 8-stelligen Code ein, um ein geteiltes Profil sicher freizuschalten.
              </p>
            </div>

            <ConsentNotice
              title="Der Code schaltet nur die freigegebene Rolle frei"
              text="Beziehungstyp und Rechte werden im Code zusammen freigeschaltet. Beobachter bleiben lesend; Schule, Alltag und Gast-Lernen erhalten keinen automatischen Live-Zugriff."
              tone="warning"
              badge="Freigabe"
            />

            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="AB3X9YKL"
              maxLength={8}
              className="input-base text-center text-xl font-mono tracking-[0.35em]"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setShowCodeInput(false); setInviteCode(""); }}
                className="secondary-button w-full"
              >
                Abbrechen
              </button>
              <button
                onClick={() => inviteCode.length === 8 && acceptMutation.mutate(inviteCode)}
                disabled={inviteCode.length !== 8 || acceptMutation.isPending}
                className="primary-button w-full disabled:opacity-50"
              >
                {acceptMutation.isPending ? "Prüfe…" : "Einlösen"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
