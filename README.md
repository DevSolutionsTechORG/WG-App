# WG-App

Eine Haushaltsmanagement-App für Wohngemeinschaften. Die App ermöglicht WG-Mitgliedern die Organisation von Putzplänen, Einkaufslisten und gemeinsamen Terminen.

## Technologie-Stack

- **Payload CMS 3.84.1** – Headless CMS mit Authentifizierung und MongoDB
- **Next.js 16.2.3** – React Framework mit App Router
- **TypeScript 5.7.3** – Typsichere Entwicklung
- **Tailwind CSS 3.4.19** – Utility-First CSS Framework
- **MongoDB** – Datenbank für CMS-Daten
- **Zod** – Schema-Validierung
- **React Hook Form** – Formularverwaltung

---

## Setup-Anleitung

### Voraussetzungen

- Node.js 18.20.2+ oder 20.9.0+
- pnpm 9+ oder 10+
- MongoDB (lokal oder via Docker)

### Installation

1. **Repository klonen**
   ```bash
   git clone <repo-url>
   cd wg-app
   ```

2. **Umgebungsvariablen konfigurieren**
   ```bash
   cp .env.example .env
   ```
   
   Bearbeite `.env`:
   ```
   DATABASE_URL=mongodb://127.0.0.1/wg-app
   PAYLOAD_SECRET=your-secret-key-here
   ```

3. **Abhängigkeiten installieren**
   ```bash
   pnpm install
   ```

4. **Datenbank starten (Docker)**
   ```bash
   docker-compose up -d
   ```
   
   Oder MongoDB lokal installieren und in `.env` konfigurieren.

5. **Entwicklungsserver starten**
   ```bash
   pnpm dev
   ```

6. **App aufrufen**
   Öffne `http://localhost:3000` im Browser.

7. **Ersten Admin-User erstellen**
   Folge den Anweisungen auf dem Bildschirm, um einen Admin-User anzulegen.

### Verfügbare Scripts

| Script | Beschreibung |
|--------|--------------|
| `pnpm dev` | Dev-Server starten |
| `pnpm devsafe` | Dev-Server mit Cache-Löschung |
| `pnpm build` | Produktionsbuild |
| `pnpm start` | Produktionsserver starten |
| `pnpm lint` | ESLint ausführen |
| `pnpm test` | Alle Tests ausführen |
| `pnpm test:int` | Integrationstests (Vitest) |
| `pnpm test:e2e` | E2E-Tests (Playwright) |
| `pnpm generate:types` | Payload-Typen generieren |
| `pnpm payload` | Payload CLI |

---

## Projektstruktur

```
src/
├── app/
│   ├── (frontend)/          # Next.js Frontend (App Router)
│   │   ├── dashboard/        # Dashboard-Seite
│   │   ├── cleaning/         # Putzplan-Seite
│   │   ├── shopping/         # Einkaufslisten-Seite
│   │   ├── calendar/         # Kalender-Seite
│   │   ├── login/            # Login-Seite
│   │   ├── layout.tsx        # Root Layout
│   │   ├── page.tsx          # Root Page (redirect zu /dashboard)
│   │   └── styles.css        # Globale Styles
│   ├── (payload)/            # Payload CMS Admin
│   └── my-route/             # API-Routen (optional)
├── collections/              # Payload Collections
│   ├── Users.ts              # Benutzer-Collection
│   └── Media.ts              # Medien-Collection
├── components/               # React-Komponenten
│   ├── ui/                   # UI-Komponenten (Buttons, Inputs, etc.)
│   └── navigation.tsx        # Navigation-Komponente
├── lib/                      # Hilfsfunktionen
│   └── utils.ts              # Utility-Funktionen (cn, etc.)
├── payload.config.ts         # Payload-Konfiguration
└── payload-types.ts          # Generierte TypeScript-Typen

tests/
├── e2e/                      # Playwright E2E-Tests
├── int/                      # Vitest Integrationstests
└── helpers/                  # Test-Hilfsfunktionen
```

---

## Komponenten-Übersicht

### Vorhandene Komponenten

| Komponente | Pfad | Beschreibung | CMS-Verknüpfung |
|------------|------|--------------|-----------------|
| `Navigation` | `src/components/navigation.tsx` | Responsive Navigation (Mobile: Bottom, Desktop: Top) | Nein – statische Links |

### Geplante Komponenten

- Putzplan-Kalender
- Einkaufslisten-Manager
- Termin-Übersicht
- WG-Mitglieder-Verwaltung

---

## Anleitung zur Erstellung neuer Komponenten

### Namenskonventionen

