# DLD

Inventory management app for Thai dental clinics — built with React Native + Expo.

Scan barcodes, track stock batches across branches, receive deliveries, and
review stock-movement history, all backed by Supabase.

## Tech stack

| Layer       | Library                                              |
| ----------- | ---------------------------------------------------- |
| Framework   | Expo ~54 / React Native 0.81                         |
| Router      | expo-router ~6 (file-based, `app/` directory)        |
| Styling     | NativeWind v4 + Tailwind CSS v3                      |
| Animations  | react-native-reanimated ~4.1 + react-native-worklets |
| Gestures    | react-native-gesture-handler                         |
| Camera      | expo-camera ~17                                      |
| Backend     | Supabase (auth + edge functions)                    |
| Icons       | lucide-react-native                                  |

## Prerequisites

- **Node.js 20+** (CI runs on Node 20)
- **Yarn 1.x** — the package manager for this repo
- **Expo tooling** — installed via dependencies; run with `yarn expo`
- An iOS Simulator / Android emulator, or the Expo Dev Client on a device

## Getting started

```bash
# 1. Install dependencies
yarn install

# 2. Configure environment
cp .env.example .env
# then fill in your Supabase URL + anon key in .env

# 3. Start the dev server
yarn start        # then press `i` (iOS) or `a` (Android)

# …or launch a platform directly
yarn ios
yarn android
```

## Environment variables

Copy `.env.example` to `.env` and set both. `EXPO_PUBLIC_*` vars are bundled
into the client, so never put secrets here.

| Variable                       | Required | Description                  |
| ------------------------------ | -------- | ---------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`     | yes      | Supabase project URL         |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`| yes      | Supabase anonymous (public) key |

## Scripts

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `yarn start`        | Start the Expo dev server                |
| `yarn ios`          | Build & run on iOS                       |
| `yarn android`      | Build & run on Android                   |
| `yarn test`         | Run the Jest suite once                  |
| `yarn test:watch`   | Run Jest in watch mode                   |
| `yarn lint`         | Lint with ESLint (`expo lint`)           |
| `yarn typecheck`    | Type-check with `tsc --noEmit`           |

## Project structure

```
app/          expo-router file-based routes (screens, layouts, modals)
components/    feature components, grouped by feature (components/<feature>/)
lib/          services (Supabase edge-fn calls), supabase client, reducers, utils
docs/          epic docs — current implemented logic per feature
__tests__/     Jest tests, mirroring lib/
```

## Testing

```bash
yarn test        # single run
yarn test:watch  # watch mode
```

Stack: Jest + `jest-expo` + `@testing-library/react-native`. Tests live under
`__tests__/`, mirroring `lib/`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs **lint → typecheck → test**
on every pull request and on pushes to `main`.

## Backend

The app never reads or writes Supabase tables directly from the client. All
backend calls go through Supabase **edge functions** (`/functions/v1/<fn>`),
which forward the caller's JWT so RLS still applies. Edge functions live in a
separate repo (`dld-spb`) and are deployed from there. The Supabase JS client
is used only for auth/session.

## Conventions

`AGENTS.md` is the source of truth for coding conventions (styling, React
Native rules, services, state machines). Per-feature implementation details
live in `docs/` epic docs (scanner, inbound, activities).
