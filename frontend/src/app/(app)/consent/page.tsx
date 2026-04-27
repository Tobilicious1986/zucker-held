"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { useUiStore } from "@/stores/ui.store";
import { PageHeader } from "@/components/ui/PageHeader";

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

function scopeLabel(scope: ProfileLinkResponse["accessScope"]) {
  if (scope === "SUMMARY_ONLY") return "Überblick";
  if (scope === "LEARNING_ONLY") return "Nur Lernen";
  return "Live-Medizin";
}

function scopeColor(scope: ProfileLinkResponse["accessScope"]) {
  if (scope === "SUMMARY_ONLY") return "bg-blue-100 text-blue-700 border-blue-200";
  if (scope === "LEARNING_ONLY") return "bg-gray-100 text-gray-600 border-gray-200";
  return "bg-green-100 text-green-700 border-green-200";
}

function kindLabel(kind: ProfileLinkResponse["relationshipKind"]) {
  if (kind === "PROFESSIONAL") return "Fachperson";
  if (kind === "SCHOOL") return "Schule & Alltag";
  if (kind === "LEARNING_GUEST") return "Gast-Lernen";
  return "Familie";
}

function professionalRoleLabel(role: ProfileLinkResponse["professionalRole"]) {
  if (role === "DIABETES_COUNSELOR") return "Diabetesberatung";
  if (role === "NURSING") return "Pflege";
  if (role === "CLINIC_ADMIN") return "Klinik-Admin";
  if (role === "DOCTOR") return "Arzt";
  return null;
}

/**
 * Sprint 15 — NET-02b: Einwilligungszentrale.
 * Übersicht aller aktiven Freigaben mit Widerruf-Option.
 */
export default function ConsentPage() {
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const profile      = useAuthStore((s) => s.activeProfile);
  const showToast    = useUiStore((s) => s.showToast);

  const { data: watchers = [], isLoading } = useQuery<ProfileLinkResponse[]>({
    queryKey: ["consent-watchers", profile?.id],
    queryFn:  () => apiClient.get(`/api/v1/profiles/${profile!.id}/watchers`),
    enabled:  !!profile,
  });

  const { data: pending = [] } = useQuery<ProfileLinkResponse[]>({
    queryKey: ["consent-pending", profile?.id],
    queryFn:  () => apiClient.get(`/api/v1/profiles/${profile!.id}/pending-invites`),
    enabled:  !!profile,
  });

  const revokeMutation = useMutation({
    mutationFn: (linkId: string) => apiClient.delete(`/api/v1/profile-links/${linkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consent-watchers"] });
      queryClient.invalidateQueries({ queryKey: ["consent-pending"] });
      queryClient.invalidateQueries({ queryKey: ["privacy-overview"] });
      showToast("Freigabe widerrufen ✅", "success");
    },
    onError: () => showToast("Fehler beim Widerrufen", "error"),
  });

  if (!profile) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="page-shell">
      <div className="page-stack">
        <PageHeader
          title="Meine Freigaben"
          subtitle="Alle aktiven Zugänge — wer was sehen darf und mit welchem Zweck."
          showBack
        />

        {/* Aktive Freigaben */}
        <section className="surface-card p-5 space-y-4">
          <div>
            <p className="section-eyebrow">Aktive Zugänge</p>
            <h2 className="section-title text-xl mt-2">
              {watchers.length === 0 ? "Keine aktiven Freigaben" : `${watchers.length} aktive Freigabe${watchers.length !== 1 ? "n" : ""}`}
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center animate-pulse text-zh-muted py-4">Lade Freigaben…</div>
          ) : watchers.length === 0 ? (
            <div className="empty-state">
              <p>Noch keine Freigaben erteilt. Über Einstellungen kann eine Einladung erstellt werden.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {watchers.map((link) => (
                <div
                  key={link.id}
                  className="surface-muted rounded-[1.6rem] p-4 space-y-3"
                >
                  {/* Watcher-Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-[1.1rem] bg-white text-2xl shadow-sm">
                        {link.watcher?.avatar ?? "👤"}
                      </span>
                      <div>
                        <p className="font-semibold text-zh-text">{link.watcher?.name ?? "—"}</p>
                        <p className="text-sm text-zh-muted">
                          {kindLabel(link.relationshipKind)}
                          {professionalRoleLabel(link.professionalRole) ? ` · ${professionalRoleLabel(link.professionalRole)}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${scopeColor(link.accessScope)}`}>
                      {scopeLabel(link.accessScope)}
                    </span>
                  </div>

                  {/* Zweck */}
                  <div className="rounded-[1rem] bg-white/60 px-3 py-2 text-sm text-zh-muted">
                    <span className="font-medium text-zh-text">Zweck: </span>
                    {link.purpose}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zh-muted">
                      Seit {new Date(link.createdAt).toLocaleDateString("de-DE")}
                      {link.expiresAt && ` · Läuft ab ${new Date(link.expiresAt).toLocaleDateString("de-DE")}`}
                    </p>
                    <button
                      onClick={() => revokeMutation.mutate(link.id)}
                      disabled={revokeMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                    >
                      Widerrufen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Offene Einladungen */}
        {pending.length > 0 && (
          <section className="surface-card p-5 space-y-4">
            <div>
              <p className="section-eyebrow">Offene Einladungen</p>
              <h2 className="section-title text-xl mt-2">{pending.length} ausstehend</h2>
            </div>

            <div className="space-y-3">
              {pending.map((link) => (
                <div key={link.id} className="surface-muted rounded-[1.6rem] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zh-text text-sm">{kindLabel(link.relationshipKind)}</p>
                      <p className="text-xs text-zh-muted mt-0.5">{link.purpose}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${scopeColor(link.accessScope)}`}>
                      {scopeLabel(link.accessScope)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zh-muted">
                      Code läuft ab: {link.inviteExpiresAt ? new Date(link.inviteExpiresAt).toLocaleString("de-DE") : "—"}
                      {link.accessDurationHours ? ` · Zugriff ${link.accessDurationHours} h ab Annahme` : ""}
                    </p>
                    <button
                      onClick={() => revokeMutation.mutate(link.id)}
                      disabled={revokeMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                    >
                      Zurückziehen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hinweis */}
        <div className="rounded-[1.25rem] bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
          <p className="font-medium">Freigaben sind zweckgebunden</p>
          <p className="mt-1 leading-relaxed text-blue-600">
            Jede Freigabe ist an einen klaren Zweck gebunden. Nach dem Widerruf hat die Person
            sofort keinen Zugriff mehr. Das Rechtejournal in den Einstellungen protokolliert alle Aktionen.
          </p>
        </div>

        <button
          onClick={() => router.back()}
          className="ghost-button w-full"
        >
          ← Zurück zu Einstellungen
        </button>
      </div>
    </div>
  );
}
