# Simulate Scan — Design Spec

**Date:** 2026-05-23
**Status:** Approved

---

## Goal

Add a dev-only "Simulate scan" button to the scanner modal that injects a fake barcode scan through the full state machine, cycling through a hardcoded list of inventory items. No API call is made — the item is injected directly.

## Scope

One file change: `app/scanner-modal.tsx`. No new components, no new files.

---

## Data

A module-level constant `MOCK_SCAN_ITEMS` in `scanner-modal.tsx`:

```ts
const MOCK_SCAN_ITEMS = [
  { barcode: "MOCK-001", name: "Amoxicillin 500mg" },
  { barcode: "MOCK-002", name: "Nitrile Gloves (Box)" },
  { barcode: "MOCK-003", name: "Dental Mirror #5" },
  { barcode: "MOCK-004", name: "Composite Resin A2" },
  { barcode: "MOCK-005", name: "Surgical Mask (50-pack)" },
]
```

One item per major category (pharma, supplies, equipment, restorative, PPE). Cycles via modulo; no randomness — predictable for testing.

---

## State

```ts
const mockIndexRef = useRef(0)
```

A `useRef` (not `useState`) — advancing the index does not trigger a re-render.

---

## Handler

```ts
const handleSimulateScan = useCallback(() => {
  if (scanState.status !== "idle") return
  const mock = MOCK_SCAN_ITEMS[mockIndexRef.current % MOCK_SCAN_ITEMS.length]
  mockIndexRef.current += 1

  dispatch({ type: "SCAN_START", barcode: mock.barcode })

  setTimeout(() => {
    setScannedItems((prev) => {
      const existing = prev.find((i) => i.barcode === mock.barcode)
      if (existing) {
        return prev.map((i) =>
          i.barcode === mock.barcode ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        { id: `${Date.now()}-${Math.random()}`, barcode: mock.barcode,
          name: mock.name, quantity: 1, scannedAt: new Date() },
        ...prev,
      ]
    })
    dispatch({ type: "SCAN_SUCCESS", barcode: mock.barcode })
  }, 600)
}, [scanState.status])
```

- 600ms delay matches the sweep animation cycle; long enough to see the loading state
- Dedup logic is identical to `handleBarcodeScanned` — scanning the same mock item twice increments quantity
- `SCAN_ERROR` path is not simulated (use the real camera for error testing)

---

## UI

Position: absolute, below the viewfinder instruction text.

```tsx
{__DEV__ && (
  <Pressable
    onPress={handleSimulateScan}
    disabled={scanState.status !== "idle"}
    className="absolute self-center px-4 py-1.5 rounded-full bg-black/50 border border-white/20 active:opacity-70 disabled:opacity-40"
    style={{ top: (SHEET_TOP + FINDER_SIZE) / 2 + 36 }}
  >
    <Text className="text-xs font-semibold text-white/80">Simulate scan</Text>
  </Pressable>
)}
```

- Disabled and visually dimmed (`opacity-40` via NativeWind) when `scanState.status !== "idle"`
- Same dark-glass aesthetic as the close button; blends with the camera overlay
- Hidden in production builds via `__DEV__` (React Native strips `__DEV__ === false` blocks in release)

---

## What is NOT in scope

- No error simulation (not useful for this dev tool)
- No random ordering (predictable cycling is better for testing)
- No UI for picking a specific mock item
- No persistence of mock index across modal sessions
