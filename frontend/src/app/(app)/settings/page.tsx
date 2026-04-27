"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConsentNotice } from "@/components/ui/ConsentNotice";
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
  hasClaudeApiKey: boolean;
  hasOpenaiApiKey: boolean;
  hasGeminiApiKey: boolean;
  aiChatAvailable: boolean;
  aiAvailabilityReason: string;
}

interface ProfileLinkResponse {
  id: string;
  owner: { id: string; name: string; avatar: string };
  watcher: { id: string; name: string; avatar: string } | null;
  role: "OBSERVER" | "CAREGIVER" | "ADMIN";
  relationshipKind: "FAMILY" | "PROFESSIONAL" | "SCHOOL" | "LEARNING_GUEST";
  accessScope: "LIVE_MEDICAL" | "SUMMARY_ONLY" | "LEARNING_ONLY";
  professionalRole: "DOCTOR" | "DIABETES_COUNSELOR" | "NURSING" | "CLINIC_ADMIN" | null;
  purpose: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  inviteExpiresAt: string | null;
  accessDurationHours: number | null;
  expiresAt: string | null;
  createdAt: string;
}

interface InviteResponse {
  id: string;
  inviteCode: string;
  ownerId: string;
  role: "OBSERVER" | "CAREGIVER" | "ADMIN";
  relationshipKind: "FAMILY" | "PROFESSIONAL" | "SCHOOL" | "LEARNING_GUEST";
  accessScope: "LIVE_MEDICAL" | "SUMMARY_ONLY" | "LEARNING_ONLY";
  professionalRole: ProfileLinkResponse["professionalRole"];
  purpose: string;
  inviteExpiresAt: string | null;
  accessDurationHours: number | null;
  expiresAt: string | null;
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

interface PrivacyDeletionSummary {
  status: "NONE" | "REQUESTED" | "REVOKED";
  requestedAt: string | null;
  active: boolean;
}

interface PrivacyOverviewResponse {
  deletionRequest: PrivacyDeletionSummary;
  activeWatcherCount: number;
  pendingInviteCount: number;
  activeShareLinkCount: number;
}

interface PrivacyExportSnapshot {
  generatedAt: string;
  snapshotVersion: string;
  overview: PrivacyOverviewResponse;
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

type InvitePresetKey = "family" | "professional" | "school" | "learning";

const INVITE_PRESETS: Record<InvitePresetKey, {
  label: string;
  eyebrow: string;
  relationshipKind: ProfileLinkResponse["relationshipKind"];
  accessScope: ProfileLinkResponse["accessScope"];
  role: InviteResponse["role"];
  purpose: string;
  helper: string;
  caution: string;
  allowRoleChoice?: boolean;
  professional?: boolean;
}> = {
  family: {
    label: "Familie",
    eyebrow: "Mit Login",
    relationshipKind: "FAMILY",
    accessScope: "LIVE_MEDICAL",
    role: "CAREGIVER",
    purpose: "Familienbegleitung",
    helper: "Für Eltern und enge Bezugspersonen im Haushalt. Darf sehen und nur das, was wirklich freigegeben ist.",
    caution: "Familienrollen dürfen lesen; Schreib- und Verwaltungsrechte hängen weiterhin vom freigegebenen Rollentyp ab.",
    allowRoleChoice: true,
  },
  professional: {
    label: "Fachperson",
    eyebrow: "Mit Login",
    relationshipKind: "PROFESSIONAL",
    accessScope: "LIVE_MEDICAL",
    role: "OBSERVER",
    purpose: "Arzt- oder Beratungseinblick",
    helper: "Für Arzt, Diabetologie oder Beratung. Zeitlich begrenzte Lesefreigabe, keine Schreibrechte.",
    caution: "Fachpersonen bleiben lesend und erhalten keinen Admin-Zugriff.",
    professional: true,
  },
  school: {
    label: "Schule / Alltag",
    eyebrow: "Mit Login",
    relationshipKind: "SCHOOL",
    accessScope: "SUMMARY_ONLY",
    role: "OBSERVER",
    purpose: "Schule und Tagesbetreuung",
    helper: "Für Betreuung im Alltag oder in der Schule. Nur das Nötigste, keine vollständige Krankengeschichte.",
    caution: "Aktuell kein Live-Dashboard-Zugriff. Für reine Leselinks ohne Login lieber Share-Links nutzen.",
  },
  learning: {
    label: "Gast-Lernen",
    eyebrow: "Mit Login",
    relationshipKind: "LEARNING_GUEST",
    accessScope: "LEARNING_ONLY",
    role: "OBSERVER",
    purpose: "Lern- und Notfallhilfe",
    helper: "Nur Lerninhalte und Notfallwissen, keine Live-Daten.",
    caution: "Dieser Zugang ist bewusst ohne Live-Medizinzugriff und dient nur Lernen und Notfallhilfe.",
  },
};

function roleLabel(role: ProfileLinkResponse["role"]) {
  return role === "ADMIN" ? "Admin" : role === "CAREGIVER" ? "Betreuung" : "Lesend";
}

function relationshipLabel(kind: ProfileLinkResponse["relationshipKind"]) {
  if (kind === "PROFESSIONAL") return "Fachperson";
  if (kind === "SCHOOL") return "Schule & Alltag";
  if (kind === "LEARNING_GUEST") return "Gast-Lernen";
  return "Familie";
}

function accessScopeLabel(scope: ProfileLinkResponse["accessScope"]) {
  if (scope === "LEARNING_ONLY") return "Nur Lernen / Notfall";
  if (scope === "SUMMARY_ONLY") return "Nur Überblick";
  return "Live-Medizin";
}

function professionalRoleLabel(role: ProfileLinkResponse["professionalRole"]) {
  if (role === "DIABETES_COUNSELOR") return "Diabetesberatung";
  if (role === "NURSING") return "Pflege";
  if (role === "CLINIC_ADMIN") return "Klinik-Admin";
  if (role === "DOCTOR") return "Arzt";
  return null;
}

export default function SettingsPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const clearAuth   = useAuthStore((s) => s.clearAuth);
  const profile     = useAuthStore((s) => s.activeProfile);
  const privacyRequest = useAuthStore((s) => s.privacyRequest);
  const setPrivacyRequest = useAuthStore((s) => s.setPrivacyRequest);
  const showToast   = useUiStore((s) => s.showToast);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitePreset, setInvitePreset]       = useState<InvitePresetKey>("family");
  const [inviteRole, setInviteRole]           = useState<"OBSERVER" | "CAREGIVER" | "ADMIN">("OBSERVER");
  const [professionalRole, setProfessionalRole] = useState<NonNullable<ProfileLinkResponse["professionalRole"]>>("DOCTOR");
  const [accessDurationHours, setAccessDurationHours] = useState(72);
  const [generatedInvite, setGeneratedInvite] = useState<InviteResponse | null>(null);
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

