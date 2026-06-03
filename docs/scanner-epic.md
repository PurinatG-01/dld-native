# Scanner Epic — dld-native

> Living documentation for the barcode-scanner feature. Describes **current implemented logic**, not a plan or spec.
> Parent context: [`AGENTS.md`](../AGENTS.md). Original design notes for this feature live in Notion (Dental Logistics → Tech) and in git history.
>
> Status: 🟡 In progress — two modes. **Default mode** (search tab): live lookup, standalone submit not built (blocked on `create-movement`). **Inbound batch mode** (`?mode=inbound`): raw multi-scan → commit → batch-resolve → hands lines to the inbound form (Story 2). Tap-to-focus unsupported (no expo-camera 17 API); torch + autofocus only.
> Last updated: 3 Jun 2026.

---

## Purpose

Let clinic staff point the phone camera at an item barcode, look it up against live inventory, and build a list of scanned items with quantities. The list is intended to feed a stock-movement write once the backend endpoint exists.

## File map

| File | Role |
| --- | --- |
| `app/scanner-modal.tsx` | Screen + orchestration. Owns state machine, camera, scanned-items list, permission gate. |
| `app/(app)/scanner.tsx` | Placeholder route for the `search`-role tab (never rendered; tab opens the modal instead). |
| `lib/scanner-state.ts` | Module-level flag (`markModalOpened/Closed/consumeModalOpened`) coordinating modal open/close with routing. |
| `lib/services/inventory.ts` | `lookupItemByBarcode(barcode)` — reuses `list-items?barcode=&limit=1`. |
| `components/scanner/types.ts` | `ScanStatus`, `ScanState`, `ScanAction`, `ScannedItem`. |
| `components/scanner/constants.ts` | Layout constants: `SHEET_TOP`, `SNAP_COLLAPSED/EXPANDED`, `FINDER_SIZE`, corner sizes, `HAIRLINE_WIDTH`. |
| `components/scanner/ScannerStatusPill.tsx` | Floating status pill (Scanning… / ✓ Added / ✕ Not found). |
| `components/scanner/ScannerSheet.tsx` | Swipeable bottom sheet container + pan/snap gesture. |
| `components/scanner/ScannedItemList.tsx` | `FlatList` of scanned items, loading skeleton row, empty state. |
| `components/scanner/ScannedItemRow.tsx` | Single row: icon, name, barcode, +/- quantity stepper. |

## Modes

The modal serves two flows, branched on the `mode` route param (`useLocalSearchParams`):

- **default** (no param) — opened from the `search`-role tab. Each scan calls
  `lookupItemByBarcode` live, builds the scanned-items list, and `handleClose` dismisses to the
  dashboard. Standalone submit still not built (`create-movement` blocker).
- **`mode="inbound"`** — pushed from the inbound screen (`router.push("/scanner-modal?mode=inbound")`).
  Scans are recorded **raw** (`{ barcode, quantity }`, **no per-scan lookup**); rows show the
  barcode (`rawMode`). A **Commit** button (`ScannerSheet`, shown when `onCommit` is set) moves the
  screen to a full-screen **resolving** state (`committing`), calls `resolveScannedBarcodes`
  (`lib/services/inbound.ts`, currently mocked), maps each scan → an `InboundLine`
  (`status: "ready"` if resolved, else `"error"`), stashes the batch via
  `setScanBatchResult` (`lib/scanner-state.ts`), and `router.back()`s to the inbound form.

Both modes share: `barcodeScannerSettings={{ barcodeTypes: [datamatrix, code128, ean13, upc_a,
upc_e] }}`, a **torch toggle** (`enableTorch`), and a ~150ms collect window that prefers a 2D
(GS1 DataMatrix) read over a linear one in the same frame.

## Navigation / modal lifecycle

- Scanner tab declared in `app/(app)/_layout.tsx` with `role="search"`. This opens `app/scanner-modal.tsx` as a **root modal** rather than navigating to `scanner.tsx`.
- `lib/scanner-state.ts` holds a module-level `_modalOpened` flag so routing logic can coordinate open/close.
- **Always call `markModalClosed()` before dismissing.** `handleClose` does this, then `router.dismissTo("/(app)/dashboard")`.
- On mount the modal calls `requestPermission()`. If permission is missing/denied it renders a full-screen message with a close button instead of the camera.

## State machine

`useReducer` with a discriminated-union state (`components/scanner/types.ts`). Reducer in `scanner-modal.tsx`.

```
states:  idle → loading → success → (auto) idle
                        ↘ error   → (auto) idle

actions: SCAN_START | SCAN_SUCCESS | SCAN_ERROR | SCAN_RESET
```

Rules:
- `SCAN_START` accepted only from `idle`. `SCAN_SUCCESS`/`SCAN_ERROR` accepted only from `loading`. Invalid transitions **return state unchanged**.
- While not `idle`, new scans are ignored — the reducer is its own debounce guard (no separate timer needed for that).
- Auto-reset timers: `success` → `idle` after **1000ms**, `error` → `idle` after **1500ms** (cleared on unmount/transition).

## Scan lifecycle (real camera)

`handleBarcodeScanned({ data })` in `scanner-modal.tsx`:

