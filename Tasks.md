# WG-App – Tasks & Subtasks

> Strukturierte Aufgabenliste basierend auf Agent.md MVP-Roadmap

---

## Phase 1 – Foundation

### Task 1.1: Projektsetup (~1–2 Tage)
**Ziel:** Next.js + PayloadCMS Basis-Setup

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 1.1.1 | Next.js 16+ mit App Router initialisieren | Cascade | **completed** | Bereits initialisiert |
| 1.1.2 | PayloadCMS embedded konfigurieren | Cascade | **completed** | Bereits initialisiert, DB-Adapter muss geändert werden |
| 1.1.3 | Datenbank-Adapter verifizieren | Cascade | **completed** | MongoDB bleibt (wie im Original-Setup) |
| 1.1.4 | Tailwind CSS + shadcn/ui initialisieren | Cascade | **completed** | tailwind.config.ts, components.json, utils.ts erstellt |
| 1.1.5 | ESLint + Prettier konfigurieren | Cascade | **completed** | Bereits vorhanden (eslint.config.mjs, .prettierrc.json) |
| 1.1.6 | Git-Repository anlegen + .gitignore | Cascade | **completed** | Bereits vorhanden |

**Dependencies:** Keine
**Output:** Lauffähige Basis-App auf localhost:3000
**Status:** ✅ **COMPLETED**

---

### Task 1.1 Summary
Alle Subtasks abgeschlossen. Projekt bereit für Auth-Implementierung.

---

### Task 1.2: Auth & User-Management (~2–3 Tage) 🔄 **IN PROGRESS**
**Ziel:** Login-System mit Payload Auth

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 1.2.1 | Payload-Auth konfigurieren (JWT + HTTP-only Cookies) | Cascade | **in_progress** | Cookie-Konfig aus Soul.md |
| 1.2.2 | Users Collection erweitern (name, avatar, role) | Cascade | **in_progress | Payload Admin Panel testen |
| 1.2.3 | Login-Seite erstellen (React Hook Form + Zod) | Cascade | pending | `/login` Route |
| 1.2.4 | Session-Management (Auto-Refresh) implementieren | Cascade | pending | 15min Access / 30d Refresh |
| 1.2.5 | Basis-Layout mit Navigation erstellen | Cascade | pending | Mobile-first Design |
| 1.2.6 | Admin-only Signup (forgot-password Flow) | Cascade | pending | Keine öffentliche Registrierung |

**Dependencies:** 1.1 (Projektsetup)
**Output:** Login funktioniert, Navigation sichtbar

---

## Phase 2 – Core Features

### Task 2.1: Putzplan (~3–4 Tage)
**Ziel:** Rotierender Putzplan mit Abhaken-Funktion

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 2.1.1 | CleaningTasks Collection erstellen | TBD | pending | Siehe Agent.md Datamodel |
| 2.1.2 | Rotationslogik implementieren (ISO-Wochennummer) | TBD | pending | rotationIndex in DB persistieren |
| 2.1.3 | Putzplan-Übersichtsseite erstellen | TBD | pending | `/cleaning` Route |
| 2.1.4 | Aufgaben abhaken (completedAt, completedBy) | TBD | pending | Server Action |
| 2.1.5 | Timestamp-Tracking implementieren | TBD | pending | Wann wurde was erledigt |
| 2.1.6 | Admin-Reset-Funktion für Rotation | TBD | pending | Nur für role=admin |
| 2.1.7 | Test-Daten für Putzplan anlegen | TBD | pending | 3-4 Tasks, 2-3 Test-User |

**Dependencies:** 1.2 (Auth)
**Output:** Putzplan sichtbar, Aufgaben abhakbar

---

### Task 2.2: Einkaufsliste (~2–3 Tage)
**Ziel:** Kollaborative Einkaufsliste mit Kategorien

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 2.2.1 | ShoppingItems Collection erstellen | TBD | pending | category, priority, completed |
| 2.2.2 | Einkaufslisten-Seite erstellen | TBD | pending | `/shopping` Route |
| 2.2.3 | CRUD-Operationen implementieren | TBD | pending | Server Actions |
| 2.2.4 | Optimistic Updates mit SWR/TanStack Query | TBD | pending | Live-Updates |
| 2.2.5 | Käufer-Tracking (completedBy) | TBD | pending | Wer hat was gekauft |
| 2.2.6 | Items wieder freischalten | TBD | pending | Toggle completed Status |
| 2.2.7 | Kategorie-Filter UI | TBD | pending | cleaning, food, hygiene, other |

**Dependencies:** 1.2 (Auth)
**Output:** Liste funktioniert, Items hinzufügen/abhaken

---

## Phase 3 – Extended Features

### Task 3.1: Kalender (~3–4 Tage)
**Ziel:** Gemeinsamer Kalender für WG-Events

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 3.1.1 | Events Collection erstellen | TBD | pending | startDate, endDate, allDay |
| 3.1.2 | react-big-calendar einbinden | TBD | pending | npm install |
| 3.1.3 | Kalender-Seite mit Monatsansicht | TBD | pending | `/calendar` Route |
| 3.1.4 | Termin erstellen (Klick auf Tag) | TBD | pending | Modal/Form |
| 3.1.5 | Termin bearbeiten/löschen | TBD | pending | CRUD Operations |
| 3.1.6 | All-day Events unterstützen | TBD | pending | Checkbox in Form |
| 3.1.7 | Ersteller-Tracking (createdBy) | TBD | pending | Relationship zu Users |