- **Komponenten**: PascalCase (z.B. `CleaningSchedule.tsx`)
- **Ordner**: PascalCase (z.B. `CleaningSchedule/`)
- **Styles**: SCSS Modules (z.B. `CleaningSchedule.module.scss`)
- **Dateien**: Komponente und Styles im selben Ordner

### Ordnerstruktur für neue Komponenten

```
src/components/
├── ui/                       # Primitive UI-Komponenten
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.module.scss
│   └── Input/
│       ├── Input.tsx
│       └── Input.module.scss
├── layout/                   # Layout-Komponenten
│   └── Navigation/
│       ├── Navigation.tsx
│       └── Navigation.module.scss
└── sections/                 # Seiten-Sections
    └── HeroSection/
        ├── HeroSection.tsx
        └── HeroSection.module.scss
```

### TypeScript Interface für Props

```typescript
// src/components/sections/HeroSection/HeroSection.tsx
import styles from './HeroSection.module.scss'

interface HeroSectionProps {
  title: string
  subtitle?: string
  backgroundImage?: string
}

export function HeroSection({ title, subtitle, backgroundImage }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </section>
  )
}
```

### Einbinden in eine Seite

```typescript
// src/app/(frontend)/[slug]/page.tsx
import { HeroSection } from '@/components/sections/HeroSection/HeroSection'

export default async function Page() {
  // Daten vom CMS laden (optional)
  // const data = await payload.find({...})

  return (
    <main>
      <HeroSection 
        title="Willkommen in der WG-App" 
        subtitle="Organisiere deinen Haushalt" 
      />
    </main>
  )
}
```

---

## CMS-Dokumentation

### Collections

#### Users

Benutzer-Authentifizierung mit Rollen-System.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `name` | Text | Anzeigename des Users |
| `email` | Email | Login-E-Mail (Payload Auth) |
| `password` | Password | Login-Passwort |
| `avatar` | Upload | Profilbild (Relation zu Media) |
| `role` | Select | `member` oder `admin` |

**Admin-Konfiguration:**
- `useAsTitle`: `name`
- Auth aktiviert mit 15-Minuten Token-Ablauf
- Cookies: Secure in Produktion, SameSite: Lax

#### Media

Medien-Upload-Collection.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `alt` | Text | Alt-Text für Barrierefreiheit |
| `file` | Upload | Bilddatei |

**Zugriff:**
- `read`: Public (für Frontend-Bilder)

### Geplante Collections

- `cleaning-tasks` – Putzplan-Aufgaben
- `shopping-items` – Einkaufslisten-Einträge
- `events` – WG-Termine und Events
- `expenses` – WG-Ausgaben (optional)

### Blocks

Derzeit keine Blocks definiert. Geplant für zukünftige Layout-Builder-Funktionalität.

---

## Aktuelle Einschränkungen / Todo

### In Entwicklung

- [ ] **Putzplan-Feature**: Rotierender Putzplan mit Aufgaben-Zuweisung
- [ ] **Einkaufsliste**: Gemeinsame Einkaufsliste mit Hinzufügen/Entfernen
- [ ] **Kalender**: WG-Termine und Events verwalten
- [ ] **CMS-Integration**: Dashboard-Daten aus Payload laden

### Bekannte Einschränkungen

- Dashboard zeigt aktuell nur statische Inhalte
- Putzplan-, Einkaufs- und Kalender-Seiten sind Platzhalter
- Keine Echtzeit-Synchronisation zwischen WG-Mitgliedern
- Mobile Navigation ist implementiert, aber UI-Komponenten-Bibliothek noch minimal

### Geplante Verbesserungen

- UI-Komponenten-Bibliothek erweitern (Button, Card, Modal, etc.)
- Dark Mode Support
- Push-Benachrichtigungen
- Expense-Tracking für WG-Ausgaben

---

## Entwicklungs-Workflow

### Commit-Struktur

- **Trennung von CMS und Frontend**: Separate Commits für Payload-Änderungen und Frontend-Code
- **Pro Komponente ein Commit**: Einzelne Commits für neue Komponenten
- **Pro Collection ein Commit**: Einzelne Commits für neue Collections
- **README aktualisieren**: Bei jedem relevanten Commit die README ergänzen

### Beispiel-Commits

```
docs: update README with new components
feat: add CleaningSchedule component
feat(cms): add CleaningTasks collection
feat: integrate CleaningSchedule with CMS data
```

---

## Weitere Ressourcen

- [Payload CMS Dokumentation](https://payloadcms.com/docs)
- [Next.js Dokumentation](https://nextjs.org/docs)
- [Tailwind CSS Dokumentation](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Dokumentation](https://zod.dev/)

---

## Support

Bei Fragen oder Problemen:
- [Payload Discord](https://discord.com/invite/payload)
- [Payload GitHub Discussions](https://github.com/payloadcms/payload/discussions)
