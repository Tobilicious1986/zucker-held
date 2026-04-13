"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { validateInsulinParams } from "@/lib/utils";

interface Settings {
  bzMin: number;
  bzMax: number;
  contacts: string;
  targetBz: number;
  insulinRatio: number;
  correctionFactor: number;
  aiProvider: string;
  notificationsEnabled: boolean;
  dailySummaryEnabled: boolean;
  themeMode: "light" | "dark" | "system";
  guardianPingEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  adaptiveBolusEnabled: boolean;
}

interface ProfileLinkResponse {
  id: string;
  owner: { id: string; name: string; avatar: string };
  watcher: { id: string; name: string; avatar: string } | null;
  role: "OBSERVER" | "CAREGIVER" | "ADMIN";
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  createdAt: string;
}

interface InviteResponse {
  id: string;
  inviteCode: string;
  ownerId: string;
  role: string;
  expiresAt: string;
}

interface ShareLinkResponse {
  id: string;
  mode: "DOCTOR" | "MINI";
  token: string;
  expiresAt: string;
  revoked: boolean;
}

interface AuditLogResponse {
  id: number;
  actorName: string;
  action: string;
  details: string;
  createdAt: string;
}

const SETTING_FIELDS: Array<{
  label: string;
  key: keyof Settings;
  section: string;
  type: "number";
}> = [
  { label: "Minimum (mg/dL)",          key: "bzMin",            section: "BZ-Zielbereich", type: "number" },
  { label: "Maximum (mg/dL)",          key: "bzMax",            section: "BZ-Zielbereich", type: "number" },
  { label: "Zielwert (mg/dL)",         key: "targetBz",         section: "BZ-Zielbereich", type: "number" },
  { label: "Insulin-Faktor (g KH/IE)", key: "insulinRatio",     section: "Insulin",        type: "number" },
  { label: "Korrekturfaktor (mg/dL/IE)", key: "correctionFactor", section: "Insulin",       type: "number" },
];

