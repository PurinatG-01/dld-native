# Agent Instructions — dld-native

React Native + Expo app for inventory management. Read this before writing any code.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo ~54 / React Native 0.81 |
| Router | expo-router (file-based, `app/` directory) |
| Styling | NativeWind v4 + Tailwind CSS v3 |
| Animations | react-native-reanimated ~4 |
| Gestures | react-native-gesture-handler |
| Backend | Supabase (auth + edge functions) |
| Icons | lucide-react-native |

---

## Styling Rules

### NativeWind first

Use `className` for all styling. Do **not** reach for `StyleSheet.create` unless you have a specific reason listed below.

```tsx
// Correct
<View className="flex-row items-center px-4 py-3 gap-2 rounded-xl bg-card">
  <Text className="text-sm font-semibold text-card-foreground">Label</Text>
</View>

// Wrong — these are plain Tailwind equivalents, no reason to use StyleSheet
<View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
```

### When StyleSheet.create is allowed

Only use `StyleSheet.create` (or inline `style={}`) for values that NativeWind cannot express:

| Situation | Example |
|---|---|
| `rgba()` / `hsla()` colors | `backgroundColor: "rgba(0,0,0,0.6)"` |
| `position: "absolute"` with computed pixel values | `top: SCREEN_HEIGHT * 0.5 - 52` |
| Constants from `Dimensions` | `height: FINDER_SIZE` |
| `StyleSheet.hairlineWidth` | Border that must be 0.5px on iOS |
| Reanimated animated styles | `useAnimatedStyle(() => ({ ... }))` |
| Shadow props on iOS | `shadowColor`, `shadowRadius`, etc. |

When mixing both, NativeWind handles layout/color tokens and `style={}` handles the exceptions:

```tsx
<View className="flex-row items-center rounded-full px-3.5 py-1.5" style={styles.pill}>
  <Text className="text-xs font-semibold" style={{ color: "#4ade80" }}>✓ Added</Text>
</View>
```

### Design tokens

These custom tokens are defined in `tailwind.config.js` — use them instead of raw hex values:

| Token | Value | Use for |
|---|---|---|
| `primary` | `#4f46e5` | Buttons, active states, icons |
| `primary-foreground` | `#ffffff` | Text on primary bg |
| `background` | `#f8fafc` | App background |
| `card` | `#ffffff` | Sheet / card surfaces |
| `card-foreground` | `#0f172a` | Primary text on cards |
| `border` | `#e2e8f0` | Dividers, outlines |
| `muted` | `#f1f5f9` | Subtle backgrounds |
| `muted-foreground` | `#64748b` | Secondary / placeholder text |
| `destructive` | `#ef4444` | Errors, delete actions |
| `destructive-foreground` | `#ffffff` | Text on destructive bg |

---

## Project Conventions

### File structure

```
app/
  _layout.tsx          # Root layout
  (app)/               # Authenticated tab screens
    _layout.tsx
    dashboard.tsx
    scanner.tsx
    inventory/
  auth/                # Unauthenticated screens
  scanner-modal.tsx    # Camera scanner (root modal)

components/
  ui/                  # Shared primitives (Skeleton, FlashMessage)
  auth/
  dashboard/
  scanner/             # Scanner-specific components
    types.ts           # ScanState, ScanAction, ScannedItem, ScanStatus
    constants.ts       # SCREEN_HEIGHT, SHEET_TOP, FINDER_SIZE, PRIMARY, etc.
    ScannedItemRow.tsx # Single scanned item row with quantity stepper
    ScannedItemList.tsx# ScrollView list: skeleton / empty state / rows
    ScannerStatusPill.tsx # Animated floating pill (Scanning… / ✓ Added / ✕ Not found)
    ScannerSheet.tsx   # Swipeable bottom sheet with gesture + header + list

lib/
  services/            # API service functions (Supabase edge functions)
  supabase/            # Supabase client
  types.ts             # Shared domain types
```

### Services

All backend calls live in `lib/services/`. Each function fetches the Supabase session, builds a URL to the relevant edge function, and throws on non-ok responses. Follow this pattern when adding new service functions — do not inline fetch calls in components.

### Navigation

Uses expo-router file-based routing. Modal screens are registered as root-level routes and pushed with `router.push("/screen-name")`. Tab screens live under `app/(app)/`.

### Component extraction pattern

Feature-specific components live under `components/<feature>/`. Each directory contains:
- `types.ts` — all TypeScript types and discriminated unions for that feature
- `constants.ts` — computed constants (e.g. Dimensions-based values, color maps)
- One file per component, named in PascalCase

**Props over shared state.** Pass data and callbacks down as props. Components do not import from `app/` or reach into sibling feature directories.

**Self-contained animations.** If a component owns an animation (e.g. fade in/out), it declares its own `useSharedValue` and `useEffect` internally. Only pass a `SharedValue` as a prop when the parent genuinely needs to drive the animation from outside (e.g. a sheet whose position is controlled by a parent gesture).

```tsx
// Good — pill owns its opacity animation
export function ScannerStatusPill({ scanStatus }: { scanStatus: ScanStatus }) {
  const opacity = useSharedValue(0);
  useEffect(() => { opacity.value = withTiming(...); }, [scanStatus]);
  ...
}

// Good — sheet receives translateY from parent that coordinates multiple views
export function ScannerSheet({ translateY }: { translateY: SharedValue<number> }) { ... }
```

### Reanimated

The project uses Reanimated v4. Use `useSharedValue` + `useAnimatedStyle` for animated styles. Animated styles must be returned from `useAnimatedStyle` — do not derive them inline in the component body.

---

## Claude Code note

Claude Code reads `CLAUDE.md` in addition to this file. Keep both in sync if you create one.
