# Camera Scanner Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native camera scanner accessible via the Scan tab — presented as a full-screen modal that slides up from the bottom with a close button.

**Architecture:** The root Stack in `app/_layout.tsx` hosts a `scanner-modal` screen with `presentation: 'modal'`. The scanner tab (`app/(app)/scanner.tsx`) uses `useFocusEffect` with a 300 ms debounce ref to push the modal when focused. The modal itself uses `expo-camera`'s `CameraView` + `useCameraPermissions`, backed by a service in `lib/services/camera.ts`.

**Tech Stack:** expo-camera, expo-router (Stack modal presentation), NativeWind, lucide-react-native, react-native-safe-area-context

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/services/camera.ts` | Create | Imperative permission request/check wrappers |
| `__tests__/services/camera.test.ts` | Create | Unit tests for camera service |
| `app/_layout.tsx` | Modify | Register `scanner-modal` with modal presentation |
| `app/(app)/scanner.tsx` | Modify | Focus trigger that opens modal with debounce |
| `app/scanner-modal.tsx` | Create | Full-screen camera view + close button |

---

## Task 1: Install expo-camera

**Files:**
- Modify: `package.json` (via expo install)

- [ ] **Install the package**

```bash
cd /Users/purinatsanbundit/Development/dld/dld-native
npx expo install expo-camera
```

Expected: package added to `dependencies` in `package.json`. No errors.

- [ ] **Verify installation**

```bash
grep "expo-camera" package.json
```

Expected output contains a line like `"expo-camera": "~16.x.x"`.

- [ ] **Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: install expo-camera"
```

---

## Task 2: Camera service

**Files:**
- Create: `lib/services/camera.ts`
- Create: `__tests__/services/camera.test.ts`

- [ ] **Write the failing test**

Create `__tests__/services/camera.test.ts`:

```ts
jest.mock("expo-camera", () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
    getCameraPermissionsAsync: jest.fn(),
  },
}));

import { Camera } from "expo-camera";
import {
  requestCameraPermission,
  getCameraPermissionStatus,
} from "@/lib/services/camera";

const mockRequest = Camera.requestCameraPermissionsAsync as jest.Mock;
const mockGet = Camera.getCameraPermissionsAsync as jest.Mock;

describe("requestCameraPermission", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns granted when permission is granted", async () => {
    mockRequest.mockResolvedValue({ status: "granted" });
    const result = await requestCameraPermission();
    expect(result).toBe("granted");
  });

  it("returns denied when permission is denied", async () => {
    mockRequest.mockResolvedValue({ status: "denied" });
    const result = await requestCameraPermission();
    expect(result).toBe("denied");
  });

  it("returns undetermined when permission is undetermined", async () => {
    mockRequest.mockResolvedValue({ status: "undetermined" });
    const result = await requestCameraPermission();
    expect(result).toBe("undetermined");
  });
});

describe("getCameraPermissionStatus", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns current granted status", async () => {
    mockGet.mockResolvedValue({ status: "granted" });
    const result = await getCameraPermissionStatus();
    expect(result).toBe("granted");
  });

  it("returns undetermined when not yet requested", async () => {
    mockGet.mockResolvedValue({ status: "undetermined" });
    const result = await getCameraPermissionStatus();
    expect(result).toBe("undetermined");
  });
});
```

- [ ] **Run test to confirm it fails**

```bash
yarn test __tests__/services/camera.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/services/camera'`

- [ ] **Create the service**

Create `lib/services/camera.ts`:

```ts
import { Camera } from "expo-camera";

export type CameraPermissionStatus = "granted" | "denied" | "undetermined";

export async function requestCameraPermission(): Promise<CameraPermissionStatus> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status as CameraPermissionStatus;
}

export async function getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
  const { status } = await Camera.getCameraPermissionsAsync();
  return status as CameraPermissionStatus;
}
```

- [ ] **Run test to confirm it passes**

```bash
yarn test __tests__/services/camera.test.ts --no-coverage
```

Expected: PASS — 5 tests pass

- [ ] **Commit**

```bash
git add lib/services/camera.ts __tests__/services/camera.test.ts
git commit -m "feat(camera): add camera permission service"
```

---

## Task 3: Register scanner-modal in root Stack

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Update the root layout**

Replace the contents of `app/_layout.tsx` with:

```tsx
import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="scanner-modal"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
```

- [ ] **Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(camera): register scanner-modal as root modal screen"
```

---

## Task 4: Update scanner tab trigger

**Files:**
- Modify: `app/(app)/scanner.tsx`

- [ ] **Replace scanner.tsx with focus trigger**

```tsx
import { useRef, useCallback } from "react";
import { View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

export default function ScannerTab() {
  const router = useRouter();
  const lastOpenRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastOpenRef.current > 300) {
        lastOpenRef.current = now;
        router.push("/scanner-modal");
      }
    }, [router])
  );

  return <View style={{ flex: 1 }} />;
}
```

- [ ] **Commit**

```bash
git add "app/(app)/scanner.tsx"
git commit -m "feat(camera): scanner tab opens modal on focus"
```

---

## Task 5: Create scanner modal screen

**Files:**
- Create: `app/scanner-modal.tsx`

- [ ] **Create the modal screen**

Create `app/scanner-modal.tsx`:

```tsx
import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { requestCameraPermission } from "@/lib/services/camera";

export default function ScannerModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission] = useCameraPermissions();

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const closeButton = (
    <TouchableOpacity
      style={[styles.closeButton, { top: insets.top + 12 }]}
      onPress={() => router.back()}
    >
      <X size={20} color="white" />
    </TouchableOpacity>
  );

  if (!permission || !permission.granted) {
    return (
      <View style={styles.denied}>
        {closeButton}
        <Text style={styles.deniedText}>
          Camera access is required to scan items.{"\n"}Please enable it in
          Settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />
      {closeButton}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  denied: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  deniedText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
});
```

- [ ] **Commit**

```bash
git add app/scanner-modal.tsx
git commit -m "feat(camera): add scanner modal with camera view and close button"
```

---

## Task 6: Manual verification

- [ ] **Run the app on iOS simulator or device**

```bash
npx expo run:ios
```

- [ ] **Verify: tap Scan tab → modal slides up, camera view fills screen**

Expected: modal slides up from bottom, camera view visible (black frame on simulator), X button in top-right corner.

- [ ] **Verify: tap X button → modal dismisses, scanner tab briefly visible**

Expected: modal slides down, blank scanner tab shown momentarily.

- [ ] **Verify: tap another tab → correct tab becomes active**

Expected: tapping Dashboard/Inventory/Account tab after dismissal navigates correctly.

- [ ] **Verify: tap Scan tab again → modal re-opens**

Expected: the 300 ms debounce allows re-opening on subsequent taps.

---

## Self-Review Notes

- Spec required camera service with `requestCameraPermission` + `getCameraPermissionStatus` → Task 2 ✅
- Spec required root layout modal registration → Task 3 ✅
- Spec required scanner tab debounce trigger → Task 4 ✅
- Spec required camera view with close button + permission denied state → Task 5 ✅
- Spec required `expo-camera` as new package → Task 1 ✅
- Types in `CameraPermissionStatus` used consistently across service and tests ✅
- `requestCameraPermission` name used consistently in service (Task 2) and modal import (Task 5) ✅
