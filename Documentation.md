# WG-App – Projekt-Dokumentation

> Aktueller Entwicklungsstand und technische Dokumentation

---

## Projekt-Übersicht

**WG-App** – Private Haushaltsmanagement-App für 2-20 Mitglieder
- Stack: Next.js 16+ (App Router) + PayloadCMS (embedded) + MongoDB
- Ziel: PWA für iOS/Android, kein App Store
- Hosting: Railway (EU-Region)

---

## Entwicklungs-Status

### Phase 1 – Foundation ✅ COMPLETED

| Task | Status | Start | Fertig |
|------|--------|-------|--------|
| 1.1 Projektsetup | **Completed** | 2026-05-05 | 2026-05-06 |
| 1.1.1 Next.js init | **Completed** | 2026-05-05 | 2026-05-05 | Next 16.2.3 + Payload 3.84.1 |
| 1.1.2 Payload init | **Completed** | 2026-05-05 | 2026-05-05 | Bereits konfiguriert |
| 1.1.3 Datenbank-Adapter | **Completed** | 2026-05-05 | 2026-05-05 | MongoDB (wie im Setup) |
| 1.1.4 Tailwind + shadcn | **Completed** | 2026-05-05 | 2026-05-05 | UI-Setup |
| 1.1.5 ESLint + Prettier | **Completed** | 2026-05-05 | 2026-05-05 | Code-Quality |
| 1.1.6 Git | **Completed** | 2026-05-05 | 2026-05-05 | Bereits vorhanden |
| 1.2 Auth & User-Management | **Completed** | 2026-05-05 | 2026-05-06 | Users, Login, Layout, Session, Admin-only Signup |

### Phase 2 – Core Features 🔄 IN PROGRESS

| Task | Status | Start | Fertig |
|------|--------|-------|--------|
| 2.1 Putzplan | **Completed** | 2026-05-06 | 2026-05-06 | ✅ Rotierender Putzplan mit Historie + Überfälligkeits-Tracking |
| 2.2 Einkaufsliste | **Pending** | – | – | Kollaborative Liste |

#### Features in 2.1:
- ✅ Automatische wöchentliche Rotation via `(weekOffset + taskIndex) % userCount`
- ✅ Persistente Zuweisungen in TaskAssignments Collection
- ✅ Historie in TaskCompletionHistory (kein Überschreiben)
- ✅ Überfällige Tasks werden rot markiert und bleiben sichtbar
- ✅ Pflegeoptionen für "Anderes"-Task

### Kommende Phasen

| Phase | Status |
|-------|--------|
| 3 – Extended Features (Kalender, Dashboard) | Pending |
| 4 – PWA | Pending |
| 5 – Launch | Pending |

---

## Architektur

### Stack
- **Framework:** Next.js 16+ mit App Router
- **CMS/Backend:** PayloadCMS embedded
- **Datenbank:** MongoDB (Railway Managed)
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

### CleaningTasks (❌ ENTFERNT)
~~Alte Collection mit statischem rotationIndex – keine echte Rotation möglich~~

Ersetzt durch TaskTemplates + TaskAssignments + TaskCompletionHistory

### TaskTemplates (NEU)
| Feld | Typ | Details |
|------|-----|---------|
| title | Text | z.B. "Wischen", "Saugen", "Anderes" |
| description | Textarea | Beschreibung der Aufgabe |
| rotationGroup | Number | 0 = Gruppe A (wöchentlich rotierend), etc. |
| frequency | Select | weekly, biweekly, monthly |
| isCustom | Checkbox | true für "Anderes" (User kann custom notes hinzufügen) |
| requiresOptions | Checkbox | true wenn User aus Beispielen wählen soll |

### TaskAssignments (NEU) – Persistente Zuweisungen pro Woche
| Feld | Typ | Details |
|------|-----|---------|
| template | Relationship → TaskTemplates | Welche Aufgabe |
| assignedTo | Relationship → Users | Wer ist zuständig |
| weekNumber | Number | ISO-Kalenderwoche |
| year | Number | Jahr |
| status | Select | pending, completed, skipped |
| dueDate | Date | Frist (z.B. Freitag der Woche) |
| createdAt | Date | Wann wurde die Zuweisung erstellt |
| notes | Textarea | Optionale Notizen vom User (besonders für "Anderes") |

