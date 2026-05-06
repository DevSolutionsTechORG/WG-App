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

### Task 1.2: Auth & User-Management (~2–3 Tage) ✅ **COMPLETED**
**Ziel:** Login-System mit Payload Auth

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 1.2.1 | Payload-Auth konfigurieren (JWT + HTTP-only Cookies) | Cascade | **completed** | Cookie secure/Lax, tokenExpiration 900s |
| 1.2.2 | Users Collection erweitern (name, avatar, role) | Cascade | **completed** | name, avatar, role fields in Users.ts |
| 1.2.3 | Login-Seite erstellen (React Hook Form + Zod) | Cascade | **completed** | /login mit Form-Validierung |
| 1.2.4 | Session-Management (Auto-Refresh) implementieren | Cascade | **completed** | useAuth hook, /api/users/me, 10min refresh interval |
| 1.2.5 | Basis-Layout mit Navigation erstellen | Cascade | **completed** | Mobile-first, lucide-react icons, active states |
| 1.2.6 | Admin-only Signup (forgot-password Flow) | Cascade | **completed** | createUserByAdmin mit Admin-Check, password-reset.ts |

**Dependencies:** 1.1 (Projektsetup)
**Output:** ✅ Login funktioniert, Navigation sichtbar, Auth-Guards aktiv

**Status:** ✅ **COMPLETED**

---

## Phase 2 – Core Features

### Task 2.1: Putzplan (~5–6 Tage) ✅ **COMPLETED**
**Ziel:** Rotierender Putzplan mit wöchentlicher automatischer Rotation, Historie, Abhaken-Funktion und Überfälligkeits-Tracking

> ✅ **Implementation abgeschlossen:** Echte Rotation, persistente Zuweisungen, Historie, Überfällige Tasks-Anzeige

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 2.1.1 | ~~CleaningTasks Collection erstellen~~ | Cascade | **completed** | Fields: title, description, frequency, rotationIndex (STATISCH) |
| 2.1.2 | **TaskAssignments Collection erstellen** | Cascade | **completed** | Persistente Zuweisungen pro Woche: template, assignedTo, weekNumber, year, status |
| 2.1.3 | **TaskTemplates Collection erstellen** | Cascade | **completed** | Templates: title, description, rotationGroup, frequency, isCustom, requiresOptions |
| 2.1.4 | **Pflegeoptionen für "Anderes"-Task** | Cascade | **completed** | CleaningTaskOptions Collection: title, description, isActive, sortOrder |
| 2.1.5 | **Korrekte Rotationslogik implementieren** | Cascade | **completed** | `(weekOffset + taskIndex) % userCount` mit rotationGroup für echte Wochen-Rotation |
| 2.1.6 | **TaskCompletionHistory Collection** | Cascade | **completed** | Historie: assignment, template, completedBy, completedAt, weekNumber, year, notes, selectedOption |
| 2.1.7 | Automatische Assignment-Generierung | Cascade | **completed** | generateAssignmentsForWeek() on-demand beim ersten Seitenaufruf der Woche |
| 2.1.8 | Putzplan-Übersichtsseite refactoren | Cascade | **completed** | /cleaning liest aus TaskAssignments, zeigt template, assignedUser, history |
| 2.1.9 | Aufgaben abhaken mit Historie | Cascade | **completed** | completeTask() updatet Assignment + erstellt TaskCompletionHistory Eintrag |
| 2.1.10 | Admin: Rotation zurücksetzen | Cascade | **completed** | resetRotation() löscht future Assignments + regeneriert ab aktueller Woche |
| 2.1.11 | Überfällige Tasks anzeigen | Cascade | **completed** | getOverdueAssignments() + rote UI-Markierung für pending Tasks aus vergangenen Wochen |
| 2.1.12 | Test-Daten für Putzplan anlegen | TBD | pending | 3 Tasks, 2-3 Test-User, 2 Wochen Assignments |

**Dependencies:** 1.2 (Auth)
**Output:** ✅ Putzplan mit echter wöchentlicher Rotation, Historie, Pflegeoptionen, Überfälligkeits-Tracking

---