  const { data: pendingInvites = [] } = useQuery<ProfileLinkResponse[]>({
    queryKey: ["pending-invites", profile?.id],
    queryFn: () => apiClient.get(`/api/v1/profiles/${profile!.id}/pending-invites`),
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

  // Sprint 15 — NET-06: Consent-Journal
  interface ConsentEvent {
    id: number;
    action: string;
    details: string;
    actorName: string;
    createdAt: string;
  }

  const [consentPage, setConsentPage] = useState(0);
  const consentQuery = useQuery<{ content: ConsentEvent[]; totalElements: number }>({
    queryKey: ["consent-history", profile?.id, consentPage],
    queryFn: () => apiClient.get(`/api/v1/privacy/consent-history?page=${consentPage}&size=10`),
    enabled: !!profile,
  });
  const consentEvents = consentQuery.data?.content ?? [];
  const consentTotal  = consentQuery.data?.totalElements ?? 0;

  function consentActionLabel(action: string) {
    if (action === "INVITE_CREATED")             return { icon: "📩", label: "Einladung erstellt" };
    if (action === "INVITE_ACCEPTED")            return { icon: "✅", label: "Einladung angenommen" };
    if (action === "LINK_REVOKED")               return { icon: "🔒", label: "Zugriff entzogen" };
    if (action === "PRIVACY_EXPORT")             return { icon: "📦", label: "Datenschutz-Export" };
    if (action === "PRIVACY_DELETE_REQUEST")     return { icon: "🗑️", label: "Löschanfrage gestellt" };
    if (action === "PRIVACY_DELETE_REQUEST_REVOKE") return { icon: "↩️", label: "Löschanfrage widerrufen" };
    return { icon: "📋", label: action };
  }

  const { data: privacyOverview } = useQuery<PrivacyOverviewResponse>({
    queryKey: ["privacy-overview", profile?.id],
    queryFn: () => apiClient.get("/api/v1/privacy/overview"),
    enabled: !!profile,
  });

  const privacyNoticeText = settings?.notificationsEnabled
    ? "Deine Daten sind durch Rollen, Zeitfenster und Freigaben getrennt. Export und Widerruf bleiben jederzeit sichtbar."
    : "Freigaben und Datenzugriffe werden transparent gezeigt, auch wenn Benachrichtigungen gerade ausgeschaltet sind.";

  const resolvedPrivacyRequest = privacyOverview
    ? mapDeletionSummary(privacyOverview.deletionRequest)
    : privacyRequest;

  useEffect(() => {
    if (privacyOverview) {
      setPrivacyRequest(mapDeletionSummary(privacyOverview.deletionRequest));
    }
  }, [privacyOverview, setPrivacyRequest]);

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
    mutationFn: (payload: {
      role: InviteResponse["role"];
      relationshipKind: InviteResponse["relationshipKind"];
      accessScope: InviteResponse["accessScope"];
      purpose: string;
      professionalRole?: InviteResponse["professionalRole"];
      accessDurationHours?: number;
    }) => apiClient.post<InviteResponse>(`/api/v1/profiles/${profile!.id}/invite`, payload),
    onSuccess: (data) => {
      setGeneratedInvite(data);
      queryClient.invalidateQueries({ queryKey: ["pending-invites", profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["privacy-overview", profile?.id] });
    },
    onError: () => showToast("Fehler beim Erstellen der Einladung", "error"),
  });

  const revokeMutation = useMutation({
    mutationFn: (linkId: string) => apiClient.delete(`/api/v1/profile-links/${linkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchers"] });
      queryClient.invalidateQueries({ queryKey: ["pending-invites", profile?.id] });
      queryClient.invalidateQueries({ queryKey: ["privacy-overview", profile?.id] });
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

  const privacyActionMutation = useMutation({
    mutationFn: (action: "request" | "revoke") => {
      if (action === "request") {
        return apiClient.post<PrivacyDeletionSummary>("/api/v1/privacy/deletion-request", {});
      }
      return apiClient.delete<PrivacyDeletionSummary>("/api/v1/privacy/deletion-request");
    },
    onSuccess: (result, action) => {
      setPrivacyRequest(mapDeletionSummary(result));
      queryClient.invalidateQueries({ queryKey: ["privacy-overview", profile?.id] });
      showToast(
        action === "request" ? "Löschanfrage gesendet ✅" : "Löschanfrage widerrufen ✅",
        "success"
      );
    },
    onError: () => showToast("Datenschutz-Anfrage konnte nicht verarbeitet werden.", "error"),
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

  async function exportPrivacySnapshot() {
    const snapshot = await apiClient.get<PrivacyExportSnapshot>("/api/v1/privacy/export");

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = snapshot.generatedAt.slice(0, 10);
    link.href = url;
    link.download = `zucker-held-privacy-export-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Datenschutz-Export erstellt ✅", "success");
  }

  if (isLoading || !settings) {
    return (
      <div className="flex h-full items-center justify-center text-4xl animate-pulse">⏳</div>
    );
  }

  // Felder nach Sektionen gruppieren
  const sections = [...new Set(SETTING_FIELDS.map((f) => f.section))];
  const shareOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const activePreset = INVITE_PRESETS[invitePreset];

  function createInvitePayload() {
    return {
      role: activePreset.allowRoleChoice ? inviteRole : activePreset.role,
      relationshipKind: activePreset.relationshipKind,
      accessScope: activePreset.accessScope,
      professionalRole: activePreset.professional ? professionalRole : undefined,
      accessDurationHours: activePreset.professional ? accessDurationHours : undefined,
      purpose: activePreset.allowRoleChoice
        ? inviteRole === "ADMIN"
          ? "Familienverwaltung"
          : inviteRole === "CAREGIVER"
            ? "Familienbegleitung"
            : "Lesender Familienzugriff"
        : activePreset.purpose,
    };
  }

  return (
    <div className="page-shell">
      <div className="page-stack">
        <PageHeader
          title="Einstellungen"
          subtitle="Sicherheit, Darstellung, Benachrichtigungen, Rollen und geteilte Ansichten an einem Ort."
          showBack
        />

        <section className="surface-hero p-5 flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-[1.35rem] bg-white/14 text-4xl shadow-lg">
            {profile?.avatar}
          </span>
          <div>
            <p className="page-eyebrow">Aktives Profil</p>
            <h2 className="page-title text-[2rem] mt-2">{profile?.name}</h2>
            <p className="page-subtitle capitalize">
              {profile?.role} · {profile?.type === "kind" ? "Kind" : "Erwachsen"}
            </p>
          </div>
        </section>

        <section className="surface-card p-5 space-y-4">
          <div>
            <p className="section-eyebrow">Datenschutz & Freigaben</p>
            <h2 className="section-title text-xl mt-2">Privatsphäre im Blick behalten</h2>
            <p className="section-subtitle">
              {privacyNoticeText}
            </p>
          </div>

          <ConsentNotice
            title="Freigaben bleiben zweckgebunden"
            text="Watcher, Share-Links und Rollen geben nur die Rechte frei, die für die jeweilige Aufgabe gebraucht werden. Alles andere bleibt verborgen."
            tone="info"
            badge="Privacy-Hub"
          />

          <div className="metric-grid metric-grid--3">
            <div className="metric-card">
              <p className="metric-label">{privacyOverview?.activeWatcherCount ?? watchers.length} aktive Rollen</p>
              <p className="metric-note">Familien- und Begleitfreigaben mit Login.</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">{privacyOverview?.pendingInviteCount ?? 0} offene Einladungen</p>
              <p className="metric-note">Noch nicht eingelöste Rollen- oder Betreuungsfreigaben.</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">{privacyOverview?.activeShareLinkCount ?? shareLinks.length} Share-Links</p>
              <p className="metric-note">Zeitlich begrenzte, rein lesende Freigaben ohne Login.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/consent")}
              className="secondary-button flex-1"
            >
              Meine Freigaben
            </button>
            <button
              type="button"
              onClick={exportPrivacySnapshot}
              className="secondary-button flex-1"
            >
              📦 Datenschutz-Export
            </button>
            <button
              type="button"
              onClick={() =>
                privacyActionMutation.mutate(
                  resolvedPrivacyRequest.status === "requested" ? "revoke" : "request"
                )
              }
              disabled={privacyActionMutation.isPending}
              className="primary-button flex-1 disabled:opacity-50"
            >
              {privacyActionMutation.isPending
                ? "Bitte warten…"
                : resolvedPrivacyRequest.status === "requested"
                  ? "Löschanfrage widerrufen"
                  : "Löschanfrage stellen"}
            </button>
          </div>

          <p className="text-[11px] text-zh-muted">
            Exporte enthalten sensible Gesundheitsdaten. Bitte nur verschlüsselt oder über sichere, abgesprochene Wege weitergeben.
          </p>

          {resolvedPrivacyRequest.status !== "none" && (
            <div className={`rounded-[1.25rem] px-4 py-3 text-sm ${
              resolvedPrivacyRequest.status === "requested"
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-50 text-zh-muted"
            }`}>
              <p className="font-semibold">
                {resolvedPrivacyRequest.status === "requested"
                  ? "Anfrage aktiv"
                  : "Anfrage widerrufen"}
              </p>
              <p className="mt-1 text-xs leading-6">
                {resolvedPrivacyRequest.note ?? "Der aktuelle Datenschutzstatus wurde vom Server synchronisiert."}
              </p>
            </div>
          )}
        </section>

        {/* ── Sprint 15: Einwilligungshistorie (NET-06) ──────────────────── */}
        <section className="surface-card p-5 space-y-4">
          <div>
            <p className="section-eyebrow">Rechtejournal</p>
            <h2 className="section-title text-xl mt-2">Einwilligungshistorie</h2>
            <p className="section-subtitle">
              Alle Freigabe-Aktionen — wer wann welchen Zugriff bekommen oder verloren hat.
            </p>
          </div>

          {consentQuery.isLoading ? (
            <div className="text-center animate-pulse text-zh-muted py-4">Lade Einwilligungshistorie…</div>
          ) : consentEvents.length === 0 ? (
            <div className="empty-state">
              <p>Noch keine Freigabe-Aktionen aufgezeichnet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {consentEvents.map((ev) => {
                const { icon, label } = consentActionLabel(ev.action);
                const date = new Date(ev.createdAt).toLocaleString("de-DE", {
                  day: "2-digit", month: "2-digit", year: "2-digit",
                  hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div key={ev.id} className="surface-muted rounded-[1.25rem] p-3 flex items-start gap-3">
                    <span className="text-xl mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-zh-text text-sm">{label}</span>
                        <span className="text-xs text-zh-muted shrink-0">{date}</span>
                      </div>
                      {ev.details && (
                        <p className="text-xs text-zh-muted mt-1 leading-relaxed">{ev.details}</p>
                      )}
                      <p className="text-xs text-zh-muted mt-1">Von: {ev.actorName}</p>
                    </div>
                  </div>
                );
              })}

              {consentTotal > (consentPage + 1) * 10 && (
                <button
                  type="button"
                  onClick={() => setConsentPage((p) => p + 1)}
                  className="ghost-button w-full text-sm"
                >
                  Mehr laden ({consentTotal - (consentPage + 1) * 10} weitere)
                </button>
              )}
            </div>
          )}
        </section>

        {sections.map((section) => {
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

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <p className="section-eyebrow">KI & Assistenz</p>
            <h2 className="section-title text-xl mt-2">Provider und Verfügbarkeit</h2>
            <p className="section-subtitle">
              Der Chat bleibt nur aktiv, wenn für den gewählten Provider ein gültiger Schlüssel hinterlegt ist.
            </p>
          </div>
          <div className="segmented">
            {["claude", "openai", "gemini"].map((provider) => (
              <button
                key={provider}
                onClick={() => mutation.mutate({ aiProvider: provider })}
                className={`segmented__item ${settings.aiProvider === provider ? "is-active" : ""} capitalize`}
              >
                {provider}
              </button>
            ))}
          </div>
          <div className="metric-grid metric-grid--3">
            <div className="metric-card">
              <p className="metric-label">Claude</p>
              <p className="metric-note">{settings.hasClaudeApiKey ? "Schlüssel vorhanden" : "Noch kein Schlüssel"}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">OpenAI</p>
              <p className="metric-note">{settings.hasOpenaiApiKey ? "Schlüssel vorhanden" : "Noch kein Schlüssel"}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Gemini</p>
              <p className="metric-note">{settings.hasGeminiApiKey ? "Schlüssel vorhanden" : "Noch kein Schlüssel"}</p>
            </div>
          </div>
          <div className={`rounded-2xl px-4 py-3 text-sm ${settings.aiChatAvailable ? "surface-muted text-green-700" : "warning-card text-orange-800"}`}>
            <p className="font-semibold">
              {settings.aiChatAvailable ? "KI-Chat ist einsatzbereit" : "KI-Chat aktuell kontrolliert deaktiviert"}
            </p>
            <p className="text-xs mt-1">{settings.aiAvailabilityReason}</p>
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
          <h2 className="font-semibold text-zh-text">👥 Rollen & Freigaben</h2>
          <p className="text-xs text-zh-muted">
            Wer kann welche Daten sehen? Erstelle eine zweckgebundene Freigabe für Familie, Fachperson oder Alltagshilfe.
          </p>
          <ConsentNotice
            title="Nur freigegebene Rollen sehen Daten"
            text="Beziehungstyp und Berechtigung werden getrennt gehalten. Familie, Fachpersonen, Schule und Gast-Lernen sehen nur den Umfang, der wirklich freigegeben wurde."
            tone="info"
            badge="Rollen-Hinweis"
          />

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
                        {relationshipLabel(w.relationshipKind)} · {roleLabel(w.role)} · {accessScopeLabel(w.accessScope)}
                      </p>
                      {professionalRoleLabel(w.professionalRole) && (
                        <p className="text-xs text-zh-muted mt-1">
                          Fachrolle: {professionalRoleLabel(w.professionalRole)}
                          {w.expiresAt && ` · Zugriff bis ${new Date(w.expiresAt).toLocaleString("de-DE")}`}
                        </p>
                      )}
                      <p className="text-xs text-zh-muted mt-1">{w.purpose}</p>
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

          {pendingInvites.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zh-text">Offene Einladungen</p>
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zh-text">
                      {relationshipLabel(invite.relationshipKind)} · {accessScopeLabel(invite.accessScope)}
                    </p>
                    <p className="text-xs text-zh-muted mt-1">{invite.purpose}</p>
                    {invite.inviteExpiresAt && (
                      <p className="text-[11px] text-zh-muted mt-1">
                        Code gültig bis {new Date(invite.inviteExpiresAt).toLocaleString("de-DE")}
                      </p>
                    )}
                    {professionalRoleLabel(invite.professionalRole) && (
                      <p className="text-[11px] text-zh-muted mt-1">
                        {professionalRoleLabel(invite.professionalRole)} · Zugriff {invite.accessDurationHours ?? 0} Stunden ab Annahme
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => revokeMutation.mutate(invite.id)}
                    className="text-xs text-red-500 px-2 py-1 rounded-lg bg-red-50"
                  >
                    Widerrufen
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Einladung erstellen */}
          {!showInviteModal && !generatedInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-zh-green text-white"
            >
              + Einladungslink erstellen
            </button>
          )}

          {showInviteModal && !generatedInvite && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zh-text">Freigabetyp wählen:</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(INVITE_PRESETS) as Array<[InvitePresetKey, typeof INVITE_PRESETS[InvitePresetKey]]>).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setInvitePreset(key)}
                    className={`rounded-xl px-3 py-3 text-left text-xs font-medium ${
                      invitePreset === key ? "bg-zh-green text-white" : "bg-gray-100 text-zh-text"
                    }`}
                  >
                    <div className="opacity-70">{preset.eyebrow}</div>
                    <div className="mt-1 text-sm font-semibold">{preset.label}</div>
                  </button>
                ))}
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-3">
                <p className="text-sm font-semibold text-zh-text">{activePreset.label}</p>
                <p className="text-xs text-zh-muted mt-1">{activePreset.helper}</p>
                <p className="text-[11px] text-zh-muted mt-2">{activePreset.caution}</p>
              </div>
              {activePreset.allowRoleChoice && (
                <>
                  <p className="text-sm font-medium text-zh-text">Familienrolle wählen:</p>
                  <div className="flex gap-2">
                    {(["OBSERVER", "CAREGIVER", "ADMIN"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium ${
                          inviteRole === r ? "bg-zh-green text-white" : "bg-gray-100 text-zh-text"
                        }`}
                      >
                        {r === "OBSERVER" ? "Lesend" : r === "CAREGIVER" ? "Betreuung" : "Verwaltung"}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {activePreset.professional && (
                <>
                  <p className="text-sm font-medium text-zh-text">Fachrolle wählen:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ["DOCTOR", "Arzt"],
                      ["DIABETES_COUNSELOR", "Diabetesberatung"],
                      ["NURSING", "Pflege"],
                      ["CLINIC_ADMIN", "Klinik-Admin"],
                    ] as Array<[NonNullable<ProfileLinkResponse["professionalRole"]>, string]>).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setProfessionalRole(value)}
                        className={`rounded-xl px-3 py-2 text-xs font-medium ${
                          professionalRole === value ? "bg-zh-green text-white" : "bg-gray-100 text-zh-text"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="text-xs text-zh-muted">
                    Zugriffsdauer ab Annahme
                    <select
                      value={accessDurationHours}
                      onChange={(e) => setAccessDurationHours(Number(e.target.value))}
                      className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2 outline-none text-zh-text"
                    >
                      <option value={24}>24 Stunden</option>
                      <option value={72}>72 Stunden</option>
                      <option value={168}>7 Tage</option>
                    </select>
                  </label>
                </>
              )}
              <p className="text-xs text-zh-muted">
                {activePreset.allowRoleChoice
                  ? inviteRole === "ADMIN"
                    ? "Verwaltung nur für enge Familienmitglieder. Fachpersonen, Schule und Gäste bleiben bewusst ohne Admin-Rechte."
                  : inviteRole === "CAREGIVER"
                      ? "Betreuung heißt aktuell vor allem lesen und klar getrennte Freigaben. Die Beobachtungsansicht bleibt weiterhin sicher lesend."
                      : "Lesender Familienzugriff ohne Verwaltungs- oder Schreibrechte."
                  : activePreset.professional
                    ? `${professionalRoleLabel(professionalRole)} · ${accessScopeLabel(activePreset.accessScope)} · ${accessDurationHours} Stunden ab Annahme`
                  : `${relationshipLabel(activePreset.relationshipKind)} · ${accessScopeLabel(activePreset.accessScope)} · ${activePreset.purpose}`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2 rounded-xl text-sm bg-gray-100 text-zh-muted"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => inviteMutation.mutate(createInvitePayload())}
                  disabled={inviteMutation.isPending}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold bg-zh-green text-white disabled:opacity-50"
                >
                  {inviteMutation.isPending ? "…" : "Code erstellen"}
                </button>
              </div>
            </div>
          )}

          {/* Generierter Code */}
          {generatedInvite && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-2">
              <p className="text-sm font-medium text-green-700">Einladungscode erstellt!</p>
              <p className="text-3xl font-mono font-bold tracking-widest text-green-800">
                {generatedInvite.inviteCode}
              </p>
              <p className="text-xs text-green-600">
                {relationshipLabel(generatedInvite.relationshipKind)}
                {professionalRoleLabel(generatedInvite.professionalRole) ? ` · ${professionalRoleLabel(generatedInvite.professionalRole)}` : ""}
                {" · "}
                {accessScopeLabel(generatedInvite.accessScope)} · {generatedInvite.purpose}
              </p>
              <p className="text-xs text-green-600">
                Code gültig bis {generatedInvite.inviteExpiresAt ? new Date(generatedInvite.inviteExpiresAt).toLocaleString("de-DE") : "48 Stunden"}.
                {generatedInvite.accessDurationHours ? ` Zugriff danach ${generatedInvite.accessDurationHours} Stunden.` : ""} Teile diesen Code mit der passenden Person.
              </p>
              <button
                onClick={() => { setGeneratedInvite(null); setShowInviteModal(false); }}
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
          <h2 className="font-semibold text-zh-text">🔗 Zweckgebundene Share-Links</h2>
          <p className="text-xs text-zh-muted">
            Erstelle zeitlich begrenzte Links ohne Login für Arzt, Schule oder eine reine Mini-Ansicht.
          </p>
          <ConsentNotice
            title="Freigegebene Links bleiben lesend"
            text="Arzt- und Mini-Ansichten sind auf den freigegebenen Zweck begrenzt. Schreibrechte entstehen daraus nicht."
            tone="info"
            badge="Share-Hinweis"
          />
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

        <button
          onClick={handleLogout}
          className="danger-button w-full"
        >
          🚪 Abmelden
        </button>
      </div>
    </div>
  );
}

function mapDeletionSummary(summary: PrivacyDeletionSummary) {
  const status = summary.status.toLowerCase() as "none" | "requested" | "revoked";
  return {
    status,
    requestedAt: summary.requestedAt,
    revokedAt: null,
    transport: "backend" as const,
    note:
      summary.status === "REQUESTED"
        ? "Löschanfrage am Server vorgemerkt."
        : summary.status === "REVOKED"
          ? "Löschanfrage am Server widerrufen."
          : "Keine aktive Löschanfrage vorhanden.",
  };
}
