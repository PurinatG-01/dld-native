# Agent Instructions — dld-native

React Native + Expo app for inventory management. Read this before writing any code. Always reference existing code patterns/structure/designs in the project first.

---

## Tech Stack

| Layer      | Library                                    |
| ---------- | ------------------------------------------ |
| Framework  | Expo ~54 / React Native 0.81               |
| Router     | expo-router (file-based, `app/` directory) |
| Styling    | NativeWind v4 + Tailwind CSS v3            |
| Animations | react-native-reanimated ~4                 |
| Gestures   | react-native-gesture-handler               |
| Backend    | Supabase (auth + edge functions)           |
| Icons      | lucide-react-native                        |

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

| Situation                                         | Example                              |
| ------------------------------------------------- | ------------------------------------ |
| `rgba()` / `hsla()` colors                        | `backgroundColor: "rgba(0,0,0,0.6)"` |
| `position: "absolute"` with computed pixel values | `top: SCREEN_HEIGHT * 0.5 - 52`      |
| Constants from `Dimensions`                       | `height: FINDER_SIZE`                |
| `StyleSheet.hairlineWidth`                        | Border that must be 0.5px on iOS     |
| Reanimated animated styles                        | `useAnimatedStyle(() => ({ ... }))`  |
| Shadow props on iOS                               | `shadowColor`, `shadowRadius`, etc.  |

When mixing both, NativeWind handles layout/color tokens and `style={}` handles the exceptions:

```tsx
<View
  className="flex-row items-center rounded-full px-3.5 py-1.5"
  style={styles.pill}
>
  <Text className="text-xs font-semibold text-success-foreground">
    ✓ Added
  </Text>
</View>
```

### Color architecture

Two layers, one source of truth:

```
tailwind.config.js (single source of truth)
  ├── className="bg-primary text-card-foreground"  → NativeWind applies to View/Text
  └── useColor("primary")                          → resolves to "#4f46e5" for JS props
```

- `lucide-react-native` icons require the explicit `color` prop (they ignore `style.color`), so `useColor` is the bridge.
- `placeholderTextColor`, `tintColor`, `colors` arrays, and other RN-specific color props also use `useColor`.
- Everything else uses NativeWind className.

### Design tokens

All tokens are defined in `tailwind.config.js` — never add hex values to component code. These custom tokens extend the built-in Tailwind palette:

| Token                    | Value     | Use for                                                       |
| ------------------------ | --------- | ------------------------------------------------------------- |
| `primary`                | `#4f46e5` | Buttons, active states, icons                                 |
| `primary-foreground`     | `#ffffff` | Text on primary bg                                            |
| `primary-light`          | `#818cf8` | Loading / in-progress indicators                              |
| `primary-lighter`        | `#a5b4fc` | Text on loading pill bg                                       |
| `background`             | `#f8fafc` | App background                                                |
| `card`                   | `#ffffff` | Sheet / card surfaces                                         |
| `card-foreground`        | `#0f172a` | Primary text on cards                                         |
| `border`                 | `#e2e8f0` | Dividers, outlines                                            |
| `foreground`             | `#0f172a` | General text color                                            |
| `muted`                  | `#f1f5f9` | Subtle backgrounds                                            |
| `muted-foreground`       | `#64748b` | Secondary / placeholder text                                  |
| `destructive`            | `#ef4444` | Errors, delete actions                                        |
| `destructive-foreground` | `#ffffff` | Text on destructive bg                                        |
| `success`                | `#16a34a` | Success borders, icons                                        |
| `success-foreground`     | `#4ade80` | Text on dark success bg                                       |
| `success-muted`          | `#052e16` | Base for success alpha backgrounds — pair with `/20` or `/92` |
| `error-foreground`       | `#f87171` | Text on dark error bg                                         |
| `error-muted`            | `#2d0a0a` | Base for error alpha backgrounds — pair with `/92`            |
| `inactive`               | `#cbd5e1` | Inactive sort indicators, muted decorative elements           |
| `placeholder`            | `#94a3b8` | TextInput placeholder text, empty state icons                 |
| `category-supplies`      | `#7c3aed` | Icon color — Anesthetics & Pharmaceuticals category           |
| `category-equipment`     | `#64748b` | Icon color — Disposables & Office category                    |
| `category-pharma`        | `#2563eb` | Icon color — Endodontic category / cold chain badge           |
| `category-hygiene`       | `#0891b2` | Icon color — Hygiene & Preventives category                   |
| `category-lab`           | `#d97706` | Icon color — Lab & Prosthodontic category                     |
| `category-ppe`           | `#059669` | Icon color — PPE & Infection Control category                 |
| `category-restorative`   | `#f43f5e` | Icon color — Restorative & Cosmetic category                  |
| `category-surgical`      | `#ea580c` | Icon color — Surgical & Implant category                      |

### Icons and JS-level color values

Use the `useColor` hook from `@/lib/useColor` to resolve design tokens to hex values for icon `color` props, `placeholderTextColor`, `tintColor`, etc.:

```tsx
import { useColor } from "@/lib/useColor";

function MyComponent() {
  const primary = useColor("primary");
  return <Package size={20} color={primary} />;
}

// Inline is also fine for single uses:
<ActivityIndicator size="small" color={useColor("primary")} />
```

Token names are type-checked via the `ColorToken` type exported from `@/lib/useColor`. All custom tokens live in `tailwind.config.js` only — do **not** add new hex values to component code.

### Component-level color conventions

- **Never duplicate a hex value** across multiple files. If it's in `tailwind.config.js`, reference it via className or `useColor`.
- **Category icon colors** (`category-*` tokens) are stored as token names in `lib/category-meta.ts:iconColorToken` — components resolve them at render time via `useColor(meta.iconColorToken)`.
- **Safe overrides** (`rgba()`, iOS shadow colors) are the only acceptable inline hex values (per StyleSheet exception table above).

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
    constants.ts       # SCREEN_HEIGHT, SHEET_TOP, FINDER_SIZE, CORNER_SIZE, HAIRLINE_WIDTH
    ScannedItemRow.tsx # Single scanned item row with quantity stepper
    ScannedItemList.tsx# ScrollView list: skeleton / empty state / rows
    ScannerStatusPill.tsx # Animated floating pill (Scanning… / ✓ Added / ✕ Not found)
    ScannerSheet.tsx   # Swipeable bottom sheet with gesture + header + list

lib/
  services/            # API service functions (Supabase edge functions)
  supabase/            # Supabase client
  useColor.ts          # useColor(ColorToken) hook + ColorToken type
  types.ts             # Shared domain types
```

### Services

All backend calls live in `lib/services/`. Each function fetches the Supabase session, builds a URL to the relevant edge function, and throws on non-ok responses. Follow this pattern when adding new service functions — do not inline fetch calls in components.

### Navigation

Uses expo-router file-based routing. Modal screens are registered as root-level routes and pushed with `router.push("/screen-name")`. Tab screens live under `app/(app)/`.

### Component extraction pattern

Feature-specific components live under `components/<feature>/`. Each directory contains:

- `types.ts` — all TypeScript types and discriminated unions for that feature
- `constants.ts` — computed constants (e.g. Dimensions-based values, layout constants)
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
