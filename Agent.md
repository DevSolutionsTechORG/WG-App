# WG-App – Agent Build Spec
> Stack: Next.js 14+ (App Router) · PayloadCMS (embedded) · PostgreSQL · PWA · shadcn/ui + Tailwind
> Ziel: Private WG-App für 2–20 Mitglieder. Kein App Store. Kein Flutter.

---

## ENTSCHEIDUNGEN (nicht hinterfragen, direkt umsetzen)

| Thema | Entscheidung |
|---|---|
| Plattform | PWA (Progressive Web App) – kein Flutter, kein Native |
| Framework | Next.js 16+ App Router |
| CMS/Backend | PayloadCMS **eingebettet** in Next.js (Monorepo, kein separater Service) |
| Datenbank | MongoDB |
| Auth | Payload built-in JWT + HTTP-only Cookies |
| UI | shadcn/ui + Tailwind CSS + Lucide React |
| Forms | React Hook Form + Zod |
| State | Zustand (global) + SWR oder TanStack Query (server state) |
| Hosting | Railway (EU-Region) |
| PWA | next-pwa (Workbox) |
| Kalender-UI | react-big-calendar oder FullCalendar |
| Datum | date-fns |
| Chat | **NICHT im MVP** – WhatsApp als Interim |
| Push Notifications | **NICHT im MVP** |

---

## PROJEKTSTRUKTUR

```
src/
  app/
    (frontend)/         # Next.js Seiten
      dashboard/
      cleaning/
      calendar/
      shopping/
    (payload)/          # Payload Admin + API Routes
  collections/          # Payload Collections (Users, Tasks, Events, ...)
  components/           # Wiederverwendbare React-Komponenten
  lib/                  # API-Client, Auth-Helpers, Hilfsfunktionen
public/
  manifest.json
  icons/                # PWA App-Icons
payload.config.ts
```

---

## DATENMODELLE (Payload Collections)

### `Users`
| Feld | Typ | Details |
|---|---|---|
| email | Text (unique) | Login |
| password | Password | Payload-intern, gehasht (bcrypt) |
| name | Text | Anzeigename |
| avatar | Upload | optional |
| role | Select | `member` \| `admin` |

### `CleaningTasks`
| Feld | Typ | Details |
|---|---|---|
| taskName | Text | z.B. "Wischen", "Bad putzen" |
| assignedTo | Relationship → Users | Aktuell zugewiesen |
| weekNumber | Number | ISO-Wochennummer |
| year | Number | Jahr |
| completedAt | Date | nullable |
| completedBy | Relationship → Users | nullable |
| rotationIndex | Number | **In DB persistieren, nie neu berechnen** |

### `TaskSwapRequests`
| Feld | Typ | Details |
|---|---|---|
| requester | Relationship → Users | |
| requestee | Relationship → Users | |
| requesterTask | Relationship → CleaningTasks | |
| requesteeTask | Relationship → CleaningTasks | |
| status | Select | `pending` \| `accepted` \| `rejected` |
| acceptedAt | Date | nullable |

### `Events`
| Feld | Typ | Details |
|---|---|---|
| title | Text | |
| description | Textarea | optional |
| startDate | Date | |
| endDate | Date | optional |
| createdBy | Relationship → Users | |
| allDay | Checkbox | |

### `ShoppingItems`
| Feld | Typ | Details |
|---|---|---|
| name | Text | |
| category | Select | `cleaning` \| `food` \| `hygiene` \| `other` |
| completed | Checkbox | |
| completedBy | Relationship → Users | nullable |
| completedAt | Date | nullable |
| priority | Select | `low` \| `medium` \| `high` |

---

## ROUTING

| Route | Seite | Typ |
|---|---|---|
| `/login` | Login-Formular | Client Component |
| `/(app)/dashboard` | Aktuelles – Übersicht | Server Component |
| `/(app)/cleaning` | Putzplan + Abhaken | Server + Client |
| `/(app)/calendar` | Monatskalender + Erstellung | Server + Client |
| `/(app)/shopping` | Einkaufsliste | Server + Client |