1. Bail if `scanState.status !== "idle"`.
2. `dispatch(SCAN_START, barcode=data)` → `loading`.
3. `lookupItemByBarcode(data)`:
   - `null` result → `dispatch(SCAN_ERROR)`.
   - hit → update `scannedItems`: if barcode already present, **increment its quantity**; else **prepend** a new `ScannedItem`. Then `dispatch(SCAN_SUCCESS)`.
   - thrown error → `dispatch(SCAN_ERROR)`.

`lookupItemByBarcode` (`lib/services/inventory.ts`): gets session → `GET list-items?barcode=<x>&limit=1` with Bearer → returns `data[0] ?? null`. Non-OK response returns `null` (treated as not-found).

## Simulate scan (dev only)

- Rendered only under `__DEV__`. Button below the viewfinder.
- Cycles a fixed `MOCK_SCAN_ITEMS` array via `mockIndexRef` (mod length).
- Mirrors the real flow but resolves through a `setTimeout(600ms)` instead of a network call, then dispatches `SCAN_SUCCESS`. Same dedupe/increment logic.
- Disabled while `scanState.status !== "idle"`.

## Data model

```ts
type ScannedItem = {
  id: string;        // `${Date.now()}-${Math.random()}`
  barcode: string;   // dedupe key
  name: string;      // from inventory lookup
  quantity: number;  // adjustable; row removed when it hits 0
  scannedAt: Date;
};
```

`scannedItems` is local `useState` in `scanner-modal.tsx` (newest first). `adjustQuantity(id, delta)` clamps at 0 and **filters out** rows that reach 0.

## UI structure

Full-screen `CameraView` (back camera, `onBarcodeScanned`), overlaid with:

1. **Dim overlay + viewfinder** — black/60 mask cutting a `FINDER_SIZE` (200pt) window with four corner brackets. Bracket color is driven by status (`finderColorMap`): white when idle/success, `primary-light` while loading, `error-foreground` on error.
2. **Sweep line** — only during `loading`. A Reanimated line repeats a `translateY` 0→`FINDER_SIZE` with opacity fade in/out. Animates **transform + opacity only** (per perf rules).
3. **Hint text** — "Looking up item…" while loading, else "Align barcode within the frame".
4. **Simulate-scan button** — `__DEV__` only (see above).
5. **Close button** — top-right, calls `handleClose`.
6. **`ScannerStatusPill`** — floating pill above the sheet, fades in/out (150ms). Shows Scanning… (spinner) / ✓ Added / ✕ Not found by status. `pointerEvents="none"`.
7. **`ScannerSheet`** — swipeable summary sheet (below).

## Bottom sheet (`ScannerSheet`)

- Snap points: `SNAP_COLLAPSED = SHEET_TOP = SCREEN_HEIGHT * 0.5` and `SNAP_EXPANDED = 0`.
- `Gesture.Pan()` updates `translateY`, clamped to `[SNAP_EXPANDED, SNAP_COLLAPSED]`.
- On release: expand if `velocityY < -500` **or** `translateY < SNAP_COLLAPSED / 2`; otherwise collapse. Settles with `withSpring` (damping 20, stiffness 200, overshoot-clamped).
- Animated style applies `translateY` only.
- Header shows "Scanned Items (n)". Body is `ScannedItemList`.

## Scanned item list & row

- `ScannedItemList` is a `FlatList` keyed by `item.id`, rows wrapped in `memo`.
  - `ListHeaderComponent`: a skeleton row while `loading`.
  - `ListEmptyComponent`: "No items scanned yet" when not loading.
  - `isJustAdded` = `scanStatus === "success" && item.barcode === justAddedBarcode` — highlights the row just added.
- `ScannedItemRow`: package icon, name, mono barcode, and a − / qty / + stepper calling `onDecrement`/`onIncrement`. Just-added rows get a left success border + tint.

## Performance notes

- Callbacks (`handleBarcodeScanned`, `handleSimulateScan`, `adjustQuantity`, `handleClose`) are `useCallback`-stabilised; list rows are memoised and receive stable handlers.
- All animated styles return from `useAnimatedStyle`; only `transform`/`opacity` are animated.

## Done vs not done

| | |
| --- | --- |
| ✅ Done | Permission gate · live camera scan · barcode lookup · dedupe/increment · 4-state machine · status pill · animated viewfinder + sweep · swipeable sheet · quantity steppers · dev simulate button · multi-format barcode config · torch toggle · GS1/2D collect-window preference · **inbound batch mode** (raw multi-scan → commit → batch-resolve → hand lines to the inbound form) |
| 🔴 Not done | **Default-mode submit flow** (write scanned items as a stock movement, blocked on `create-movement`) · GS1 lot/expiry parse (Story 3) · tap-to-focus (no expo-camera 17 API) · haptics |

## Next steps

1. Backend `create-movement` edge function (the blocker).
2. Add a submit action to the sheet → POST scanned items (type, quantities, location) via a new `lib/services` call.
3. Post-submit confirmation + clear list + dismiss.
4. Decide movement context (INBOUND vs WITHDRAWN) — see `MovementType` in `lib/types.ts`.

---

*Update this file when scanner logic changes. Flip the status line and the Done/Not-done table.*
