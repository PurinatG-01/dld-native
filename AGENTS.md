# Agent Instructions — dld-native

React Native + Expo inventory management app for Thai dental clinics. **Read this before writing any code.** When in doubt about patterns, read existing files first — they are the source of truth. Always use the best practical pattern for React Native.

## Contents

- [Tech Stack](#tech-stack)
- [Project Status](#project-status)
- [Epic Documentation](#epic-documentation)
- [Styling Rules](#styling-rules)
- [React Native Rules](#react-native-rules)
- [Project Conventions](#project-conventions)
- [Testing](#testing)

---

## Tech Stack

| Layer       | Library                                                           |
| ----------- | ----------------------------------------------------------------- |
| Framework   | Expo ~54 / React Native 0.81                                      |
| Router      | expo-router ~6 (file-based, `app/` directory)                     |
| Styling     | NativeWind v4 + Tailwind CSS v3                                   |
| Animations  | react-native-reanimated ~4.1 + react-native-worklets              |
| Gestures    | react-native-gesture-handler                                      |
| Camera      | expo-camera ~17 (`CameraView`, `useCameraPermissions`)            |
| Backend     | Supabase (auth + edge functions)                                  |
| Icons       | lucide-react-native                                               |
| Native tabs | react-native-bottom-tabs (via `expo-router/unstable-native-tabs`) |

**Package manager:** Yarn 1.22.22

---

## Project Status

_As of 2026-05-30._

| Area                   | Status         | Note                                                                                                                                                    |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App shell              | ✅ Done        | Native UITabBar (iPhone) + sidebar (iPad/Mac) · Expo Router v6 · portrait lock on iPhone                                                                |
| Auth — login           | ✅ Done        | Supabase email/password · redirects to dashboard                                                                                                        |
| Inventory list         | ✅ Done        | Infinite scroll · pull-to-refresh · 500ms debounce search · category filter · sort · live API                                                           |
| Item detail            | ✅ Done        | Item metadata + stock batch list · live API                                                                                                             |
| Scanner — camera modal | 🟡 In progress | Real barcode scan + lookup live · 4-state machine · swipeable summary sheet · quantity controls · dev-only simulate-scan button · submit flow not built |
| Activities             | ✅ Done        | "Activities" tab + Dashboard "Recent activity" · live `list-movements` edge fn · accordion rows expand to item lines · action-type filter · date/type sort · infinite scroll |
| Dashboard              | 🟡 Stub        | Tab present · placeholder stat cards · "Recent activity" list now live (10 latest movements)                                                            |
| Account                | ✅ Done        | Profile card · settings row (inert) · confirm-dialog sign-out                                                                                           |
| BE — `create-movement` | 🔴 Not started | Write endpoint for stock_movement — needed for scanner submit flow                                                                                      |
| RLS                    | 🔴 Stub only   | All policies open (`qual = true`), branch-scoping not enforced                                                                                          |

---

## Epic Documentation

Each epic has (or will have) a living doc under `docs/` describing its **current implemented logic** — not a plan or spec. Read the relevant epic doc before changing that feature, and keep it in sync when the logic changes.

| Epic      | Status         | Doc                                            |
| --------- | -------------- | ---------------------------------------------- |
| Scanner   | 🟡 In progress | [`docs/scanner-epic.md`](docs/scanner-epic.md) |
| Inbound   | 🟡 In progress | [`docs/inbound-epic.md`](docs/inbound-epic.md) |
| Activities | ✅ Done     | [`docs/activities-epic.md`](docs/activities-epic.md) |
| Inventory | ✅ Done        | _Not yet written — see Project Status + code_  |
| Auth      | ✅ Done        | _Not yet written — see Project Status + code_  |
| Account   | ✅ Done        | _Not yet written — see Project Status + code_  |
| Dashboard | 🟡 Stub        | _Not yet written_                              |

### Scanner

Barcode-scanner feature: camera modal, lookup against live inventory, scanned-items list with quantities. The doc covers the `useReducer` state machine, scan lifecycle (real + dev simulate), swipeable summary sheet, components, and what's done vs not.

→ [`docs/scanner-epic.md`](docs/scanner-epic.md)

### Inbound

Form-first "Receive delivery" flow (Story 1B): select supplier + branch + default location, add/edit/remove item lines (search, qty, lot, expiry, location), submit via the `receive_inbound` RPC. The doc covers the `useReducer` state machine, root-level routing, the mocked service layer, and done-vs-not.

→ [`docs/inbound-epic.md`](docs/inbound-epic.md)

### Activities

Read-only stock-movement history: an "Activities" tab and a Dashboard "Recent activity" preview, both backed by the `list-movements` edge function. Each movement is an accordion row that expands to show its `stock_movement_item` lines (item · lot · qty · location). The doc covers the edge function contract, the accordion animation rules, and the list screen.

→ [`docs/activities-epic.md`](docs/activities-epic.md)

> Adding an epic doc for another area? Add its row to the table above and a matching subsection here. Epic docs describe **current logic only** — historical design notes and plans live in Notion (Dental Logistics → Tech) and git history, not in this repo.

---

## Styling Rules

### NativeWind first

Use `className` for all styling. Do **not** use `StyleSheet.create` unless the value cannot be expressed in NativeWind:

| Allowed exception                                 | Example                              |
| ------------------------------------------------- | ------------------------------------ |
| `rgba()` / `hsla()` colors                        | `backgroundColor: "rgba(0,0,0,0.6)"` |
| `position: "absolute"` with computed pixel values | `top: SCREEN_HEIGHT * 0.5 - 52`      |
| Constants from `Dimensions`                       | `height: FINDER_SIZE`                |
| `StyleSheet.hairlineWidth`                        | 0.5px iOS border                     |
| Reanimated animated styles                        | `useAnimatedStyle(() => ({ ... }))`  |
| iOS shadow props                                  | `shadowColor`, `shadowRadius`        |

### Color

All tokens are in `tailwind.config.js` — that is the single source of truth. Never add hex values to component code.

Two ways to use a token:

- `className="bg-primary"` — NativeWind handles it
- `useColor("primary")` from `@/lib/useColor` — for JS-level props where NativeWind can't reach

Use `useColor` for: icon `color=` props (lucide ignores `style.color`), `placeholderTextColor`, `tintColor`, Reanimated shadow colors.

---

## React Native Rules

- **`Pressable` only** — never `TouchableOpacity` or `TouchableHighlight`. Press feedback: `active:opacity-70` for buttons/chips, `active:bg-muted/50` for list rows.
- **Animate `transform` and `opacity` only** — never `top`, `left`, `width`, or `height` inside `useAnimatedStyle`. Those trigger layout recalculation every frame.
- **`FlatList` for dynamic lists** — `ScrollView` + `.map()` only for short static content (≤ ~8 items). Wrap row components in `React.memo`; pass primitives not objects; hoist callbacks with `useCallback`.
- **No components inside components** — component functions defined inside a parent are recreated as new types every render, causing unmount/remount. Always define at module level.
- **No falsy `&&` in JSX** — `{count && <X />}` crashes if `count === 0`. Use `{count > 0 ? <X /> : null}`.

---

## Project Conventions

### Services

All backend calls live in `lib/services/`. See `lib/services/inventory.ts` for the pattern: get session → build URL to edge function → fetch with Bearer token → throw on error. Never inline fetch calls in components.

**Always go through an edge function.** Services must call `/functions/v1/<fn>` — **never** call `supabase.rpc(...)` or `supabase.from(...)` table reads/writes directly from the client. The Supabase JS client is used only for auth/session (`supabase.auth.*`). RPCs (e.g. `receive_inbound`) are invoked from inside an edge function, which forwards the caller's JWT so RLS / `auth.uid()` checks still apply. Edge functions live in the separate `dld-spb` repo (`supabase/functions/<fn>/index.ts`) and are deployed from there. Inbound uses `inbound-refdata` (reads) + `receive-inbound` (write).

### Navigation

Tab layout uses `NativeTabs` + `NativeTabs.Trigger` with SF Symbol icons — see `app/(app)/_layout.tsx`. The scanner tab has `role="search"`, which opens `app/scanner-modal.tsx` as a root modal instead of navigating to `scanner.tsx`. Always call `markModalClosed()` from `lib/scanner-state.ts` before dismissing the modal.

### State machine

Multi-step async flows use `useReducer` with a discriminated union state type. See `app/scanner-modal.tsx` for the reference implementation (full walkthrough in the [Scanner epic doc](docs/scanner-epic.md)). Key rules: invalid transitions return state unchanged; while in a non-idle state, new trigger events are silently ignored (debounce guard via the reducer itself).

### Component structure

Feature components live under `components/<feature>/` with `types.ts` + `constants.ts` co-located. See `components/scanner/` as the reference. Pass data and callbacks as props — components do not reach into `app/` or sibling feature directories. If a component owns an animation, it declares its own `useSharedValue` internally; only pass a `SharedValue` as a prop when the parent genuinely needs to drive it.

### Reanimated

Animated styles must be returned from `useAnimatedStyle` — never derive them inline in the component body.

---

## Testing

Tests mirror `lib/` under `__tests__/`. Stack: Jest + `jest-expo` + `@testing-library/react-native`.

```
yarn test        # single run
yarn test:watch  # watch mode
```
