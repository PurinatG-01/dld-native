# Simulate Scan Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dev-only "Simulate scan" button to `scanner-modal.tsx` that injects a hardcoded item through the full scan state machine without hitting the API.

**Architecture:** Single file change. A module-level `MOCK_SCAN_ITEMS` array provides 5 hardcoded items. A `useRef` tracks the cycle index. A `useCallback` handler fires `SCAN_START`, waits 600ms, updates `scannedItems`, then fires `SCAN_SUCCESS`. A `__DEV__`-gated `Pressable` renders below the viewfinder instruction text.

**Tech Stack:** React Native, react-native-reanimated (existing), NativeWind v4, expo-router

---

### Task 1: Add mock data constant and ref

**Files:**
- Modify: `app/scanner-modal.tsx`

- [ ] **Step 1: Add `MOCK_SCAN_ITEMS` at module level, above the `scanReducer` function**

In `app/scanner-modal.tsx`, insert after the imports and before `function scanReducer`:

```ts
const MOCK_SCAN_ITEMS = [
  { barcode: "MOCK-001", name: "Amoxicillin 500mg" },
  { barcode: "MOCK-002", name: "Nitrile Gloves (Box)" },
  { barcode: "MOCK-003", name: "Dental Mirror #5" },
  { barcode: "MOCK-004", name: "Composite Resin A2" },
  { barcode: "MOCK-005", name: "Surgical Mask (50-pack)" },
] as const;
```

- [ ] **Step 2: Add `mockIndexRef` inside `ScannerModal` component, after the existing `useState`/`useReducer` declarations**

```ts
const mockIndexRef = useRef(0);
```

`useRef` (not `useState`) — incrementing the index must not trigger a re-render.

---

### Task 2: Add `handleSimulateScan` callback

**Files:**
- Modify: `app/scanner-modal.tsx`

- [ ] **Step 1: Add `handleSimulateScan` after the existing `handleBarcodeScanned` callback**

```ts
const handleSimulateScan = useCallback(() => {
  if (scanState.status !== "idle") return;
  const mock = MOCK_SCAN_ITEMS[mockIndexRef.current % MOCK_SCAN_ITEMS.length];
  mockIndexRef.current += 1;

  dispatch({ type: "SCAN_START", barcode: mock.barcode });

  setTimeout(() => {
    setScannedItems((prev) => {
      const existing = prev.find((i) => i.barcode === mock.barcode);
      if (existing) {
        return prev.map((i) =>
          i.barcode === mock.barcode ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        {
          id: `${Date.now()}-${Math.random()}`,
          barcode: mock.barcode,
          name: mock.name,
          quantity: 1,
          scannedAt: new Date(),
        },
        ...prev,
      ];
    });
    dispatch({ type: "SCAN_SUCCESS", barcode: mock.barcode });
  }, 600);
}, [scanState.status]);
```

- [ ] **Step 2: Verify `useRef` is imported from React**

The existing import line is:
```ts
import { useEffect, useReducer, useCallback, useState } from "react";
```
Add `useRef`:
```ts
import { useEffect, useReducer, useCallback, useState, useRef } from "react";
```

---

### Task 3: Add the `__DEV__` button to JSX

**Files:**
- Modify: `app/scanner-modal.tsx`

- [ ] **Step 1: Add the simulate button after the viewfinder instruction `<Text>`**

The existing instruction text block is:
```tsx
<Text
  className="absolute inset-x-0 text-xs text-center text-white/75"
  style={{ top: (SHEET_TOP + FINDER_SIZE) / 2 + 12 }}
>
  {scanState.status === "loading"
    ? "Looking up item…"
    : "Align barcode within the frame"}
</Text>
```

Add immediately after it:
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

---

### Task 4: Verify and commit

**Files:**
- Modify: `app/scanner-modal.tsx`

- [ ] **Step 1: Check TypeScript compiles cleanly**

```bash
yarn tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Commit**

```bash
git add app/scanner-modal.tsx
git commit -m "feat(scanner): add dev-only simulate scan button

Cycles through 5 hardcoded items, fires full SCAN_START→SCAN_SUCCESS
state machine with 600ms fake delay. Hidden in production via __DEV__."
```
