# dld-native — React Native App Design

**Date:** 2026-05-19  
**Status:** Approved  
**Scope:** Standalone React Native (Expo) app that replicates the dld-pwa flow. Lives at `dld/dld-native/`. Has its own git repo. Does not share any code with dld-pwa.

---

## 1. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Expo SDK 52 (managed workflow) | No native code to maintain |
| Language | TypeScript | Strict mode |
| Routing | Expo Router v4 (file-based) | Mirrors Next.js `app/` mental model |
| Styling | NativeWind v4 | Tailwind classes on native components |
| Auth + API | `@supabase/supabase-js` | Same Edge Functions as PWA |
| Session storage | `expo-secure-store` | Replaces browser cookies |
| Icons | `lucide-react-native` | Same icon set as PWA |
| Git | Own `git init` inside `dld/dld-native/` | Independent from dld-pwa |

---

## 2. Screen Map

| PWA route | Native file | Description |
|---|---|---|
| `/auth/login` | `app/auth/login.tsx` | Email/password login form |
| `/dashboard` | `app/(app)/dashboard.tsx` | Stat cards + placeholder table |
| `/inventory` | `app/(app)/inventory/index.tsx` | Search, category filter, paginated list |
| `/inventory/[id]` | `app/(app)/inventory/[id].tsx` | Item detail + stock batch list |
| `/account` | `app/(app)/account.tsx` | User profile card + sign out |

---

## 3. Navigation & Layout

The app uses a **responsive layout** that mirrors the PWA's `md:` breakpoint logic.

### Breakpoint
- **< 768pt wide (iPhone):** Bottom tab navigator — 3 tabs: Dashboard, Inventory, Account
- **≥ 768pt wide (iPad):** Persistent sidebar + content stack, no bottom tabs

### Implementation
- `app/(app)/_layout.tsx` reads `useWindowDimensions().width`
- Narrow → renders Expo Router `<Tabs>` with bottom bar
- Wide → renders `<Sidebar>` alongside a `<Stack>` for main content
- `Sidebar` component is a port of the PWA's sidebar: `Stethoscope` logo, nav items, user dropdown at bottom with sign-out

### Route layouts
```
app/
├── _layout.tsx           # Root: Supabase session init, auth guard redirect
├── auth/
│   ├── _layout.tsx       # Stack layout for auth screens
│   └── login.tsx
└── (app)/
    ├── _layout.tsx       # Responsive: Tabs (phone) or Sidebar+Stack (iPad)
    ├── dashboard.tsx
    ├── inventory/
    │   ├── index.tsx
    │   └── [id].tsx
    └── account.tsx
```

---

## 4. Project File Structure

```
dld-native/
├── app/                          # Expo Router screens
│   ├── _layout.tsx
│   ├── auth/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       ├── account.tsx
│       └── inventory/
│           ├── index.tsx
│           └── [id].tsx
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── dashboard/
│   │   └── StatCard.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx           # iPad sidebar nav
│   │   └── BottomNav.tsx         # Handled by Expo Router Tabs, minimal wrapper
│   └── ui/
│       ├── FlashMessage.tsx
│       └── Skeleton.tsx
├── lib/
│   ├── category-meta.ts          # Copied from PWA (icon refs updated to lucide-react-native)
│   ├── types.ts                  # Copied verbatim from PWA
│   ├── utils.ts
│   ├── supabase/
│   │   └── client.ts             # RN Supabase client with SecureStore session adapter
│   └── services/
│       ├── auth.ts               # signInWithEmail, signOut
│       ├── inventory.ts          # listItems, getItemStock (same Edge Function URLs)
│       └── user.ts               # getUserProfile
├── .env                          # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
├── .env.example
├── .gitignore
├── app.json
├── tailwind.config.js
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## 5. Key Differences from PWA

| Concern | PWA | dld-native |
|---|---|---|
| Tables | HTML `<table>` | `FlatList` with row components |
| Auth session | Browser cookies (Supabase SSR) | `expo-secure-store` adapter |
| Env prefix | `NEXT_PUBLIC_` | `EXPO_PUBLIC_` |
| Data fetching | Server Components + `"use client"` | All client-side (same as PWA's client pages) |
| Sidebar | Desktop only (`md:` breakpoint) | iPad only (≥ 768pt via `useWindowDimensions`) |
| Navigation links | `next/link` | `expo-router` `Link` / `router.push()` |
| Icon import | `lucide-react` | `lucide-react-native` |
| Skeleton loading | `@/components/ui/skeleton.tsx` | Custom `Skeleton.tsx` using `Animated` or `expo-linear-gradient` |

---

## 6. Data Layer

All API calls are identical to the PWA — same two Supabase Edge Functions:

- `GET /functions/v1/list-items` — paginated, sortable, searchable inventory list
- `GET /functions/v1/item-stock?item_id=<id>` — item detail + stock batches

Auth token is retrieved from the Supabase client session and passed as `Authorization: Bearer <token>` header, same as the PWA.

`lib/supabase/client.ts` uses `LargeSecureStore` pattern (Supabase-recommended for RN) to persist the session across app restarts via `expo-secure-store`.

---

## 7. Feature Parity Checklist

- [x] Email/password login
- [x] Auth guard (redirect to login if no session)
- [x] Dashboard with 4 stat cards (Total Items, In Stock, Low Stock, Expiring Soon)
- [x] Inventory list with search, category filter, sort, pagination
- [x] Inventory detail with item meta grid + stock batch list
- [x] Expiry warnings (expiring soon / expired) on stock batches
- [x] Controlled drug + cold chain badges on item detail
- [x] Account screen with profile card + sign out
- [x] Category icons + colour coding (CATEGORY_META)
- [x] Responsive layout: bottom tabs (phone), sidebar (iPad)

---

## 8. Out of Scope (for this iteration)

- Push notifications
- Barcode scanning
- Offline mode
- Stock movement creation (write operations)
- Settings screen (stub link only, same as PWA)
