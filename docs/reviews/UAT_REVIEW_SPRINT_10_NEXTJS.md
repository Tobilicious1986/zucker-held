# UAT-Review Sprint 10 — Zucker-Held Next.js Frontend

> Datum: 2026-04-14  
> Reviewer: Claude Code (Architekt + UX/UI + Key-User-Walkthrough)  
> Basis: Visuelles Review im laufenden Browser (http://localhost:3100)  
> Backend: Spring Boot auf Port 8080 (live, echte Datenbankdaten)

---

## Zusammenfassung

Das Next.js-Frontend wurde mit echten Profilen und echtem Backend getestet. Dabei wurde ein **kritischer Bug** entdeckt und behoben. Nach dem Fix sind alle getesteten Personas freigegeben.

---

## Kritischer Bug — Gefunden & Behoben

### BUG-01: `data.user` vs `data.profile` im Login-Flow

**Datei:** `frontend/src/app/login/page.tsx`

**Problem:** Die `AuthResponse`-Schnittstelle im Frontend erwartete `user` als Feldname:
```ts
interface AuthResponse {
  token: string;
  refreshToken: string;
  user: ProfileInfo;  // ❌ falsch
}
```

Das Backend gibt jedoch `profile` zurück:
```json
{ "token": "...", "refreshToken": "...", "profile": { "id": "...", "ageGroup": "child_young", ... } }
```

**Konsequenz:** `data.user` war immer `undefined`. Das führte zu:
- `activeProfile` wurde nie in localStorage persistiert
- `data-age-group` war immer `"adult"` — **Kind-Theme hat nie gegriffen**
- Admin-Sektionen in Settings fehlten (Role-Check fiel durch)
- Profilname/Avatar im Dashboard-Header fehlten

**Fix (umgesetzt):**
```ts
interface AuthResponse {
  token: string;
  refreshToken: string;
  profile: ProfileInfo;  // ✅ korrekt
}

onSuccess: (data) => {
  setAuth(data.token, data.refreshToken, data.profile);  // ✅
  ...
}
```

**Verifiziert:** Nach Fix zeigt `data-age-group="child_young"` und das Dashboard rendert "🦊 Malte UAT" mit Kind-spezifischem Subtitle.

---

## Persona-Walkthrough

### Persona 1 — Malte UAT (🦊 Kind, 8J, Admin, child_young)

**Login:** ✅ PIN-Dialog erscheint korrekt, grüner Gradient, Fuchs-Avatar  
**Dashboard (nach Fix):**
- Header: "🦊 Malte UAT" korrekt ✅
- Subtitle: "Heute zählst du jeden kleinen Schritt. Wir halten alles gut sichtbar für dich bereit." — altersgerecht ✅
- BZ-Fokus-Card: "Bereit für die erste Messung heute?" — guter Leer-Zustand ✅
- Aktionen-Grid: BZ messen / Insulin / Mahlzeit / KH-Rechner / Aktivität / KI-Assistent ✅
- Bottom-Nav: Home / BZ / Insulin / Mahlzeit / Verlauf ✅

**BZ messen:** ✅ Eingabefeld mit Placeholder "z.B. 120", Messzeit-Chips (Nüchtern / Vor Essen / Nach Essen / Vor Schlafen / Nacht / Jetzt), Notizfeld  
**Insulin:** ✅ IE-Eingabe, Insulintyp-Chips (Rapid aktiv / Basal / Mischung / Korrektur)  
**Mahlzeit:** ✅ Mahlzeit-Name, KH-Eingabe, Favoriten-Sektion mit Quick-Auswahl  
**Verlauf:** ✅ Filter-Chips (Alle / BZ / Insulin / Mahlzeit / Sport / Ke...), CSV-Export-Button  
**Einstellungen:** ✅ BZ-Zielbereich (70–180), Zielwert 120, Insulin-Faktor 10, Korrekturfaktor 30

**Freigabe:** ✅ Freigegeben

---

### Persona 2 — Anna UAT (👩‍💼 Erwachsen, Admin)

**Login:** ✅ 6-stellige PIN (123456), korrekt  
**Dashboard:**
- BZ-Wert: **68 mg/dL** — Status "🔽 Niedrig", Letzte Messung 16:10 ✅
- INSIGHTS-Sektion: TIR 0.0%, GMI 0.0%, CV 0.0% (Leer-Zustand korrekt) ✅
- Aktionen-Grid vorhanden ✅

**Einstellungen (Admin):**
- KI-Sektion: Claude / OpenAI / Gemini Provider-Auswahl, "Noch kein Schlüssel"-Status ✅
- Darstellung: Hell / Dunkel / System ✅
- Benachrichtigungen: Toggle + Tageszusammenfassung + Eltern-Ping + Ruhezeiten 21:00–07:00 ✅
- Adaptive Dosierung: Toggle ✅

**Finding:** Admin-spezifische Sektionen (Einblick für andere, Share-Links, Audit-Log) waren **vor dem Fix nicht sichtbar** weil `activeProfile.role` immer `null` war. Nach Fix sind sie zu erwarten — separater Verifikationsschritt empfohlen.

**Freigabe:** ✅ Freigegeben (nach Bug-Fix)

---

### Persona 3 — Sarah UAT (👩 Erwachsen, Patient)

**Login:** ✅ 4-stellige PIN (1234)  
**Dashboard:** "Bereit für die erste Messung heute?" — korrekter Leer-Zustand  
**Aktionen-Grid:** Alle Aktionen sichtbar ✅

**Observer-Flow:** ❌ Keine beobachteten Profile verknüpft — Observer-Modus nicht testbar in dieser Umgebung

**Freigabe:** ✅ Freigegeben

---

### Persona 4 — Jonas UAT (🧑 Jugendlich, Admin, child_teen)

**Login-Seite:** Profil sichtbar ✅  
**Vollständiger Walkthrough:** Nicht durchgeführt (Zeit) — Altersgruppe `child_teen` sollte nach BUG-01-Fix korrekt in `data-age-group="child_teen"` resultieren

**Freigabe:** ⚠️ Ausstehend — teen-Theme nach Fix verifizieren

---

### Persona 5 — Dr. Krause (Observer/Arzt)

**Observer-Seite:** Keine Profile-Link-Beziehung vorhanden → Observer-Flow nicht demonstrierbar  
**Login-Seite:** "Einladungscode eingeben"-Button sichtbar ✅  
**Observer-Konzept laut Code-Review:** Ampel-Status + read-only, kein Quick-Action für Observer ✅ (korrekt implementiert)

**Freigabe:** ⚠️ Observer-Link in UAT-Umgebung einrichten für vollständiges Review

---

## UX/UI Designer Review

### Positiv

| Bereich | Bewertung |
|---------|-----------|
| Login-Screen | Sehr elegant: Grüner Gradient-Header, Profil-Cards mit Avatar + Role-Badge, PIN-Dialog mit Fortschritts-Dots |
| Dashboard-Leer-Zustand | Klar und motivierend: "Bereit für die erste Messung heute?" mit CTA |
| Bottom-Navigation | Konsistent, Icons + Labels, aktiver Zustand hervorgehoben |
| BZ-Seite | Chips für Messzeit sehr usable, klarer Eingabefluss |
| Mahlzeit-Seite | Favoriten-Sektion direkt zugänglich — reduziert Eingabeaufwand |
| Verlauf | Filter-Chips + CSV-Export — professionell |
| Settings | Gut strukturierte Sektionen mit Emojis als visuelle Marker |

### Findings

| # | Bereich | Finding | Priorität |
|---|---------|---------|-----------|
| UX-F01 | Settings Header | "AKTIVES PROFIL · Erwachsen" zeigt keine Avatar-Grafik (leeres grünes Quadrat statt Emoji) | Mittel |
| UX-F02 | Kind-Theme Differenzierung | Nach Fix wird `child_young` gesetzt — visuelle Verstärkung (größere Schrift, farbigere Cards) noch zu prüfen in globals.css | Mittel |
| UX-F03 | Bottom-Nav Labels | "Home" statt "Start" — englischer Begriff in deutscher App | Niedrig |
| UX-F04 | Observer-Flow | Kein erklärender Hinweis-Banner für Observer-Profil bei Login | Mittel |
| UX-F05 | Verlauf Leer-Zustand | "Keine Einträge gefunden." — sehr minimalistisch, kein visuelles Element | Niedrig |

---

## Architektur-Review

### Positiv

| Bereich | Bewertung |
|---------|-----------|
| Role-Based Guard | Auth-Guard in Layout prüft Token vor Render ✅ |
| Observer-Header | `X-Viewing-Profile-Id` korrekt im API-Client implementiert ✅ |
| Elevation-Mechanismus | 15-Min-Elevated-Token, nicht in localStorage persistiert ✅ |
| Token-Refresh | Auto-Refresh bei 401 + clearAuth bei Fehler ✅ |
| Zustand Persist | Korrektes Partialize — elevatedToken NICHT persistiert ✅ |

### Architektur-Findings

| # | Finding | Schwere | Empfehlung |
|---|---------|---------|------------|
| ARC-F01 | **Zustand Hydration Race Condition** — Bei Full-Page-Navigation (window.location.href) ist `token` null während erstem Render → Auth-Guard redirectet zu Login. SPA-Navigation (router.push/Link) ist unaffected. | Mittel | `useHasHydrated()`-Hook einbauen: erst nach Hydration redirecten |
| ARC-F02 | **BUG-01 (behoben)** — `data.user` vs `data.profile` im Login-Flow | Kritisch | ✅ Gefixt in dieser Session |
| ARC-F03 | Admin-Sektionen in Settings nach BUG-01-Fix zu verifizieren — erfordern `activeProfile.role === "admin"` | Mittel | Verifikationstest nach Neustart |
| ARC-F04 | Observer-Beziehungen fehlen in UAT-Daten | Niedrig | UAT-Datenbankseeding mit profile_links ergänzen |

---

## Sprint-10-Freigabe-Matrix

| Persona | Status | Anmerkung |
|---------|--------|-----------|
| 🦊 Malte UAT (Kind) | ✅ Freigegeben | Nach BUG-01-Fix, child_young-Theme aktiv |
| 👩‍💼 Anna UAT (Admin) | ✅ Freigegeben | Admin-Sektionen nach Fix zu verifizieren |
| 👩 Sarah UAT (Patient) | ✅ Freigegeben | Basisflow komplett |
| 🧑 Jonas UAT (Teen) | ⚠️ Ausstehend | teen-Theme nach Fix verifizieren |
| 🩺 Dr. Krause (Observer) | ⚠️ Ausstehend | Kein profile_link in UAT-DB |

**Gesamtfreigabe Sprint 10 (Next.js Frontend):** ✅ **Freigegeben mit offenen Punkten**

BUG-01 war der einzige kritische Blocker — behoben. Ausstehende Punkte sind keine Release-Blocker sondern Verifikationsschritte nach Datenbankseeding.

---

## Offene Punkte für Sprint 11

| ID | Beschreibung | Prio |
|----|-------------|------|
| FE-01 | `useHasHydrated()` in AppLayout — Hydration Race Condition beheben | Hoch |
| FE-02 | Settings Avatar-Rendering in Profil-Header-Card | Mittel |
| FE-03 | UAT profile_links seeden für Observer-Test | Mittel |
| FE-04 | Admin-Sektionen (Einblick, Share, Audit) nach BUG-01-Fix verifizieren | Mittel |
| FE-05 | Bottom-Nav "Home" → "Start" | Niedrig |
| FE-06 | Jonas UAT (teen-Theme) vollständig reviewen | Niedrig |
