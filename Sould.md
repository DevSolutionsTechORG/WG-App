# Soul – Agent Erinnerungen & Notizen

> Persönliche Notizen, Learnings und Kontext für zukünftige Agent-Sessions

---

## Projekt-Kontext

**WG-App** – Private Haushaltsmanagement-App für 2-20 Mitglieder
- Stack: Next.js 16+ (App Router) + PayloadCMS (embedded) + MongoDB
- Ziel: PWA für iOS/Android, kein App Store, kein Flutter
- Hosting: Railway (EU-Region)

---

## Architektur-Entscheidungen (fest)

| Entscheidung | Begründung |
|--------------|------------|
| PWA statt Native | Schnellere Entwicklung, keine App Store-Abhängigkeit |
| PayloadCMS embedded | Einheitliche Codebase, kein separater Service |
| PostgreSQL | Railway Managed Service, automatische Backups |
| JWT + HTTP-only Cookies | Sicher, XSS-resistent |
| shadcn/ui + Tailwind | Schnelle UI-Entwicklung, konsistentes Design |
| Zustand + SWR | Global State + Server State Caching |
| Kein Chat im MVP | WhatsApp als Interim-Lösung |
| Keine Push Notifications im MVP | Reduziert Komplexität |

---

## Wichtige technische Details

### iOS-Besonderheiten (immer beachten!)
- Nach PWA-Installation: Nutzer muss sich **einmalig neu anmelden**
- Web Push erst ab iOS 16.4+, nur bei Homescreen-Öffnung
- LocalStorage nach 7 Tagen gelöscht → **immer Cookies verwenden**

### Cookie-Konfiguration (Pflicht)
```
HttpOnly: true
Secure: true
SameSite: Lax
Path: /
Max-Age: 2592000 (30 Tage)
```

### Datenmodell-Besonderheiten
- `CleaningTasks.rotationIndex` → **in DB persistieren**, nie neu berechnen
- `TaskSwapRequests` → Post-MVP Feature
- Kein öffentliches Signup → Admin-only User-Erstellung

---

## MVP-Roadmap (Chronologie)

1. **Foundation** → Projektsetup, Auth, User-Management
2. **Core Features** → Putzplan, Einkaufsliste
3. **Extended Features** → Kalender, Dashboard
4. **PWA** → Offline-Caching, Icons, manifest.json
5. **Launch** → Railway-Deployment, SSL, Backups

---

## Sicherheits-Checkliste

- [ ] Rate Limiting (Upstash Redis) für Login-Endpunkt
- [ ] Zod-Validierung für alle Server-Inputs
- [ ] Security Headers (CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] CSRF-Schutz durch Server Actions (by default)
- [ ] XSS-Schutz durch HttpOnly Cookies

---

## Risiken & Learnings

| Risiko | Mitigation | Status |
|--------|------------|--------|
| iOS löscht Session nach 7 Tagen | 30-Tage Refresh Token, Auto-Refresh | Monitoring |
| Rotationslogik bricht bei Swap | `rotationIndex` in DB, Unit Tests | Geplant |
| PostgreSQL-Datenverlust | Tägliche Railway-Backups | Geplant |
| Concurrent Writes Einkaufsliste | Optimistic Updates + Server Source | Geplant |

---

## API-Patterns (wann verwenden)

| Pattern | Use Case |
|---------|----------|
| Payload Local API | Server Components (Initiales Laden) |
| SWR/TanStack Query | Client Components (reaktive Daten) |
| Server Actions | Mutationen (typsicher) |
| `afterChange` Hooks | Rotationslogik, E-Mail-Notifications |

---

## Post-MVP Ideen

- `TaskSwapRequests` – Tauschanfragen
- Push Notifications (web-push + VAPID)
- iCal-Export
- Chat-Modul
- Google Calendar Integration

---

## Agent-Workflow-Regeln

- Subtasks an andere Agents delegieren für bessere Organisation
- Nach jedem Task: Approval einholen
- Nach Approval: Documentation.md updaten
- Nach Approval: Agent.md updaten

---

## Gesprächs-History

**2026-05-05**: Initialer Task – Soul.md und Tasks.md erstellen, Subtask-Struktur aufbauen