---

## AUTH & SESSIONS

### Cookie-Konfiguration (Pflicht für Produktion)
```
HttpOnly: true       # Kein JS-Zugriff (XSS-Schutz)
Secure: true         # Nur HTTPS
SameSite: Lax        # CSRF-Schutz
Path: /
Max-Age: 2592000     # 30 Tage
```

### Token-Schema
- **Access Token (JWT):** 15–60 Minuten, bei jeder API-Anfrage
- **Refresh Token:** 30 Tage, nur für `/refresh`-Endpunkt
- **Auto-Refresh:** Bei App-Start still `/refresh` aufrufen → Nutzer bleibt eingeloggt

### Rollen
- `member`: Standard-Nutzer
- `admin`: Kann Rotation zurücksetzen, User verwalten

### Kein öffentliches Signup
Admin legt User im Payload-Admin-Panel an und versendet Einladungs-Mail (Payload forgot-password flow).

---

## API-PATTERNS

| Pattern | Wann verwenden |
|---|---|
| **Payload Local API** (Server Components) | Initiales Laden: Putzplan-Übersicht, Kalender – kein HTTP-Overhead |
| **SWR/TanStack Query** (Client Components) | Reaktive Daten: Einkaufsliste, Live-Updates |
| **Server Actions** | Mutationen: Abhaken, Swap-Anfragen – typsicher, kein separater API-Layer |
| **Payload `afterChange` Hooks** | Rotationslogik, E-Mail bei Swap-Anfrage |

---

## ZOD SCHEMAS (Frontend + Backend teilen)

```ts
// Login
z.object({ email: z.string().email(), password: z.string().min(8) })

// Event
z.object({
  title: z.string().min(2),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean()
})

// ShoppingItem
z.object({
  name: z.string().min(2).max(50),
  category: z.enum(['cleaning', 'food', 'hygiene', 'other']),
  priority: z.enum(['low', 'medium', 'high'])
})

// SwapRequest
z.object({
  requesterTaskId: z.string(),
  requesteeTaskId: z.string()
}).refine(d => d.requesterTaskId !== d.requesteeTaskId)
```

---

## SICHERHEIT

```
Rate Limiting:    Upstash Redis + @upstash/ratelimit in Next.js Middleware
                  Login-Endpunkt: max. 5 Versuche/Minute pro IP
CSRF:             Server Actions sind by default geschützt
Input:            Zod validiert und sanitized alle Server-Inputs
Security Headers: CSP, X-Frame-Options, X-Content-Type-Options in next.config.js
```

---

## PWA-KONFIGURATION

```
next-pwa (Workbox)
manifest.json mit App-Icons
Service Worker:
  - Cache-First: App-Shell
  - Stale-While-Revalidate: Putzplan, Einkaufsliste (letzter Stand)
  - Offline-Schreiben: NICHT im MVP
```

### iOS-Besonderheiten (beachten!)
- Nutzer muss sich nach PWA-Installation **einmalig neu anmelden** (eigener Browsing-Context)
- Web Push nur ab iOS 16.4+, nur wenn PWA über Homescreen geöffnet
- LocalStorage wird nach 7 Tagen ohne Nutzung gelöscht → **immer Cookies verwenden**

---

## HOSTING (Railway)

```
Service:      Railway (EU-Region)
DB:           PostgreSQL als Managed Service (Railway)
SSL:          automatisch (Let's Encrypt)
Backups:      automatisch täglich
Kosten:       ~5–15 €/Monat
```

---

## MVP-ROADMAP

### Phase 1 – Foundation
**Schritt 1: Projektsetup** (~1–2 Tage)
- [ ] Next.js 14 + PayloadCMS initialisieren
- [ ] PostgreSQL verbinden
- [ ] Tailwind + shadcn/ui einrichten
- [ ] ESLint / Prettier konfigurieren
- [ ] Git-Repo anlegen