export default function SettingsPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const clearAuth   = useAuthStore((s) => s.clearAuth);
  const profile     = useAuthStore((s) => s.activeProfile);
  const showToast   = useUiStore((s) => s.showToast);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole]           = useState<"OBSERVER" | "CAREGIVER" | "ADMIN">("OBSERVER");
  const [generatedCode, setGeneratedCode]     = useState<string | null>(null);
  const [shareMode, setShareMode]             = useState<"DOCTOR" | "MINI">("DOCTOR");
  const [shareTtlHours, setShareTtlHours]     = useState(24);

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => apiClient.get("/api/v1/settings"),
  });

  // Watcher laden (nur für Admin-Profile)
  const isAdmin = profile?.role === "admin";
  const canManageShareLinks = profile?.role === "patient" || profile?.role === "admin";
  const { data: watchers = [] } = useQuery<ProfileLinkResponse[]>({
    queryKey: ["watchers", profile?.id],
    queryFn: () => apiClient.get(`/api/v1/profiles/${profile!.id}/watchers`),
    enabled: !!profile && isAdmin,
  });

  const { data: shareLinks = [] } = useQuery<ShareLinkResponse[]>({
    queryKey: ["share-links", profile?.id],
    queryFn: () => apiClient.get("/api/v1/share-links"),
    enabled: !!profile,
  });

  const { data: auditLogs = [] } = useQuery<AuditLogResponse[]>({
    queryKey: ["audit-logs", profile?.id],
    queryFn: () => apiClient.get("/api/v1/audit-logs?size=12"),
    enabled: !!profile,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Settings>) => apiClient.put("/api/v1/settings", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      // BL-S01: Warnung bei unrealistischen Insulin-Parametern
      const updated = { ...settings, ...variables } as Settings;
      const warnings = validateInsulinParams(updated.insulinRatio, updated.correctionFactor, updated.targetBz);
      if (warnings.length > 0) {
        showToast(`⚠️ ${warnings[0].message}`, "warning");
      } else {
        showToast("Einstellungen gespeichert ✅", "success");
      }
    },
    onError: () => showToast("Fehler beim Speichern", "error"),
  });

  const inviteMutation = useMutation({
    mutationFn: (role: string) =>
      apiClient.post<InviteResponse>(`/api/v1/profiles/${profile!.id}/invite`, { role }),
    onSuccess: (data) => {
      setGeneratedCode(data.inviteCode);
    },
    onError: () => showToast("Fehler beim Erstellen der Einladung", "error"),
  });

  const revokeMutation = useMutation({
    mutationFn: (linkId: string) => apiClient.delete(`/api/v1/profile-links/${linkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchers"] });
      showToast("Zugriff entzogen ✅", "success");
    },
    onError: () => showToast("Fehler beim Widerrufen", "error"),
  });

  const createShareLinkMutation = useMutation({
    mutationFn: () =>
      apiClient.post<ShareLinkResponse>("/api/v1/share-links", {
        mode: shareMode,
        ttlHours: shareTtlHours,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-links"] });
      showToast("Share-Link erstellt ✅", "success");
    },
    onError: () => showToast("Share-Link konnte nicht erstellt werden.", "error"),
  });

  const revokeShareLinkMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/share-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["share-links"] });
      showToast("Share-Link widerrufen ✅", "success");
    },
    onError: () => showToast("Share-Link konnte nicht widerrufen werden.", "error"),
  });

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  async function copyShareUrl(token: string) {
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link kopiert ✅", "success");
    } catch {
      showToast("Kopieren nicht möglich. Link manuell verwenden.", "warning");
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="flex h-full items-center justify-center text-4xl animate-pulse">⏳</div>
    );
  }

  // Felder nach Sektionen gruppieren
  const sections = [...new Set(SETTING_FIELDS.map((f) => f.section))];
  const shareOrigin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-2xl text-zh-muted">←</button>
        <h1 className="text-2xl font-bold">⚙️ Einstellungen</h1>
      </div>

      {/* Profil-Info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
        <span className="text-4xl">{profile?.avatar}</span>
        <div>
          <p className="font-semibold text-zh-text">{profile?.name}</p>
          <p className="text-sm text-zh-muted capitalize">
            {profile?.role} · {profile?.type === "kind" ? "Kind" : "Erwachsen"}
          </p>
        </div>
      </div>

      {sections.map((section) => {
        // BL-S01: Warnungen für Insulin-Sektion berechnen
        const insulinWarnings = section === "Insulin"
          ? validateInsulinParams(settings.insulinRatio, settings.correctionFactor, settings.targetBz)
          : [];
        return (
          <div key={section} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="font-semibold text-zh-text">
              {section === "BZ-Zielbereich" ? "🎯" : "💉"} {section}
            </h2>
            {SETTING_FIELDS.filter((f) => f.section === section).map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs text-zh-muted">{label}</label>
                <input
                  type="number"
                  defaultValue={settings[key] as number}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) mutation.mutate({ [key]: val });
                  }}
                  className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2 outline-none text-zh-text"
                />
              </div>
            ))}
            {insulinWarnings.map((w) => (
              <div key={w.field} className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
                <span className="shrink-0">⚠️</span>
                <p><strong>{w.field}:</strong> {w.message}</p>
              </div>
            ))}
          </div>
        );
      })}

      {/* KI-Provider */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
        <h2 className="font-semibold text-zh-text">🤖 KI-Provider</h2>
        <div className="flex gap-2">
          {["claude", "openai", "gemini"].map((provider) => (
            <button
              key={provider}
              onClick={() => mutation.mutate({ aiProvider: provider })}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                settings.aiProvider === provider
                  ? "bg-zh-green text-white"
                  : "bg-gray-100 text-zh-text"
              }`}
            >
              {provider}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
        <h2 className="font-semibold text-zh-text">🎨 Darstellung</h2>
        <div className="flex gap-2">
          {[
            { id: "light", label: "Hell", emoji: "☀️" },
            { id: "dark", label: "Dunkel", emoji: "🌙" },
            { id: "system", label: "System", emoji: "🖥️" },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => mutation.mutate({ themeMode: theme.id as Settings["themeMode"] })}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${
                settings.themeMode === theme.id
                  ? "bg-zh-green text-white"
                  : "bg-gray-100 text-zh-text"
              }`}
            >
              {theme.emoji} {theme.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-zh-text">🔔 Benachrichtigungen</h2>

        <button
          onClick={() => mutation.mutate({ notificationsEnabled: !settings.notificationsEnabled })}
          className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between transition-colors ${
            settings.notificationsEnabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-zh-muted"
          }`}
        >
          <div className="text-left">
            <p className="font-semibold">Benachrichtigungen aktiv</p>
            <p className="text-xs">
              Kritische Hinweise und Erinnerungen über die App erhalten.
            </p>
          </div>
          <span className="text-2xl">{settings.notificationsEnabled ? "🟢" : "⚪"}</span>
        </button>

        <button
          onClick={() => mutation.mutate({ dailySummaryEnabled: !settings.dailySummaryEnabled })}
          disabled={!settings.notificationsEnabled}
          className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between transition-colors ${
            settings.notificationsEnabled
              ? settings.dailySummaryEnabled
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-100 text-zh-text"
              : "bg-gray-50 text-gray-400"
          } disabled:cursor-not-allowed`}
        >
          <div className="text-left">
            <p className="font-semibold">Tageszusammenfassung</p>
            <p className="text-xs">
              Jeden Abend um 20:00 Uhr eine kurze Zusammenfassung verschicken.
            </p>
          </div>
          <span className="text-2xl">
            {settings.dailySummaryEnabled && settings.notificationsEnabled ? "🌙" : "🕗"}
          </span>
        </button>

        {!settings.notificationsEnabled && (
          <p className="text-xs text-orange-600">
            Bitte zuerst Benachrichtigungen aktivieren, damit die Tageszusammenfassung gesendet werden kann.
          </p>
        )}

        <button
          onClick={() => mutation.mutate({ guardianPingEnabled: !settings.guardianPingEnabled })}
          className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between transition-colors ${
            settings.guardianPingEnabled ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-zh-muted"
          }`}
        >
          <div className="text-left">
            <p className="font-semibold">Eltern-Ping erlaubt</p>
            <p className="text-xs">
              Kind/Jugendliche können Betreuer mit einem Tipp benachrichtigen.
            </p>
          </div>
          <span className="text-2xl">{settings.guardianPingEnabled ? "📣" : "🔕"}</span>
        </button>

        <div className="rounded-2xl bg-gray-50 p-3 space-y-2">
          <p className="text-sm font-semibold text-zh-text">Ruhezeiten für Erinnerungen</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-zh-muted">
              Start
              <select
                value={settings.quietHoursStart}
                onChange={(e) => mutation.mutate({ quietHoursStart: Number(e.target.value) })}
                className="w-full mt-1 bg-white rounded-xl px-2 py-2 text-sm outline-none"
              >
                {Array.from({ length: 24 }).map((_, hour) => (
                  <option key={`start-${hour}`} value={hour}>
                    {String(hour).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-zh-muted">
              Ende
              <select
                value={settings.quietHoursEnd}
                onChange={(e) => mutation.mutate({ quietHoursEnd: Number(e.target.value) })}
                className="w-full mt-1 bg-white rounded-xl px-2 py-2 text-sm outline-none"
              >
                {Array.from({ length: 24 }).map((_, hour) => (
                  <option key={`end-${hour}`} value={hour}>
                    {String(hour).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-zh-text">🧠 Adaptive Dosierung</h2>
        <button
          onClick={() => mutation.mutate({ adaptiveBolusEnabled: !settings.adaptiveBolusEnabled })}
          className={`w-full rounded-2xl px-4 py-3 flex items-center justify-between transition-colors ${
            settings.adaptiveBolusEnabled ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-zh-muted"
          }`}
        >
          <div className="text-left">
            <p className="font-semibold">Adaptiven Hinweis aktivieren</p>
            <p className="text-xs">
              Zeigt beim Insulin-Rechner eine vorsichtige Historien-Anpassung als Empfehlung.
            </p>
          </div>
          <span className="text-2xl">{settings.adaptiveBolusEnabled ? "✅" : "⚪"}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-zh-text">🆘 Notfall</h2>
        <p className="text-xs text-zh-muted">
          Drucke eine einfache Notfall-Karte mit Unterzucker-/Überzucker-Hinweisen und Kontakten.
        </p>
        <button
          onClick={() => router.push("/emergency-card")}
          className="w-full py-3 rounded-2xl bg-red-50 text-red-600 font-semibold"
        >
          🆘 Notfall-Karte drucken
        </button>
      </div>

      {/* Einblick-Management (nur für Admin-Profile) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-zh-text">👥 Einblick für andere</h2>
          <p className="text-xs text-zh-muted">
            Wer kann deine Werte sehen? Erstelle einen Einladungslink für Eltern, Betreuer oder Ärzte.
          </p>

          {/* Bestehende Watcher */}
          {watchers.length > 0 && (
            <div className="space-y-2">
              {watchers.map((w) => (
                <div key={w.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span>{w.watcher?.avatar ?? "👤"}</span>
                    <div>
                      <p className="text-sm font-medium text-zh-text">
                        {w.watcher?.name ?? "Ausstehend"}
                      </p>
                      <p className="text-xs text-zh-muted">
                        {w.role === "ADMIN" ? "Admin" : w.role === "CAREGIVER" ? "Betreuer" : "Beobachter"}
                        {w.status === "PENDING" && " · Ausstehend"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => revokeMutation.mutate(w.id)}
                    className="text-xs text-red-500 px-2 py-1 rounded-lg bg-red-50"
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Einladung erstellen */}
          {!showInviteModal && !generatedCode && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-zh-green text-white"
            >
              + Einladungslink erstellen
            </button>
          )}

          {showInviteModal && !generatedCode && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zh-text">Rolle wählen:</p>
              <div className="flex gap-2">
                {(["OBSERVER", "CAREGIVER", "ADMIN"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setInviteRole(r)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium ${
                      inviteRole === r ? "bg-zh-green text-white" : "bg-gray-100 text-zh-text"
                    }`}
                  >
                    {r === "OBSERVER" ? "Beobachter" : r === "CAREGIVER" ? "Betreuer" : "Admin"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zh-muted">
                {inviteRole === "OBSERVER" && "Darf nur lesen — ideal für Arzt oder Schule."}
                {inviteRole === "CAREGIVER" && "Darf lesen und Einträge machen — ideal für Oma, Babysitter."}
                {inviteRole === "ADMIN" && "Voller Zugriff — ideal für Eltern."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2 rounded-xl text-sm bg-gray-100 text-zh-muted"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => inviteMutation.mutate(inviteRole)}
                  disabled={inviteMutation.isPending}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold bg-zh-green text-white disabled:opacity-50"
                >
                  {inviteMutation.isPending ? "…" : "Code erstellen"}
                </button>
              </div>
            </div>
          )}

          {/* Generierter Code */}
          {generatedCode && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
              <p className="text-sm font-medium text-green-700">Einladungscode erstellt!</p>
              <p className="text-3xl font-mono font-bold tracking-widest text-green-800">
                {generatedCode}
              </p>
              <p className="text-xs text-green-600">Gültig für 48 Stunden. Teile diesen Code mit der Person.</p>
              <button
                onClick={() => { setGeneratedCode(null); setShowInviteModal(false); }}
                className="text-xs text-green-700 underline"
              >
                Fertig
              </button>
            </div>
          )}
        </div>
      )}

      {canManageShareLinks && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-zh-text">🔗 Arzt-/Mini-Share</h2>
          <p className="text-xs text-zh-muted">
            Erstelle zeitlich begrenzte Links ohne Login (z.B. Arzttermin oder Trainer-Ansicht).
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShareMode("DOCTOR")}
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                shareMode === "DOCTOR" ? "bg-zh-green text-white" : "bg-gray-100 text-zh-text"
              }`}
            >
              🩺 Arzt-Link
            </button>
            <button
              onClick={() => setShareMode("MINI")}
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                shareMode === "MINI" ? "bg-zh-green text-white" : "bg-gray-100 text-zh-text"
              }`}
            >
              🧑‍🏫 Mini-Link
            </button>
          </div>
          <label className="text-xs text-zh-muted">
            Gültigkeit
            <select
              value={shareTtlHours}
              onChange={(e) => setShareTtlHours(Number(e.target.value))}
              className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2 outline-none text-zh-text"
            >
              <option value={12}>12 Stunden</option>
              <option value={24}>24 Stunden</option>
              <option value={48}>48 Stunden</option>
              <option value={72}>72 Stunden</option>
              <option value={168}>7 Tage</option>
            </select>
          </label>
          <button
            onClick={() => createShareLinkMutation.mutate()}
            disabled={createShareLinkMutation.isPending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-zh-green text-white disabled:opacity-50"
          >
            {createShareLinkMutation.isPending ? "Erstelle…" : "Share-Link erstellen"}
          </button>

          {shareLinks.length > 0 && (
            <div className="space-y-2">
              {shareLinks.map((link) => (
                <div key={link.id} className="rounded-xl bg-gray-50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zh-muted">
                    <span>{link.mode === "DOCTOR" ? "🩺 Arzt" : "🧑‍🏫 Mini"} · gültig bis {new Date(link.expiresAt).toLocaleString("de-DE")}</span>
                    {link.revoked && <span className="text-red-500">widerrufen</span>}
                  </div>
                  <p className="text-xs font-mono break-all text-zh-text">
                    {shareOrigin}/share/{link.token}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyShareUrl(link.token)}
                      className="flex-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold py-2"
                    >
                      Link kopieren
                    </button>
                    <button
                      onClick={() => revokeShareLinkMutation.mutate(link.id)}
                      disabled={revokeShareLinkMutation.isPending}
                      className="flex-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold py-2 disabled:opacity-50"
                    >
                      Widerrufen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {auditLogs.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-zh-text">🧾 Audit-Log</h2>
          <div className="space-y-2">
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-sm font-medium text-zh-text">
                  {log.action} · {log.actorName}
                </p>
                <p className="text-xs text-zh-muted mt-0.5">{log.details}</p>
                <p className="text-[11px] text-zh-muted mt-1">
                  {new Date(log.createdAt).toLocaleString("de-DE")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abmelden */}
      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 py-3 rounded-2xl font-semibold"
      >
        🚪 Abmelden
      </button>
    </div>
  );
}