**Dependencies:** 1.2 (Auth)
**Output:** Kalender sichtbar, Termine erstellbar

---

### Task 3.2: Dashboard (~2 Tage)
**Ziel:** Übersicht aller Aktivitäten

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 3.2.1 | Dashboard-Layout entwerfen | TBD | pending | Mobile-first Grid |
| 3.2.2 | "Meine Aufgabe diese Woche" Widget | TBD | pending | CleaningTask-Query |
| 3.2.3 | "Nächste 3 Termine" Widget | TBD | pending | Events-Query |
| 3.2.4 | Einkaufsliste-Snippet Widget | TBD | pending | Top 5 offene Items |
| 3.2.5 | Responsive Design fertigstellen | TBD | pending | Mobile + Desktop |
| 3.2.6 | Dashboard als Default-Route | TBD | pending | `/dashboard` → redirect von `/` |

**Dependencies:** 2.1 (Putzplan), 2.2 (Einkaufsliste), 3.1 (Kalender)
**Output:** Dashboard zeigt alle Daten übersichtlich

---

## Phase 4 – PWA

### Task 4.1: PWA-Konfiguration (~1–2 Tage)
**Ziel:** Installierbare App mit Offline-Support

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 4.1.1 | next-pwa installieren und konfigurieren | TBD | pending | next-pwa + Workbox |
| 4.1.2 | manifest.json erstellen | TBD | pending | name, icons, theme_color |
| 4.1.3 | App-Icons generieren (verschiedene Größen) | TBD | pending | 192x192, 512x512 |
| 4.1.4 | Service Worker konfigurieren | TBD | pending | Cache-Strategien |
| 4.1.5 | Cache-First: App-Shell | TBD | pending | HTML/JS/CSS |
| 4.1.6 | Stale-While-Revalidate: Daten | TBD | pending | Putzplan, Einkaufsliste |
| 4.1.7 | iOS "Add to Home Screen" testen | TBD | pending | Simulator/Gerät |

**Dependencies:** 3.2 (Dashboard)
**Output:** App ist installierbar, funktioniert offline

---

## Phase 5 – Launch

### Task 5.1: Deployment (~1–2 Tage)
**Ziel:** Produktive App auf Railway

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 5.1.1 | Railway-Projekt anlegen | TBD | pending | EU-Region wählen |
| 5.1.2 | MongoDB Managed Service einrichten | TBD | pending | Railway-Datenbank |
| 5.1.3 | Deployment-Pipeline konfigurieren | TBD | pending | GitHub → Railway |
| 5.1.4 | Umgebungsvariablen setzen | TBD | pending | DB_URL, JWT_SECRET, etc. |
| 5.1.5 | Domain + SSL konfigurieren | TBD | pending | Let's Encrypt |
| 5.1.6 | Automatische Backups verifizieren | TBD | pending | Railway-Settings |
| 5.1.7 | Rate-Limiting (Upstash Redis) aktivieren | TBD | pending | 5 Versuche/Minute |
| 5.1.8 | Security Headers in next.config.js | TBD | pending | CSP, X-Frame-Options |
| 5.1.9 | Basis-Monitoring (Uptime-Check) | TBD | pending | Railway-Monitoring |
| 5.1.10 | Smoke-Tests durchführen | TBD | pending | Login, Putzplan, Liste |

**Dependencies:** 4.1 (PWA)
**Output:** App live, SSL aktiv, Backups laufen

---

## Phase 6 – Post-MVP (Optional)

### Task 6.1: Task Swap Feature
- TaskSwapRequests Collection
- Tauschanfrage stellen/annehmen/ablehnen
- E-Mail-Benachrichtigung

### Task 6.2: Push Notifications
- web-push + VAPID Keys
- Service Worker erweitern
- Opt-in für Benutzer

### Task 6.3: iCal Export
- ical-generator npm
- Export für Kalender-Events

### Task 6.4: Chat-Modul
- SSE oder socket.io
- Gruppenchat

### Task 6.5: Google Calendar Integration
- Google Calendar API
- Bidirektionale Sync

---

## Summary

| Phase | Tasks | Geschätzte Zeit |
|-------|-------|-----------------|
| 1 – Foundation | 2 Tasks | 3–5 Tage |
| 2 – Core Features | 2 Tasks | 5–7 Tage |
| 3 – Extended Features | 2 Tasks | 5–6 Tage |
| 4 – PWA | 1 Task | 1–2 Tage |
| 5 – Launch | 1 Task | 1–2 Tage |
| **MVP Total** | **8 Tasks** | **15–22 Tage** |

---

## Next Actions

1. **Approval** für Phase 1 einholen
2. Subtasks für Task 1.1 (Projektsetup) an Agenten zuweisen
3. Nach Approval: Documentation.md und Agent.md aktualisieren
