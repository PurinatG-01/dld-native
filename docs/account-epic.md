# Account Epic — dld-native

> Living documentation for the Account tab. Describes **current implemented logic**, not a plan or spec.
> Parent context: [`AGENTS.md`](../AGENTS.md). Original design notes live in Notion (Dental Logistics → Tech) and in git history.
>
> Status: ✅ Done — profile card + sign-out wired; settings row is intentionally inert.
> Last updated: 3 Jun 2026.

---

## Purpose

The user's account surface: show who is signed in (name + email) and let them sign out. A placeholder "Settings" row is present but does nothing yet.

## File map

| File | Role |
| --- | --- |
| `app/(app)/account.tsx` | The whole screen: profile card, "General" section with an inert Settings row, and a destructive Sign-out button. |
| `lib/services/user.ts` | `getUserProfile(userId)` → returns `UserProfile` (`id, name, email, role_id, branch_id`) or `null`. |
| `lib/services/auth.ts` | `signOut()` (see [Auth epic](auth-epic.md)). |
| `app/(app)/_layout.tsx` | Registers the Account NativeTab. |

## Logic

- On mount: `supabase.auth.getSession()` → set `email` from `session.user.email`, then `getUserProfile(session.user.id)` → `profile`. Display name/email fall back through `profile?.name ?? email ?? "User"`.
- **Sign out**: `handleSignOut` opens a confirm `Alert` (Cancel / destructive "Sign out"); on confirm → `await signOut()` → `router.replace("/auth/login")`.
- Styling is NativeWind-only; `getColor` for icon colors. Row press feedback `active:bg-muted/50`, button `active:opacity-70` per the project rules. Content is short and static, so a `ScrollView` (not `FlatList`) is correct here.

## Done vs not

- ✅ Profile card (name/email), sign-out with confirm dialog.
- 🔴 Settings row is inert (no navigation / preferences screen). No avatar upload, no profile editing, no role display.
- 🟡 **Convention violation:** `getUserProfile` in `lib/services/user.ts` reads the table directly via `supabase.from("user")`, which breaks the "always go through an edge function — never `supabase.from`/`.rpc` in the client" rule. Needs a `get-user-profile` edge function in `dld-spb`. The result is also cast `data as UserProfile` with no runtime validation. See [`AGENTS.md`](../AGENTS.md) Known Risks.