### TaskCompletionHistory (NEU) – Erledigungs-Historie
| Feld | Typ | Details |
|------|-----|---------|
| assignment | Relationship → TaskAssignments | Referenz zur Zuweisung |
| template | Relationship → TaskTemplates | Referenz zum Task-Template |
| completedBy | Relationship → Users | Wer hat es erledigt |
| completedAt | Date | Zeitpunkt der Erledigung |
| weekNumber | Number | KW der Erledigung |
| year | Number | Jahr |
| notes | Textarea | Was wurde konkret gemacht (für "Anderes") |
| selectedOption | Text | Falls User aus Pflegeoptionen gewählt hat |

### CleaningTaskOptions (NEU) – Pflegeoptionen für "Anderes"
| Feld | Typ | Details |
|------|-----|---------|
| title | Text | z.B. "Fenster putzen", "Müll rausbringen" |
| description | Textarea | Optionale Details |
| isActive | Checkbox | Soll im Frontend angezeigt werden |
| sortOrder | Number | Reihenfolge im Dropdown |

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

### 2026-05-06 (Abend)
- **Task 2.1 COMPLETED:** Putzplan fertiggestellt
- Überfällige Tasks-Anzeige implementiert (getOverdueAssignments + rote UI)
- Task 2.1 als ✅ COMPLETED in Tasks.md und Documentation.md markiert

### 2026-05-06 (Nachmittag)
- **Task 2.1 REFACTORED:** Korrekte Rotation implementiert
- Neue Collections: TaskTemplates, TaskAssignments, TaskCompletionHistory, CleaningTaskOptions
- Rotationslogik: `(weekOffset + taskIndex) % userCount` mit rotationGroup
- Auto-Generierung von Assignments beim ersten Seitenaufruf pro Woche
- Historie in TaskCompletionHistory statt Überschreiben
- Alte CleaningTasks Collection entfernt

### 2026-05-06 (Morgen)
- **CRITICAL:** Putzplan-Logik analysiert – **keine echte Rotation implementiert**
- `rotationIndex` ist statisch (0,1,2), User wechseln nicht automatisch pro Woche
- `completedWeek/Year` werden überschrieben – **keine Historie**
- Dokumentation aktualisiert: Task 2.1 als "Refactoring Required" markiert
- Neue Collections geplant: TaskTemplates, TaskAssignments, TaskCompletionHistory, CleaningTaskOptions

### 2026-05-05
- Initialer Projekt-Start
- Agent.md, Soul.md, Tasks.md erstellt
- Phase 1 approved, Projektsetup beginnt

---

## Notizen

- iOS: LocalStorage nach 7 Tagen gelöscht → immer Cookies verwenden
- ~~rotationIndex in DB persistieren, nie neu berechnen~~ ❌ **FALSCH** – `rotationIndex` muss dynamisch pro Woche berechnet werden, nicht statisch gespeichert
- Kein öffentliches Signup → Admin-only
- MongoDB ist als Datenbank konfiguriert (wie im Original-Setup)

### Putzplan-Erkenntnisse (2026-05-06)

**Was funktioniert NICHT:**
1. `rotationIndex % users.length` = immer derselbe User für dieselbe Aufgabe
2. `completedWeek/Year` werden beim Abhaken überschrieben → Historie geht verloren
3. Zuweisungen werden zur Laufzeit berechnet, nicht persistiert

**Was die neue Implementation braucht:**
1. `TaskAssignments` Collection – pro Woche persistierte Zuweisungen
2. Rotationsalgorithmus: `(weekOffset + taskIndex) % userCount` für echte Wochen-Rotation
3. `TaskCompletionHistory` – separate Collection für Erledigungs-Tracking
4. `CleaningTaskOptions` – Admin-pflegbare Beispiele für "Anderes"-Task
5. Automatische Assignment-Generierung (on-demand beim ersten Seitenaufruf der Woche)
