<div align="center">
  <img src="docs/assets/banner.svg" alt="AyurSutra System Interface" width="100%" />
</div>

<br />

<div align="center">
  <a href="#overview">Overview</a> | 
  <a href="#architecture">Architecture</a> | 
  <a href="#development">Development</a> | 
  <a href="#domain">Domain Core</a> | 
  <a href="#license">License</a>
</div>

<br />

## Overview

AyurSutra is a clinical Electronic Medical Record (EMR) and patient management system engineered specifically for Ayurvedic practices. It provides a unified dataset across practitioners, therapists, and patients through a single cross-platform codebase built on React Native and Expo.

The system handles everything from patient intake and Tri-Dosha assessment to multi-stage Panchakarma scheduling and daily Dinacharya tracking. 

## Architecture

The application is structured as a monolithic client-side application with universal routing via Expo Router, ensuring parity across iOS, Android, and Web/PWA targets.

- **Framework**: React 19, React Native 0.86, Expo SDK 57
- **Routing**: Expo Router (File-based)
- **State Management**: Zustand (Session) + TanStack Query (Data Fetching / Caching)
- **Styling**: Uniwind (Tailwind v4) + HeroUI Native
- **Validation**: Zod + Oxlint/Oxfmt (Rust-based tooling)

### Data Flow

State updates rely on an optimistic mutation strategy. Actions taken by users—such as completing a daily routine or submitting a consultation note—are committed to local cache instantly, ensuring zero UI latency, while synchronizing with the backend in the background.

## Domain Core

The core clinical domain is divided into distinct, role-based workflows operating on a shared dataset:

- **Prakriti Diagnostic Engine**: A procedural scoring system that evaluates physical and mental traits to determine patient constitution (Vata, Pitta, Kapha).
- **Panchakarma Protocol**: A scheduling engine that divides treatments into Purva Karma (preparation), Pradhana Karma (primary), and Paschat Karma (rejuvenation), assigning tasks directly to therapist queues.
- **Formulary**: A searchable, standardized database of classical formulations, dosages, and Anupana (vehicles).

## Development

Node.js v20+ and npm v10+ are required.

### Initial Setup

```bash
git clone https://github.com/Naval721/AyurSutra-App.git
cd AyurSutra-App
npm install
```

### Local Environment

```bash
# Start the Metro bundler
npx expo start
```

From the Metro terminal, press `w` to run on web, `i` for iOS Simulator, or `a` for Android Emulator.

### Build and Deployment

```bash
# Build the Progressive Web App
npm run build:pwa

# Build native binaries
npm run ios
npm run android
```

### Verification

```bash
# Run type checking, linting, and formatting checks
npx tsc --noEmit
npm run lint
npm run format:check
```

## License

MIT License. See the LICENSE file in the repository root.
