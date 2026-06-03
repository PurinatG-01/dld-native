# Agent Instructions — dld-native

React Native + Expo inventory management app for Thai dental clinics. **Read this before writing any code.** When in doubt about patterns, read existing files first — they are the source of truth. Always use the best practical pattern for React Native.

## Contents

- [Tech Stack](#tech-stack)
- [Project Status](#project-status)
- [Epic Documentation](#epic-documentation)
- [Styling Rules](#styling-rules)
- [React Native Rules](#react-native-rules)
- [Project Conventions](#project-conventions)
- [Known Risks / Tech Debt](#known-risks--tech-debt)
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

_As of 2026-06-03._

| Area                   | Status         | Note                                                                                                                                                    |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App shell              | ✅ Done        | Native UITabBar (iPhone) + sidebar (iPad/Mac) · Expo Router v6 · portrait lock on iPhone                                                                |
| Auth — login           | ✅ Done        | Supabase email/password · redirects to dashboard on success · route guard in `(app)` layout redirects unauth users to `/auth/login`                      |
| Inventory list         | ✅ Done        | Infinite scroll · pull-to-refresh · 500ms debounce search · category filter · sort · live API                                                           |
| Item detail            | ✅ Done        | Item metadata + stock batch list · live API                                                                                                             |
| Scanner — camera modal | 🟡 In progress | Real barcode scan + lookup live · 4-state machine · swipeable summary sheet · quantity controls · dev-only simulate-scan button · submit flow not built |
| Inbound — receive      | ✅ Wired       | "Receive delivery" form · supplier/branch/location + line editor · live `inbound-refdata` (reads) + `receive-inbound` (write, `receive_inbound` RPC)    |
| Activities             | ✅ Done        | "Activities" tab + Dashboard "Recent activity" · live `list-movements` edge fn · accordion rows expand to item lines · action-type filter · date/type sort · infinite scroll |
| Dashboard              | 🟡 Stub        | Tab present · placeholder stat cards (show `—`) · "Recent activity" list live (10 latest movements)                                                     |
| Account                | ✅ Done        | Profile card · settings row (inert) · confirm-dialog sign-out                                                                                           |
| BE — `create-movement` | 🔴 Not started | Write endpoint for stock_movement — needed for scanner submit flow                                                                                      |
| RLS                    | 🔴 Stub only   | All policies open (`qual = true`), branch-scoping not enforced                                                                                          |

---

## Epic Documentation

Each epic has (or will have) a living doc under `docs/` describing its **current implemented logic** — not a plan or spec. Read the relevant epic doc before changing that feature, and keep it in sync when the logic changes.

| Epic      | Status         | Doc                                            |
| --------- | -------------- | ---------------------------------------------- |
| Scanner   | 🟡 In progress | [`docs/scanner-epic.md`](docs/scanner-epic.md) |
| Inbound   | ✅ Wired       | [`docs/inbound-epic.md`](docs/inbound-epic.md) |
| Activities | ✅ Done     | [`docs/activities-epic.md`](docs/activities-epic.md) |
| Inventory | ✅ Done        | [`docs/inventory-epic.md`](docs/inventory-epic.md) |
| Auth      | ✅ Done        | [`docs/auth-epic.md`](docs/auth-epic.md)       |
| Account   | ✅ Done        | [`docs/account-epic.md`](docs/account-epic.md) |
| Dashboard | 🟡 Stub        | [`docs/dashboard-epic.md`](docs/dashboard-epic.md) |

### Scanner

Barcode-scanner feature: camera modal, lookup against live inventory, scanned-items list with quantities. The doc covers the `useReducer` state machine, scan lifecycle (real + dev simulate), swipeable summary sheet, components, and what's done vs not.

→ [`docs/scanner-epic.md`](docs/scanner-epic.md)

### Inbound

Form-first "Receive delivery" flow (Story 1B): select supplier + branch + default location, add/edit/remove item lines (search, qty, lot, expiry, location), submit via the `receive_inbound` RPC. The doc covers the `useReducer` state machine, root-level routing, the mocked service layer, and done-vs-not.

→ [`docs/inbound-epic.md`](docs/inbound-epic.md)

### Activities

Read-only stock-movement history: an "Activities" tab and a Dashboard "Recent activity" preview, both backed by the `list-movements` edge function. Each movement is an accordion row that expands to show its `stock_movement_item` lines (item · lot · qty · location). The doc covers the edge function contract, the accordion animation rules, and the list screen.

→ [`docs/activities-epic.md`](docs/activities-epic.md)

### Inventory

Catalog read surface: list (infinite scroll, 500ms debounce search, category filter, sort) and item detail (metadata + per-batch stock). Backed by the `list-items` (list + barcode lookup) and `item-stock` edge functions. Read-only — no item create/edit.

→ [`docs/inventory-epic.md`](docs/inventory-epic.md)

### Auth

Email/password sign-in via Supabase Auth; session persisted (SecureStore) and reused as the Bearer token by every service. The `(app)` layout gates on a session check, redirecting unauthenticated users to `/auth/login`. The doc covers the session lifecycle and the current gap (no sign-up).

→ [`docs/auth-epic.md`](docs/auth-epic.md)

### Account

Account tab: profile card (name/email from `getUserProfile`), inert Settings row, confirm-dialog sign-out. The doc also flags the `user.ts` direct-table-read convention violation.

→ [`docs/account-epic.md`](docs/account-epic.md)

### Dashboard

Post-login landing screen: "Receive delivery" CTA, four placeholder stat cards (`—`), and a live 10-item "Recent activity" preview reusing `MovementRow`. The doc covers what's live vs stubbed.

→ [`docs/dashboard-epic.md`](docs/dashboard-epic.md)

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
- `getColor("primary")` from `@/lib/color` — for JS-level props where NativeWind can't reach

Use `getColor` for: icon `color=` props (lucide ignores `style.color`), `placeholderTextColor`, `tintColor`, Reanimated shadow colors. It is a plain lookup, not a hook — call it anywhere (conditionals, callbacks).

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

## Known Risks / Tech Debt

_Snapshot from the 2026-06-03 audit. Run the [`audit` skill](.claude/skills/audit/SKILL.md) to regenerate. Severity: 🔴 high · 🟡 medium · 🔵 low._

### Convention violations

- 🟡 `lib/services/user.ts:14` — `getUserProfile` does a direct `supabase.from("user").select(...)` table read, breaking the "always go through an edge function — never `supabase.from`/`.rpc` in the client" rule. Fix: add a `get-user-profile` edge function in `dld-spb` and call it like the other services. The result is also `data as UserProfile` with no runtime validation (`user.ts:21`).

### Security

- 🔴 **RLS is stub-only** — all policies open (`qual = true`), branch-scoping not enforced server-side. Any authenticated user can read/write across branches. Backend work in `dld-spb`; client branch params are not a security boundary.
- 🟡 **Backend error leakage** — services surface raw backend `error` / `res.statusText` straight to `Alert`/UI (`lib/services/inbound.ts`, `inventory.ts`, `movements.ts`). Edge functions should return sanitized messages (no SQL / stack / internal names).

### Hygiene

- 🔵 `lib/services/inbound.ts:79` — TODO marker for consolidating barcode resolution into a single `resolve-barcodes` edge function (backend, dld-spb).

### What's clean

NativeWind-only styling (no stray hex, no stray `StyleSheet.create`), `Pressable` everywhere, `FlatList` for dynamic lists, transform/opacity-only animations, `useReducer` discriminated-union state machines, services follow the session→URL→Bearer→throw pattern (except `user.ts`), session tokens persisted via a chunked `expo-secure-store` adapter, tests mirror `lib/` under `__tests__/`.

---

## Testing

Tests mirror `lib/` under `__tests__/`. Stack: Jest + `jest-expo` + `@testing-library/react-native`.

```
yarn test        # single run
yarn test:watch  # watch mode
```
