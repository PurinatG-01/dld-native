# Inbound Epic — dld-native

> Living documentation for the inbound "Receive delivery" form (Story 1B). Describes **current implemented logic**, not a plan or spec.
> Parent context: [`AGENTS.md`](../AGENTS.md). Original design notes live in Notion (Dental Logistics → Tech → 🧩 EPIC — Inbound Scanner / Form Flow) and in git history.
>
> Status: ✅ Wired — RN form runs against the live `receive_inbound` RPC and reads suppliers/branches/locations directly from the DB. Tracking-class gating + scanner pre-fill still deferred.
> Last updated: 2 Jun 2026.

---

## Purpose

Form-first inbound flow: clinic staff record an incoming delivery by selecting a supplier + destination branch + default location, then adding one or more item lines (search item, quantity, lot, expiry, location). Submit assembles a payload for the `receive_inbound` RPC. Manual entry is the only path in this cut — the barcode scanner (separate epic) is an optional future accelerator, not part of 1B.

## File map

| File | Role |
| --- | --- |
| `app/inbound.tsx` | Screen + orchestration. Owns the reducer, fetches ref-data, manages the line-editor modal and submit flow. **Root-level** route (not in the `(app)` NativeTabs group — native tabs only route to declared triggers). |
| `app/_layout.tsx` | Registers `inbound` in the root Stack: `headerShown: true`, title "Receive delivery", minimal back button. |
| `lib/inbound-reducer.ts` | `inboundReducer`, `initialInboundState`, `makeLineKey`, plus derived `isLineValid` / `canSubmit`. |
| `lib/services/inbound.ts` | Live service, **edge-function calls only**: `getInboundRefData(branchId?)` → `inbound-refdata` (suppliers + branches + locations + caller branch); `receiveInbound(payload)` → `receive-inbound` (POST). No direct `supabase.rpc` / `from` from the client. |
| `components/inbound/types.ts` | `InboundLine`, `InboundState`, `InboundAction`. |
| `components/inbound/SessionHeader.tsx` | Supplier / branch / default-location pickers. |
| `components/inbound/SessionHeaderSkeleton.tsx` | Loading placeholder shown until the first `inbound-refdata` load resolves. |
| `components/inbound/ItemSearchField.tsx` | Debounced (500 ms) item search reusing live `listItems({ search, limit: 8 })`; renders results via `.map()` (≤8, avoids nesting a `FlatList` in the editor `ScrollView`). |
| `components/inbound/LineEditor.tsx` | Page-sheet modal to add/edit a line: item search, qty stepper, location, optional lot + expiry. |
| `components/inbound/LineRow.tsx` | One line summary; tap to edit, trash to remove. `React.memo`. |
| `components/inbound/LineList.tsx` | `FlatList` of lines + running-summary header (`N lines · M units`) + empty state. |
| `components/ui/Select.tsx` | Generic modal picker (label, options, value) used by the header + line editor. |

## Navigation

- `inbound` is a **root** screen (`app/inbound.tsx`), reached via `router.push("/inbound")`. Entry point: "Receive delivery" CTA on the Dashboard (`app/(app)/dashboard.tsx`).
- It is deliberately **outside** the `(app)` NativeTabs group: native tabs only navigate to declared `Trigger`s, so a non-tab child inside the group is unreachable.
- The root Stack supplies the header + back button (`headerBackButtonDisplayMode: "minimal"`, `headerBackTitle: ""`).

## State machine

`useReducer` with a discriminated-union state (`components/inbound/types.ts`), reducer in `lib/inbound-reducer.ts` (separated for unit testing). Follows the project convention (see scanner epic): invalid transitions return state unchanged.

- **`SET_BRANCH`** clears `defaultLocationId` and every line's `location_id` — locations are branch-scoped, so a branch switch invalidates them.
- New lines pre-fill `location_id` from `defaultLocationId` (set in `LineEditor` when `editing === null`).
- **`SUBMIT_START`** is ignored while `submit === "submitting"` — the reducer itself is the double-submit guard.
- `SUBMIT_ERROR` keeps all lines intact for retry; `RESET` returns to `initialInboundState`.

Derived selectors (not stored): `isLineValid` (item + positive-integer qty + location) and `canSubmit` (not submitting, supplier + branch set, ≥1 line, all lines valid).

## Submit flow

`app/inbound.tsx` → guard on `canSubmit` → `SUBMIT_START` → `receiveInbound(payload)`.
- Success → `Alert` confirmation → `RESET` + `router.back()`.
- Error → `SUBMIT_ERROR(message)` → `FlashMessage` shown above the action buttons; lines preserved.

### Backend path

Client → edge function → RPC. The RN service never touches the DB directly.

- `inbound-refdata` (GET, `?branch_id=` optional) — returns `{ suppliers, branches, locations, branch_id }`; `branch_id` is the caller's own branch, `locations` are for the requested branch (defaults to caller's).
- `receive-inbound` (POST) — validates the body, then calls the RPC below with the forwarded caller JWT.

Both edge functions live in the `dld-spb` repo (`supabase/functions/{inbound-refdata,receive-inbound}/index.ts`) and follow the `list-items` pattern (CORS, JWT-forwarding client, branch resolve).

### RPC contract (called from the edge function)

`receive_inbound(p_supplier_id uuid, p_branch_id uuid, p_location_id uuid, p_lines jsonb) → uuid` (the new `inbound_session.id`). One transaction; `SECURITY DEFINER`.

- `p_location_id` is the **session-level** receiving location (`inbound_session.location_id`) — required, must belong to `p_branch_id`.
- `p_lines` = `[{ item_id, quantity, lot_number?, expiry_date?, location_id? }]`. Per-line `location_id` is optional and **defaults to `p_location_id`** in the RPC.
- Server enforces: caller authenticated; **`p_branch_id` must equal the caller's own branch** (cross-branch denied); supplier exists (when non-null); locations in branch; items exist; quantity a positive integer; non-empty lines.
- Writes one `inbound_session` + one `stock_movement` (INBOUND) header + per line an `item_stock` and a `stock_movement_item`.

Client payload mirrors this: `{ supplier_id, branch_id, location_id, lines: [{ item_id, quantity, lot_number, expiry_date, location_id }] }`. All persistence is the single RPC call — no direct multi-table writes. On mount the screen pre-selects the caller's branch via `getCurrentBranchId()` so submits land in the allowed branch.

## Tracking class (lot/expiry)

Open decision unresolved (Notion EPIC). First cut: **lot and expiry are always shown and always optional** on every line. Expiry is a `YYYY-MM-DD` text input (validated by regex) — no native date-picker dependency was added.

## Done vs not

- ✅ Form UI, validation, line add/edit/remove, running summary, submit + error handling, double-submit guard.
- ✅ Reducer unit tests: `__tests__/inbound-reducer.test.ts`.
- ✅ Ref-data reads + write wired through edge functions (`inbound-refdata`, `receive-inbound`), which call `receive_inbound`. (Live DB ids are **`uuid`** — the EPIC contract's `bigint` note was stale.)
- 🔴 Tracking-class gating, scanner pre-fill (Story 2), GS1 parse / GTIN resolution / inline new-item (Stories 3–5).
- 🔴 End-to-end submit not yet verified against a real signed-in session.
