# Camera Scanner Modal — Design Spec

**Date:** 2026-05-22
**Branch:** claude/infinite-scroll-auto-search-tEng4

## Overview

Add a native camera scanner accessible via the Scan tab button. The camera view is presented as a full-screen modal that slides up from the bottom. A close button dismisses the modal. The scanner screen will eventually have a scan-result log section below the camera view; this spec covers only the camera connection and modal presentation.

## Scope

**In scope:**
- Camera permission service (`lib/services/camera.ts`)
- Modal route (`app/scanner-modal.tsx`) with camera view and close button
- Scanner tab trigger (`app/(app)/scanner.tsx`) that opens the modal on focus
- Root layout update to register the modal screen

**Out of scope (future):**
- Barcode/QR decoding and result handling
- Scan result log section in the modal
- Android-specific camera UI adjustments

## Architecture

### New package

`expo-camera` — provides `CameraView`, `useCameraPermissions`, and the imperative permission API. Compatible with the current Expo SDK 54 setup.

### Files changed / created

| File | Change |
|---|---|
| `lib/services/camera.ts` | New — camera permission service |
| `app/_layout.tsx` | Update — register `scanner-modal` with `presentation: 'modal'` |
| `app/(app)/scanner.tsx` | Update — focus trigger that opens the modal |
| `app/scanner-modal.tsx` | New — full-screen camera modal |

## Camera Service

`lib/services/camera.ts` follows the same plain-function pattern as `auth.ts` and `inventory.ts` — no classes, no hooks, just async functions.

```ts
requestCameraPermission(): Promise<'granted' | 'denied' | 'undetermined'>
getCameraPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'>
```

Wraps `Camera.requestCameraPermissionsAsync()` and `Camera.getCameraPermissionsAsync()` from `expo-camera`. The modal UI uses `useCameraPermissions()` (reactive hook) for rendering, and calls `requestCameraPermission()` from the service to imperatively trigger the system permission dialog on mount.

## Modal Routing

The root `app/_layout.tsx` Stack gains a new screen entry:

```tsx
<Stack.Screen
  name="scanner-modal"
  options={{ presentation: 'modal', headerShown: false }}
/>
```

This gives the slide-up-from-bottom animation for free via the native iOS modal presentation.

## Scanner Tab Trigger

`app/(app)/scanner.tsx` renders a blank `View` and uses `useFocusEffect` with a timestamp debounce ref (300 ms) to call `router.push('/scanner-modal')` when the tab gains focus. The debounce prevents the modal from re-opening when it is dismissed and the tab briefly regains focus.

## Scanner Modal Screen

`app/scanner-modal.tsx` responsibilities:

1. On mount — call `requestCameraPermission()` from the service
2. Render states:
   - **Granted** — full-screen `CameraView` (back-facing, from `expo-camera`) with an X close button overlaid in the top-right corner
   - **Denied / undetermined** — message telling the user to enable camera access in Settings, plus a close button
3. Close button — calls `router.back()`, dismissing the modal (user briefly sees the blank scanner tab)

## Data Flow

```
User taps Scan tab
  → scanner.tsx gains focus
  → debounce check passes
  → router.push('/scanner-modal')
  → scanner-modal mounts
  → requestCameraPermission() called
  → useCameraPermissions() reactive state drives render
  → CameraView shown (if granted)
  → User taps X
  → router.back()
  → scanner-modal dismissed
  → scanner.tsx briefly visible (blank)
```

## Error Handling

- Permission denied: show inline message, no crash
- Camera unavailable (simulator): `CameraView` renders a black frame; no special handling needed for MVP
