# Auth Epic — dld-native

> Living documentation for sign-in / sign-out and the Supabase session. Describes **current implemented logic**, not a plan or spec.
> Parent context: [`AGENTS.md`](../AGENTS.md). Original design notes live in Notion (Dental Logistics → Tech) and in git history.
>
> Status: ✅ Done — login + sign-out wired, route guard in the `(app)` layout.
> Last updated: 3 Jun 2026.

---

## Purpose

Email/password authentication via Supabase Auth. A successful sign-in establishes a session that every service call reuses (Bearer token forwarded to edge functions); sign-out clears it. The session is the single source of `auth.uid()` / branch resolution server-side.

## File map

| File | Role |
| --- | --- |
| `lib/supabase/client.ts` | Single Supabase client. `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key only). `auth`: `storage: SecureStoreAdapter` (chunked `expo-secure-store`), `autoRefreshToken`, `persistSession`, `detectSessionInUrl: false`. The **only** place the JS client is used beyond `supabase.auth.*`. |
| `lib/services/auth.ts` | Service. `signInWithEmail(email, password)` → `supabase.auth.signInWithPassword`, returns a `SignInResult` discriminated union (`{ success: true } \| { success: false, error }`). `signOut()` → `supabase.auth.signOut()`. |
| `components/auth/LoginForm.tsx` | The form: email + password inputs, loading state, inline `FlashMessage` on error. On success `router.replace("/(app)/dashboard")`. Styling is NativeWind-only; `getColor` for `placeholderTextColor` / icon / spinner. |
| `app/auth/login.tsx` | Thin screen that renders `<LoginForm />`. |
| `app/auth/_layout.tsx` | Stack, `headerShown: false`. |
| `app/index.tsx` | Root entry — `<Redirect href="/(app)/dashboard" />`. |
| `app/(app)/account.tsx` | Sign-out entry point: confirm `Alert` → `signOut()` → `router.replace("/auth/login")`. Reads `supabase.auth.getSession()` for the current email. |

## Session lifecycle

1. **Sign in** — `LoginForm.handleLogin` guards empty fields, calls `signInWithEmail`. On `{ success: false }` it surfaces `error` via `FlashMessage`; on success it `router.replace`s to the dashboard.
2. **Persistence** — `persistSession: true` + the `SecureStoreAdapter` (chunked `expo-secure-store`) keep the session across launches in the OS keychain/keystore; `autoRefreshToken` refreshes the access token in the background.
3. **Consumption** — every service (`inventory`, `movements`, `inbound`, `user`) starts with `supabase.auth.getSession()` and throws `"Not authenticated"` if there's no session, otherwise forwards `Bearer ${session.access_token}` to the edge function.
4. **Sign out** — from Account: confirm dialog → `signOut()` clears the session → redirect to `/auth/login`.

## Done vs not

- ✅ Email/password login, error surfacing, persisted session, background refresh, sign-out, service unit tests (`__tests__/services/auth.test.ts`, `__tests__/supabase/client.test.ts`).
- ✅ **Route guard / session gate.** The `(app)` layout calls `supabase.auth.getSession()` (and subscribes to `onAuthStateChange`); while resolving it renders a loader, and with no session it `<Redirect>`s to `/auth/login`. `app/index.tsx` still points at `/(app)/dashboard`, but the layout intercepts unauthenticated users before any service call runs.
- 🔴 No sign-up / password-reset / OTP flows (`auth.ts` has no `signUp`).