### Task 2.2: Einkaufsliste (~2–3 Tage) ✅ **COMPLETED**
**Ziel:** Kollaborative Einkaufsliste mit Kategorien

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 2.2.1 | ShoppingItems Collection erstellen | Cascade | **completed** | category, priority, status, requestedBy, completedBy, quantity, unit |
| 2.2.2 | Einkaufslisten-Seite erstellen | Cascade | **completed** | /shopping mit Filter, Listenansicht, Add-Form |
| 2.2.3 | CRUD-Operationen implementieren | Cascade | **completed** | getShoppingItems, createShoppingItem, completeShoppingItem, reopenShoppingItem, deleteShoppingItem |
| 2.2.4 | ~~Optimistic Updates mit SWR/TanStack Query~~ | - | **skipped** | MVP: Server Actions mit page reload |
| 2.2.5 | Käufer-Tracking (completedBy) | Cascade | **completed** | completeShoppingItem setzt completedBy + completedAt |
| 2.2.6 | Items wieder freischalten | Cascade | **completed** | reopenShoppingItem() setzt status zurück auf open |
| 2.2.7 | Kategorie-Filter UI | Cascade | **completed** | CategoryFilter Komponente mit Count-Badges |

**Dependencies:** 1.2 (Auth)
**Output:** Liste funktioniert, Items hinzufügen/abhaken

---

## Phase 3 – Extended Features

### Task 3.1: Kalender (~3–4 Tage) ✅ **COMPLETED**
**Ziel:** Gemeinsamer Kalender für WG-Events mit erweiterten Funktionen

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 3.1.1 | Events Collection erstellen | Cascade | **completed** | title, startDate, endDate, allDay, location, eventType, createdBy |
| 3.1.2 | react-big-calendar + date-fns einbinden | Cascade | **completed** | react-big-calendar, date-fns installiert |
| 3.1.3 | Kalender-Seite mit Monatsansicht | Cascade | **completed** | /calendar Route mit react-big-calendar, deutsche Lokalisierung |
| 3.1.4 | Termin erstellen (Klick auf Slot) | Cascade | **completed** | Modal mit Titel, Typ, Start/Ende, Ort, Beschreibung |
| 3.1.5 | Termin bearbeiten/löschen | Cascade | **completed** | updateEvent, deleteEvent Server Actions |
| 3.1.6 | All-day Events unterstützen | Cascade | **completed** | allDay Checkbox, dynamic input types |
| 3.1.7 | Ersteller-Tracking (createdBy) | Cascade | **completed** | createdBy Relationship, auto-set in beforeChange hook |
| 3.1.8 | Visuelle Markierung für Tage mit Events | Cascade | **completed** | Fette Darstellung für Tage mit Terminen |
| 3.1.9 | Interaktive Tage mit Day Overlay | Cascade | **completed** | Klick auf Tag öffnet Overlay mit Tages-Events |
| 3.1.10 | Permanente Event-Liste | Cascade | **completed** | Monatstermine immer sichtbar, Navigation-Buttons |
| 3.1.11 | User Permissions für Events | Cascade | **completed** | Nur eigene Events bearbeitbar/löschbar |

**Dependencies:** 1.2 (Auth)
**Output:** ✅ Voll funktionsfähiger Kalender mit react-big-calendar, deutsche Lokalisierung, CRUD-Operations, farbliche Events nach Typ, visuelle Tages-Markierungen, interaktive Day Overlays, permanente Event-Liste, User-Permission-System

---

### Task 3.2: Dashboard (~2 Tage)
**Ziel:** Übersicht aller Aktivitäten mit fokussierten User-Informationen

#### Subtasks:
| ID | Subtask | Assignee | Status | Notes |
|----|---------|----------|--------|-------|
| 3.2.1 | Dashboard-Layout entwerfen | Cascade | | Mobile-first Grid mit User-Fokus |
| 3.2.2 | User-Aufgaben Section | Cascade | | Aktuelle Aufgaben mit Erledigt-Status |
| 3.2.3 | Einkaufsliste Vorschau | Cascade | | Top 3 Artikel mit Link zu /shopping |
| 3.2.4 | EventListOverview Komponente | Cascade | | Wiederverwendbare Events-Liste aus Kalender |
| 3.2.5 | Events Section | Cascade | | Monatliche Events mit EventListOverview |
| 3.2.6 | Navigation-Buttons entfernen | Cascade | | Nur Navbar für Navigation verwenden |
| 3.2.7 | Responsive Design fertigstellen | Cascade | | Mobile + Desktop |
| 3.2.8 | Dashboard als Default-Route | Cascade | | `/dashboard` → redirect von `/` |

**Dependencies:** 2.1 (Putzplan), 2.2 (Einkaufsliste), 3.1 (Kalender)
**Output:** ✅ Fokussiertes Dashboard mit User-Aufgaben, Einkaufsliste-Vorschau, Events-Übersicht

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
