# Activities Epic — dld-native

> Living documentation for the stock-movement activity history. Describes **current implemented logic**, not a plan or spec.
> Parent context: [`AGENTS.md`](../AGENTS.md). Original design notes live in Notion (Dental Logistics → Tech) and in git history.
>
> Status: ✅ Wired — read-only history runs against the live `list-movements` edge function. Two surfaces: an "Activities" tab and a Dashboard "Recent activity" preview.
> Last updated: 2 Jun 2026.

---

## Purpose

Read surface for `stock_movement` + `stock_movement_item`. Clinic staff can see what stock movements happened (INBOUND / USE / DISCARD / TRANSFER / ADJUST), when, by whom, and — by expanding a row — the exact item lines (item, lot, quantity, location) each movement touched. No write path here; movements are created by the inbound/scanner flows.

## File map

| File | Role |
| --- | --- |
| `dld-spb/supabase/functions/list-movements/index.ts` | **Edge function** (sibling repo). Branch-scoped, paginated, sortable, filterable list of movements with embedded item lines, flattened to a table-friendly shape. Mirrors `list-items`. |
| `lib/services/movements.ts` | Service, **edge-function call only**: `listMovements({ page, limit, action_type, sort_by, sort_dir })` → `list-movements`. Exports all `StockMovement` / `StockMovementLine` / `ActionType` types. |
| `components/activities/constants.ts` | `ACTION_META` (per-action label/icon/bg/colorToken, tokens only — no hex), `ACTION_TYPES` (filter-chip order), `formatMovementDate`. |
| `components/activities/types.ts` | Re-exports service types + `MovementRowProps`. |
| `components/activities/MovementRow.tsx` | `React.memo` accordion row: header (action badge, date, actor, item count, chevron); tap toggles a body that `.map()`s the item lines. |
| `app/(app)/activities.tsx` | **Activities tab** screen. `FlatList` infinite scroll + pull-to-refresh + action-type filter chips + Date/Type sort, mirroring the Inventory list. |
| `app/(app)/dashboard.tsx` | **Recent activity** section: 10 newest movements via the shared `MovementRow`, "View all" → Activities tab. |
| `app/(app)/_layout.tsx` | Registers the `activities` NativeTab (title "Activities", SF symbol `list.bullet.rectangle`). |

## Edge function — `list-movements`

Follows the `list-items` contract exactly: CORS, `Authorization` check, RLS-forwarding client, `auth.getUser`, branch resolved from `user.branch_id` (overridable via `?branch_id`), `page`/`limit` clamp (limit ≤ 100), whitelisted sort, `count: "exact"`, `{ data, meta }` envelope.

- **Branch scope** is a direct `.eq("branch_id", branchId)` — `stock_movement` carries `branch_id`, so no location join is needed (unlike `list-items`).
- **Single nested select** embeds `actor:user!stock_movement_actor_user_id_fkey(name)` and `items:stock_movement_item(… item_stock(lot_number, location:branch_location(name), item(name, unit_of_measure)))`, then **flattens** each line to `{ id, quantity, note, item_name, unit_of_measure, lot_number, location_name }` so the client never parses deep nesting.
- **Sort** whitelist: `created_at` (default, `desc`) and `action_type`. **Filter**: `action_type`, whitelisted against the enum.

`meta`: `{ total, page, limit, total_pages, sort_by, sort_dir }`.

## Accordion (`MovementRow`)

- Local `useState` `expanded`; the header `Pressable` toggles it. Each row owns its own state — FlatList rows map 1:1 to `keyExtractor` ids.
- **Animation honors the project rule** (transform/opacity only): chevron rotates via `useAnimatedStyle` returning `transform: [{ rotate }]` driven by a `useSharedValue` + `withTiming`. The body uses Reanimated layout animations (`FadeIn`/`FadeOut`) — **no height animation**.
- The body `.map()`s item lines (small nested static content, not the primary scrolling list) and appends the movement `note` if present. No falsy `&&` in JSX.

## List screen (`activities.tsx`)

Cloned from `app/(app)/inventory/index.tsx`: `PAGE_SIZE = 10`, page-1 reset on filter/sort change, `onEndReached` paging guard (`loadingMore || loading || !hasMore || refreshing`), `RefreshControl`, skeleton rows while loading, empty state. Filter chips: `["All", …ACTION_TYPES]`. Sort toggles: Date (defaults `desc`) and Type (defaults `asc`).

## Done vs not

- ✅ Edge function deployed (project `dld`, `verify_jwt: true`), service, accordion component, Activities tab, Dashboard preview, service unit tests (`__tests__/services/movements.test.ts`).
- 🔴 No date-range filter, no search, no per-movement detail route, no RLS branch enforcement (project-wide RLS is still stub/open).
