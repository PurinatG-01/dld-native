# Inventory Epic — dld-native

> Living documentation for the inventory list + item detail screens. Describes **current implemented logic**, not a plan or spec.
> Parent context: [`AGENTS.md`](../AGENTS.md). Original design notes live in Notion (Dental Logistics → Tech) and in git history.
>
> Status: ✅ Done — both screens run against live edge functions (`list-items`, `item-stock`).
> Last updated: 3 Jun 2026.

---

## Purpose

Read surface for the catalog. Staff browse the branch's items (name, category, unit, on-hand total, reorder flag), search/filter/sort the list, and drill into an item to see its full metadata and per-batch stock (lot, expiry, location, quantity, status). No write path here — stock is created by the inbound/scanner flows.

## File map

| File | Role |
| --- | --- |
| `dld-spb/supabase/functions/list-items/index.ts` | **Edge function** (sibling repo). Branch-scoped, paginated, searchable, filterable, sortable item list with computed `total_quantity`. Also serves barcode lookup via `?barcode`. |
| `dld-spb/supabase/functions/item-stock/index.ts` | **Edge function** (sibling repo). Returns one item's full metadata + its `item_stock` batch records for the branch. |
| `lib/services/inventory.ts` | Service, **edge-function calls only**. `listItems({ page, limit, search, category, branch_id, sort_by, sort_dir })` → `list-items`; `lookupItemByBarcode(barcode)` → `list-items?barcode=…&limit=1`; `getItemStock(itemId)` → `item-stock`. Exports all `InventoryItem` / `ItemDetail` / `ItemStockRecord` / meta types. |
| `lib/category-meta.ts` | `CATEGORY_META`: per-category `{ icon, bg, iconColorToken }` (tokens only — no hex). Keys are the human category names (e.g. "PPE & Infection Control"). Drives both the filter chips and row/detail icons. |
| `lib/utils.ts` | `formatDate`, `isExpiringSoon` — used by the detail batch rows. |
| `app/(app)/inventory/index.tsx` | **List screen**: `FlatList` infinite scroll + pull-to-refresh + 500ms debounced search + category filter chips + sort toggles. |
| `app/(app)/inventory/[id].tsx` | **Detail screen**: item header card, metadata grid, stock-batch list. |
| `app/(app)/inventory/_layout.tsx` | Stack layout for the two screens. |

## Edge functions

- **`list-items`** — `{ data, meta }` envelope. `meta`: `{ total, page, limit, total_pages, sort_by, sort_dir }`. `limit` clamped server-side. Sort whitelist mirrors `SortBy`: `name` (default `asc`), `category`, `unit_of_measure`, `reorder_point`, `created_at`. Each `InventoryItem` carries a computed `total_quantity` (sum of on-hand across the branch). Barcode lookup is the same function with `?barcode=…&limit=1`; the service returns `data[0] ?? null`.
- **`item-stock`** — `{ item, stocks }`. `item` is the full `ItemDetail` (SKU, GTIN, controlled-drug / refrigeration / serialized flags, reorder/par/max levels); `stocks` is the `ItemStockRecord[]` for the branch (lot/serial, expiry, location name, qty, status).

Both follow the project service pattern: `supabase.auth.getSession()` → throw if no session → build `/functions/v1/<fn>` URL → `fetch` with `Bearer` → throw on `!res.ok` (`list-items`/`item-stock`) or return `null` (barcode lookup). Branch scope is resolved server-side from the caller's JWT (overridable via `?branch_id`).

## List screen (`index.tsx`)

- `PAGE_SIZE = 20`. State: `items`, `page`, `hasMore`, `searchInput` (raw) → `query` (debounced), `category`, `sortBy`/`sortDir`, plus `loading` / `loadingMore` / `refreshing` / `error`.
- **Debounce**: `useEffect` copies `searchInput` → `query` after `SEARCH_DEBOUNCE_MS = 500`; clears the timer on change. Search auto-fires — no button.
- **Reset-on-change**: a `useEffect` keyed on `[query, category, sortBy, sortDir]` clears the list and reloads page 1. `handleLoadMore` appends the next page (guarded by `loadingMore || loading || !hasMore || refreshing`); `handleRefresh` reloads page 1. `hasMore = meta.page < meta.total_pages`.
- **Sort**: tapping the active column flips `sortDir`; tapping a new column sets it and resets to `asc`.
- **Rows**: `InventoryRow` is `React.memo`, takes primitive props, hoists `onPress` via `useCallback`. Low-stock (`total_quantity <= reorder_point`) renders the qty in `text-destructive`.
- **Helpers** (`CategoryIcon`, `SkeletonRow`, `SortIndicator`, `InventoryRow`) are all module-level, per the no-nested-components rule.

## Detail screen (`[id].tsx`)

- Reads `id` from `useLocalSearchParams`, fetches `getItemStock(id)` once on mount → `{ item, stocks }`. `loading` shows `DetailSkeleton`; `error` shows the message; success renders the card.
- **Header card**: category icon (falls back to a generic `Package` tile when the category isn't in `CATEGORY_META`), name, controlled-drug / cold-chain badges, generic name, and a computed `totalQty` (sum of `quantity_on_hand`). Metadata grid via the module-level `MetaField`.
- **Stock batches**: `StockRow` per `ItemStockRecord`, colored by `STATUS_STYLES` map; expiry styled by `isExpiringSoon` / past-date. Rendered with `.map()` (small nested static list under the primary scroll, not the main dynamic list).

## Done vs not

- ✅ List (search/filter/sort/paginate/refresh), detail (metadata + batches), barcode lookup service, live edge functions, service unit tests (`__tests__/services/inventory.test.ts`).
- 🔴 No item create/edit/delete UI (read-only), no per-batch actions, no date-range filter, no RLS branch enforcement (project-wide RLS is still stub/open — see [`AGENTS.md`](../AGENTS.md) Known Risks).