**Schritt 2: Auth & User-Management** (~2–3 Tage)
- [ ] Payload-Auth konfigurieren (JWT + Cookies)
- [ ] Login-Seite (React Hook Form + Zod)
- [ ] Cookie-Session einrichten
- [ ] Kein öffentliches Signup – Admin-only
- [ ] Grundlegendes Layout mit Navigation

### Phase 2 – Core Features
**Schritt 3: Putzplan** (~3–4 Tage)
- [ ] `CleaningTasks` Collection anlegen
- [ ] Rotationslogik (ISO-Wochennummer-basiert, Index in DB persistieren)
- [ ] Aufgaben anzeigen und abhaken
- [ ] Timestamp-Tracking
- [ ] Admin-Reset-Funktion

**Schritt 4: Einkaufsliste** (~2–3 Tage)
- [ ] `ShoppingItems` Collection
- [ ] CRUD-Operationen
- [ ] Optimistic Updates (SWR)
- [ ] Käufer-Tracking + Item wieder freischalten

### Phase 3 – Extended Features
**Schritt 5: Kalender** (~3–4 Tage)
- [ ] `Events` Collection
- [ ] react-big-calendar einbinden
- [ ] Monatsansicht
- [ ] Termin erstellen per Klick auf Tag
- [ ] Termin löschen / bearbeiten

**Schritt 6: Dashboard** (~2 Tage)
- [ ] Diese Woche: meine Aufgabe
- [ ] Nächste 3 Termine
- [ ] Einkaufsliste-Snippet
- [ ] Mobile-First Responsive Design

### Phase 4 – PWA
**Schritt 7: PWA-Konfiguration** (~1–2 Tage)
- [ ] next-pwa installieren und konfigurieren
- [ ] manifest.json + App-Icons generieren
- [ ] Service Worker für Offline-Caching
- [ ] iOS "Add to Home Screen" testen

### Phase 5 – Launch
**Schritt 8: Deployment** (~1–2 Tage)
- [ ] Railway-Deployment einrichten
- [ ] Domain + SSL konfigurieren
- [ ] Automatische Backups prüfen
- [ ] Rate-Limiting aktivieren
- [ ] Security Headers setzen
- [ ] Basis-Monitoring (Uptime-Check)

**Gesamtdauer MVP:** 4–6 Wochen (Teilzeit) · 2–3 Wochen (Vollzeit)

---

## POST-MVP (Phase 6+)

- [ ] `TaskSwapRequests` – Tauschanfragen-Feature
- [ ] Push Notifications (web-push + VAPID Keys + Service Worker)
- [ ] iCal-Export (`ical-generator` npm)
- [ ] Chat-Modul (SSE oder socket.io)
- [ ] Google Calendar API (bidirektional)

---

## RISIKEN & MITIGATIONEN

| Risiko | Mitigation |
|---|---|
| iOS löscht PWA-Session nach 7 Tagen | Refresh Token 30 Tage, stiller Auto-Refresh, User informieren |
| Rotationslogik bricht bei Swap + Wochenwechsel | `rotationIndex` in DB persistieren, Unit Tests, Admin-Reset |
| Payload-Update bricht API | Version pinnen, Staging-Env, Changelog lesen |
| PostgreSQL-Datenverlust | Tägliche Backups (Railway), wöchentlicher manueller Export, Restore testen |
| Push auf alten iOS-Geräten fehlt | Fallback: In-App-Notification + E-Mail |
| Concurrent Writes Einkaufsliste | Optimistic Updates + Server als Source of Truth |
| Chat verzögert MVP | Chat komplett raus aus MVP |

---

## RULES

- For Each task, you can assign subtasks to other agents for better organization
- After each task, ask for approval before proceeding
- After each approval, update the Documentation.md file
- After each approval, update the Agent.md file