# AyurSutra

Clinic software for Ayurvedic practice — Panchakarma scheduling, Prakriti assessment,
prescriptions and a patient daily journal, in one record shared between the clinic and
the patient.

Runs as a native app on iOS and Android, and as an installable PWA on the web, from a
single Expo Router codebase.

## Who uses it

The app ships three signed-in experiences off one auth layer:

| Role           | What they get                                                            |
| -------------- | ------------------------------------------------------------------------ |
| **Doctor**     | Daily roster, patient directory, clinical notes, prescriptions, protocols |
| **Therapist**  | Panchakarma session checklist for the day, per-session status updates     |
| **Patient**    | Dinacharya tracker, booking, symptom journal, records, Prakriti history   |

## Stack

- **Expo** (SDK 57) + **React Native** 0.86 + **React** 19 with the React Compiler
- **Expo Router** for file-based routing and typed routes
- **HeroUI Native** + **Uniwind** (Tailwind v4 for React Native) for the design system
- **TanStack Query** for server state, **Zustand** for the session
- **AsyncStorage** for persistence, **Workbox** for the PWA service worker
- **oxlint** + **oxfmt** for linting and formatting

## Getting started

Requires Node.js 20.19.4 or newer.

```sh
npm install
npx expo start
```

Press `w` for the browser, or scan the QR code with Expo Go on a device.

Sign in with any of the seeded accounts (any password of 4+ characters):

- `doctor@ayursutra.in`
- `therapist@ayursutra.in`
- `patient@ayursutra.in`

In development the sign-in screen lists these as one-tap shortcuts; the list is compiled
out of release builds.

## Scripts

| Script                  | Does                                                     |
| ----------------------- | -------------------------------------------------------- |
| `npm run android`       | Build and run the native Android app                     |
| `npm run ios`           | Build and run the native iOS app                         |
| `npm run export:web`    | Static web export to `dist/`                             |
| `npm run build:pwa`     | Web export plus a Workbox service worker for offline use  |
| `npm run lint`          | oxlint with type-aware rules                             |
| `npm run lint:css`      | Checks `global.css` theme tokens against `lib/theme.ts`   |
| `npm run format`        | oxfmt over the repo                                      |
| `npm run expo-check`    | Verifies dependency versions against the installed SDK    |

## Layout

```
app/                     Routes (expo-router)
  (auth)/                Sign in, sign up
  (patient)/             Patient tabs, journal, prakriti, treatment, prescription
  (practitioner)/        Doctor and therapist tabs, roster, patient records
components/ui/           Design-system pieces: Screen, Surface, Card, StatTile, ...
components/ui/primitives Platform shims (native vs web) for gradient, svg, webview, maps
lib/api/                 Data layer — swap these modules for live HTTP calls
lib/mock/                Seed records that back the API layer during development
lib/theme.ts             Hex mirrors of the CSS theme tokens, for native-only props
global.css               Theme tokens (light + dark) and brand/dosha utilities
```

## Data layer

`lib/api/*` is the only place screens read or write records. Each module is currently
backed by the in-memory seed in `lib/mock/`, behind an artificial latency so loading and
error states stay honest. Point those modules at real endpoints and nothing above them
has to change.

## Theming

Semantic tokens (`--background`, `--surface`, `--accent`, ...) live in `global.css` inside
Uniwind theme variants so native picks them up from the active theme table, not just web
CSS. Brand and dosha colors are declared once in `@theme` and mirrored as hex in
`lib/theme.ts` for props that cannot resolve a className — icon colors, navigation tints,
the status bar. `npm run lint:css` fails if the two drift apart.

## Deploying

**Web / PWA**

```sh
npm run build:pwa
```

Serve `dist/` with a single `404 → /index.html` fallback; the app is exported as an SPA
(`web.output: 'single'`).

**Native**

Build with EAS, or `npm run ios` / `npm run android` for local release builds. Bundle
identifiers and the version come from `app.config.ts` and can be overridden with the
`AYURSUTRA_*` environment variables.
