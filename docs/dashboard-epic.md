# Dashboard Epic — dld-native

> Living documentation for the Dashboard tab. Describes **current implemented logic**, not a plan or spec.
> Parent context: [`AGENTS.md`](../AGENTS.md). Original design notes live in Notion (Dental Logistics → Tech) and in git history.
>
> Status: 🟡 Stub — layout + a live "Recent activity" preview are real; the stat cards are placeholders.
> Last updated: 3 Jun 2026.

---

## Purpose

The landing screen after login. Gives an at-a-glance overview: a "Receive delivery" call-to-action, four headline stat cards, and the 10 most-recent stock movements. Today only the recent-activity list is live; the stat cards show `—`.

## File map

| File | Role |
| --- | --- |
| `app/(app)/dashboard.tsx` | The screen: header, "Receive delivery" CTA → `/inbound`, horizontal `StatCard` row, "Recent activity" list. |
| `components/dashboard/StatCard.tsx` | Presentational stat card (label, value, icon, bg/icon color). |
| `components/activities/MovementRow.tsx` | Shared accordion row reused for the recent-activity list (see [Activities epic](activities-epic.md)). |
| `lib/services/movements.ts` | `listMovements(...)` — the recent list is `page 1, limit 10, sort created_at desc`. |
| `app/(app)/_layout.tsx` | Registers the Dashboard NativeTab; `app/index.tsx` redirects here on entry. |

## Logic

- **Recent activity** (live): one `useEffect` on mount calls `listMovements({ page: 1, limit: RECENT_LIMIT=10, sort_by: "created_at", sort_dir: "desc" })`. Uses an `active` cleanup flag to avoid setting state after unmount. States: skeleton rows while loading, error text on failure, the shared `MovementRow` per movement, or an empty state. "View all" → Activities tab.
- **Stat cards** (placeholder): four `StatCard`s (Total Items / In Stock / Low Stock / Expiring Soon) currently render `value="—"`. Laid out in a horizontal `ScrollView` (short static set).
- **CTA**: "Receive delivery" `Pressable` → `router.push("/inbound")` (the root-level inbound modal — see [Inbound epic](inbound-epic.md)).
- Styling NativeWind-only; `getColor` for icon colors. Recent rows are a small `.map()` under the page `ScrollView`, not the primary dynamic list.

## Done vs not

- ✅ Layout, "Receive delivery" CTA, live 10-item recent-activity preview reusing `MovementRow`, loading/error/empty states.
- 🔴 Stat cards not wired — no aggregate endpoint yet (Total Items / In Stock / Low Stock / Expiring Soon all show `—`). No charts, no date range, no per-card drill-in. No RLS branch enforcement (project-wide — see [`AGENTS.md`](../AGENTS.md) Known Risks).
