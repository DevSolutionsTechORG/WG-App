# WG-App – Projekt-Dokumentation

> Aktueller Entwicklungsstand und technische Dokumentation

---

## Projekt-Übersicht

**WG-App** – Private Haushaltsmanagement-App für 2-20 Mitglieder
- Stack: Next.js 16+ (App Router) + PayloadCMS (embedded) + PostgreSQL
- Ziel: PWA für iOS/Android, kein App Store
- Hosting: Railway (EU-Region)

---

## Entwicklungs-Status

### Phase 1 – Foundation 🔄 IN PROGRESS

| Task | Status | Start | Fertig |
|------|--------|-------|--------|
| 1.1 Projektsetup | **In Progress** | 2026-05-05 | – |
| 1.1.1 Next.js init | **Completed** | 2026-05-05 | 2026-05-05 | Next 16.2.3 + Payload 3.84.1 |
| 1.1.2 Payload init | **Completed** | 2026-05-05 | 2026-05-05 | Bereits konfiguriert |
| 1.1.3 Datenbank-Adapter | **Completed** | 2026-05-05 | 2026-05-05 | MongoDB (wie im Setup) |
| 1.1.4 Tailwind + shadcn | **Completed** | 2026-05-05 | 2026-05-05 | UI-Setup |
| 1.1.5 ESLint + Prettier | **Completed** | 2026-05-05 | 2026-05-05 | Code-Quality |
| 1.1.6 Git | **Completed** | 2026-05-05 | 2026-05-05 | Bereits vorhanden |
| 1.2 Auth & User-Management | **In Progress** | 2026-05-05 | – | Users, Login, Layout |

### Kommende Phasen

| Phase | Status |
|-------|--------|
| 2 – Core Features (Putzplan, Einkaufsliste) | Pending |
| 3 – Extended Features (Kalender, Dashboard) | Pending |
| 4 – PWA | Pending |
| 5 – Launch | Pending |

---

## Architektur

### Stack
- **Framework:** Next.js 16+ mit App Router
- **CMS/Backend:** PayloadCMS embedded
- **Datenbank:** PostgreSQL (Railway Managed)
- **Auth:** JWT + HTTP-only Cookies
- **UI:** shadcn/ui + Tailwind CSS
- **Forms:** React Hook Form + Zod
- **State:** Zustand + SWR

### Projektstruktur
```
src/
  app/
    (frontend)/         # Next.js Seiten
    (payload)/          # Payload Admin + API
  collections/          # Payload Collections
  components/           # React-Komponenten
  lib/                  # API-Client, Helpers
public/
  manifest.json         # PWA Manifest
  icons/                # App-Icons
```

---

## Datenmodelle

### Users
| Feld | Typ |
|------|-----|
| email | Text (unique) |
| password | Password |
| name | Text |
| avatar | Upload |
| role | Select (member/admin) |

### CleaningTasks
| Feld | Typ |
|------|-----|
| taskName | Text |
| assignedTo | Relationship → Users |
| weekNumber | Number |
| year | Number |
| completedAt | Date |
| completedBy | Relationship → Users |
| rotationIndex | Number |

### Events
| Feld | Typ |
|------|-----|
| title | Text |
| description | Textarea |
| startDate | Date |
| endDate | Date |
| createdBy | Relationship → Users |
| allDay | Checkbox |

### ShoppingItems
| Feld | Typ |
|------|-----|
| name | Text |
| category | Select |
| completed | Checkbox |
| completedBy | Relationship → Users |
| completedAt | Date |
| priority | Select |

---

## Umgebungsvariablen

```env
# Database
DATABASE_URL=postgresql://...

# Payload
PAYLOAD_SECRET=your-secret-key

# Auth
JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-secret

# Optional: Upstash Redis for Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Routen

| Route | Beschreibung |
|-------|--------------|
| `/login` | Login-Formular |
| `/dashboard` | Übersicht (Default) |
| `/cleaning` | Putzplan |
| `/calendar` | WG-Kalender |
| `/shopping` | Einkaufsliste |
| `/admin` | Payload Admin Panel |

---

## Changelog

### 2026-05-05
- Initialer Projekt-Start
- Agent.md, Soul.md, Tasks.md erstellt
- Phase 1 approved, Projektsetup beginnt

---

## Notizen

- iOS: LocalStorage nach 7 Tagen gelöscht → immer Cookies verwenden
- rotationIndex in DB persistieren, nie neu berechnen
- Kein öffentliches Signup → Admin-only
- MongoDB ist als Datenbank konfiguriert (wie im Original-Setup)
