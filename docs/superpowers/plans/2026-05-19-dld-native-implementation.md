# dld-native Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone React Native (Expo) app inside `dld/dld-native/` that replicates the dld-pwa flow — login, dashboard, inventory list, inventory detail, and account — with responsive layout (bottom tabs on iPhone, sidebar on iPad).

**Architecture:** Expo managed workflow with Expo Router v4 (file-based routing mirroring the PWA's `app/` structure). NativeWind v4 provides Tailwind-style styling on native components. Auth and data are fetched via the same Supabase client + Edge Functions as the PWA; session is persisted with `@react-native-async-storage/async-storage`. The layout layer detects screen width at runtime to toggle between a bottom tab navigator (< 768pt) and a sidebar + stack (≥ 768pt).

**Tech Stack:** Expo SDK 52, Expo Router v4, NativeWind v4, `@supabase/supabase-js` v2, `@react-native-async-storage/async-storage`, `lucide-react-native`, TypeScript, Jest + `@testing-library/react-native`

---

## File Map

```
dld-native/
├── app/
│   ├── _layout.tsx                    # Root: CSS import, auth guard, Stack
│   ├── auth/
│   │   ├── _layout.tsx                # Stack layout for auth group
│   │   └── login.tsx                  # Login screen (renders LoginForm)
│   └── (app)/
│       ├── _layout.tsx                # Responsive: Tabs (phone) or Sidebar+Slot (iPad)
│       ├── dashboard.tsx              # Dashboard screen
│       ├── account.tsx                # Account screen
│       └── inventory/
│           ├── _layout.tsx            # Nested Stack for inventory tab
│           ├── index.tsx              # Inventory list screen
│           └── [id].tsx               # Inventory detail screen
├── components/
│   ├── auth/LoginForm.tsx
│   ├── dashboard/StatCard.tsx
│   ├── layout/Sidebar.tsx
│   └── ui/
│       ├── Skeleton.tsx
│       └── FlashMessage.tsx
├── lib/
│   ├── category-meta.ts
│   ├── types.ts
│   ├── utils.ts
│   ├── supabase/client.ts
│   └── services/
│       ├── auth.ts
│       ├── user.ts
│       └── inventory.ts
├── __tests__/
│   ├── services/auth.test.ts
│   ├── services/inventory.test.ts
│   └── services/user.test.ts
├── global.css
├── nativewind-env.d.ts
├── app.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── tsconfig.json
├── jest.config.js
├── jest.setup.ts
├── .env
└── .env.example
```

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `babel.config.js`
- Create: `metro.config.js`
- Create: `tailwind.config.js`
- Create: `tsconfig.json`
- Create: `jest.config.js`
- Create: `jest.setup.ts`
- Create: `global.css`
- Create: `nativewind-env.d.ts`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "dld-native",
  "version": "0.1.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "test": "jest --watchAll=false",
    "test:watch": "jest --watchAll",
    "lint": "expo lint"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "2.1.2",
    "@supabase/supabase-js": "^2.49.8",
    "expo": "~52.0.0",
    "expo-constants": "~17.0.8",
    "expo-font": "~13.0.4",
    "expo-linking": "~7.0.5",
    "expo-router": "~4.0.20",
    "expo-secure-store": "~14.0.1",
    "expo-splash-screen": "~0.29.22",
    "expo-status-bar": "~2.0.1",
    "lucide-react-native": "^0.475.0",
    "nativewind": "^4.1.23",
    "react": "18.3.2",
    "react-native": "0.76.9",
    "react-native-gesture-handler": "~2.20.2",
    "react-native-reanimated": "~3.16.7",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "react-native-svg": "15.8.0",
    "react-native-url-polyfill": "^2.0.0",
    "tailwindcss": "^3.4.17"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^12.9.0",
    "@types/jest": "^29.5.14",
    "@types/react": "~18.3.12",
    "babel-jest": "^29.7.0",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.5",
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 2: Create `app.json`**

```json
{
  "expo": {
    "name": "DLD",
    "slug": "dld-native",
    "version": "1.0.0",
    "orientation": "default",
    "icon": "./assets/images/icon.png",
    "scheme": "dld",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.dld.native"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.dld.native"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 3: Create `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

- [ ] **Step 4: Create `metro.config.js`**

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

- [ ] **Step 5: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5",
        "primary-foreground": "#ffffff",
        background: "#f8fafc",
        card: "#ffffff",
        "card-foreground": "#0f172a",
        border: "#e2e8f0",
        foreground: "#0f172a",
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 6: Create `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.d.ts",
    "expo-env.d.ts"
  ]
}
```

- [ ] **Step 7: Create `jest.config.js`**

```js
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["./jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native|nativewind)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
```

- [ ] **Step 8: Create `jest.setup.ts`**

```ts
import "@testing-library/jest-native/extend-expect";
```

- [ ] **Step 9: Create `global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Create `nativewind-env.d.ts`**

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 11: Create `.env.example`**

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 12: Create `.gitignore`**

```
node_modules/
.expo/
dist/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
.env
.env.local
```

- [ ] **Step 13: Create placeholder assets directory**

```bash
mkdir -p assets/images
```

Note: Add placeholder `icon.png`, `adaptive-icon.png`, `splash-icon.png`, and `favicon.png` (1024×1024 solid indigo-600 PNG) to `assets/images/`. Expo requires these to build.

- [ ] **Step 14: Copy `.env.example` to `.env` and fill in real values**

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=<your Supabase project URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
```

- [ ] **Step 15: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 16: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo project with NativeWind and Expo Router"
```

---

## Task 2: Supabase client

**Files:**
- Create: `lib/supabase/client.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/supabase/client.test.ts`:

```ts
import { supabase } from "@/lib/supabase/client";

describe("supabase client", () => {
  it("is defined", () => {
    expect(supabase).toBeDefined();
  });

  it("has auth property", () => {
    expect(supabase.auth).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/supabase/client.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/supabase/client'`

- [ ] **Step 3: Create `lib/supabase/client.ts`**

```ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/supabase/client.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/client.ts __tests__/supabase/client.test.ts
git commit -m "feat: add Supabase client with AsyncStorage session persistence"
```

---

## Task 3: Types and category metadata

**Files:**
- Create: `lib/types.ts`
- Create: `lib/category-meta.ts`
- Create: `lib/utils.ts`

- [ ] **Step 1: Create `lib/types.ts`** (verbatim from PWA)

```ts
export type UserRole = {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
  created_at: string;
};

export type User = {
  id: string;
  role_id: string;
  branch_id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Branch = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type BranchLocation = {
  id: string;
  branch_id: string;
  parent_id: string | null;
  name: string;
  created_at: string;
};

export type Item = {
  id: string;
  name: string;
  generic_name: string | null;
  brand: string | null;
  internal_sku: string | null;
  barcode_gtin: string | null;
  category: string;
  subcategory: string | null;
  unit_of_measure: string;
  pack_size: number | null;
  default_supplier_id: string | null;
  default_unit_cost: number | null;
  currency: string | null;
  par_level: number | null;
  reorder_point: number | null;
  max_level: number | null;
  lead_time_days: number | null;
  is_controlled_drug: boolean;
  requires_refrigeration: boolean;
  is_serialized: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type ItemStock = {
  id: string;
  item_id: string;
  location_id: string;
  lot_number: string | null;
  serial_number: string | null;
  expiry_date: string | null;
  manufacturing_date: string | null;
  received_date: string | null;
  quantity_on_hand: number;
  unit_cost_at_receipt: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type MovementType =
  | "INBOUND"
  | "WITHDRAWN"
  | "WASTAGE"
  | "TRANSFER"
  | "ADJUST"
  | "FLAG"
  | "UNFLAG"
  | "AUDIT"
  | "DISPOSE";
```

- [ ] **Step 2: Create `lib/category-meta.ts`**

Icons from `lucide-react-native` take a `color` prop (hex string), not a CSS class. The `iconColor` field replaces the PWA's `color` (Tailwind text class).

```ts
import {
  Pill,
  FileText,
  Stethoscope,
  Droplets,
  FlaskConical,
  ShieldCheck,
  Sparkles,
  Scissors,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

export type CategoryMeta = {
  icon: LucideIcon;
  bg: string;       // NativeWind className for the icon container background
  iconColor: string; // hex colour passed to the icon's color prop
};

export const CATEGORY_META: Record<string, CategoryMeta> = {
  "Anesthetics & Pharmaceuticals": {
    icon: Pill,
    bg: "bg-violet-100",
    iconColor: "#7c3aed",
  },
  "Disposables & Office": {
    icon: FileText,
    bg: "bg-slate-100",
    iconColor: "#64748b",
  },
  Endodontic: {
    icon: Stethoscope,
    bg: "bg-blue-100",
    iconColor: "#2563eb",
  },
  "Hygiene & Preventives": {
    icon: Droplets,
    bg: "bg-cyan-100",
    iconColor: "#0891b2",
  },
  "Lab & Prosthodontic": {
    icon: FlaskConical,
    bg: "bg-amber-100",
    iconColor: "#d97706",
  },
  "PPE & Infection Control": {
    icon: ShieldCheck,
    bg: "bg-emerald-100",
    iconColor: "#059669",
  },
  "Restorative & Cosmetic": {
    icon: Sparkles,
    bg: "bg-rose-100",
    iconColor: "#f43f5e",
  },
  "Surgical & Implant": {
    icon: Scissors,
    bg: "bg-orange-100",
    iconColor: "#ea580c",
  },
};
```

- [ ] **Step 3: Create `lib/utils.ts`**

```ts
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isExpiringSoon(expiryDateIso: string | null): boolean {
  if (!expiryDateIso) return false;
  const diff = new Date(expiryDateIso).getTime() - Date.now();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}
```

- [ ] **Step 4: Write tests for utils**

Create `__tests__/utils.test.ts`:

```ts
import { formatDate, isExpiringSoon } from "@/lib/utils";

describe("formatDate", () => {
  it("returns — for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("formats an ISO date string", () => {
    expect(formatDate("2025-01-15T00:00:00Z")).toMatch(/15 Jan 2025/);
  });
});

describe("isExpiringSoon", () => {
  it("returns false for null", () => {
    expect(isExpiringSoon(null)).toBe(false);
  });

  it("returns true for a date 30 days from now", () => {
    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(isExpiringSoon(soon)).toBe(true);
  });

  it("returns false for a date 120 days from now", () => {
    const far = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();
    expect(isExpiringSoon(far)).toBe(false);
  });

  it("returns false for a past date", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(isExpiringSoon(past)).toBe(false);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm test -- __tests__/utils.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/category-meta.ts lib/utils.ts __tests__/utils.test.ts
git commit -m "feat: add types, category metadata, and date utilities"
```

---

## Task 4: Service layer

**Files:**
- Create: `lib/services/auth.ts`
- Create: `lib/services/user.ts`
- Create: `lib/services/inventory.ts`
- Create: `__tests__/services/auth.test.ts`
- Create: `__tests__/services/user.test.ts`
- Create: `__tests__/services/inventory.test.ts`

- [ ] **Step 1: Write failing test for auth service**

Create `__tests__/services/auth.test.ts`:

```ts
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

import { supabase } from "@/lib/supabase/client";
import { signInWithEmail, signOut } from "@/lib/services/auth";

const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;

describe("signInWithEmail", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns success: true when Supabase returns no error", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const result = await signInWithEmail("a@b.com", "pass");
    expect(result).toEqual({ success: true });
  });

  it("returns success: false with error message when Supabase errors", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Invalid login" } });
    const result = await signInWithEmail("a@b.com", "wrong");
    expect(result).toEqual({ success: false, error: "Invalid login" });
  });
});

describe("signOut", () => {
  it("calls supabase.auth.signOut", async () => {
    mockSignOut.mockResolvedValue({});
    await signOut();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/services/auth.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/services/auth'`

- [ ] **Step 3: Create `lib/services/auth.ts`**

```ts
import { supabase } from "@/lib/supabase/client";

export type SignInResult =
  | { success: true }
  | { success: false; error: string };

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
```

- [ ] **Step 4: Run auth test to verify it passes**

```bash
npm test -- __tests__/services/auth.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Write failing test for user service**

Create `__tests__/services/user.test.ts`:

```ts
const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock("@/lib/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

import { getUserProfile } from "@/lib/services/user";

describe("getUserProfile", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns profile data on success", async () => {
    const profile = { id: "1", name: "Ada", email: "a@b.com", role_id: "r", branch_id: "b" };
    mockSingle.mockResolvedValue({ data: profile, error: null });

    const result = await getUserProfile("1");
    expect(result).toEqual(profile);
    expect(mockFrom).toHaveBeenCalledWith("user");
  });

  it("returns null when Supabase errors", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
    const result = await getUserProfile("99");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 6: Create `lib/services/user.ts`**

```ts
import { supabase } from "@/lib/supabase/client";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role_id: string;
  branch_id: string;
};

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user")
    .select("id, name, email, role_id, branch_id")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}
```

- [ ] **Step 7: Run user test to verify it passes**

```bash
npm test -- __tests__/services/user.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 8: Write failing test for inventory service**

Create `__tests__/services/inventory.test.ts`:

```ts
const mockGetSession = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: { getSession: mockGetSession },
  },
}));

global.fetch = jest.fn();

import { listItems, getItemStock } from "@/lib/services/inventory";

const SESSION = { access_token: "tok" };

describe("listItems", () => {
  afterEach(() => jest.clearAllMocks());

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(listItems({})).rejects.toThrow("Not authenticated");
  });

  it("returns data on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    const payload = { data: [], meta: { total: 0, page: 1, limit: 20, total_pages: 0, sort_by: "name", sort_dir: "asc" } };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    const result = await listItems({ page: 1 });
    expect(result).toEqual(payload);
  });

  it("throws on non-ok response", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Server Error",
      json: async () => ({ error: "Server Error" }),
    });
    await expect(listItems({})).rejects.toThrow("Server Error");
  });
});

describe("getItemStock", () => {
  afterEach(() => jest.clearAllMocks());

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(getItemStock("item-1")).rejects.toThrow("Not authenticated");
  });

  it("returns item stock data on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    const payload = { item: { id: "item-1", name: "Amoxicillin" }, stocks: [] };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    const result = await getItemStock("item-1");
    expect(result).toEqual(payload);
  });
});
```

- [ ] **Step 9: Create `lib/services/inventory.ts`**

```ts
import { supabase } from "@/lib/supabase/client";

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit_of_measure: string;
  reorder_point: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_quantity: number;
};

export type SortDir = "asc" | "desc";
export type SortBy =
  | "name"
  | "category"
  | "unit_of_measure"
  | "reorder_point"
  | "created_at";

export type ListItemsMeta = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  sort_by: SortBy;
  sort_dir: SortDir;
};

export type ListItemsResult = {
  data: InventoryItem[];
  meta: ListItemsMeta;
};

export type ItemStockRecord = {
  id: string;
  item_id: string;
  location_id: string;
  location_name: string | null;
  lot_number: string | null;
  serial_number: string | null;
  expiry_date: string | null;
  manufacturing_date: string | null;
  received_date: string | null;
  quantity_on_hand: number;
  unit_cost_at_receipt: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ItemDetail = {
  id: string;
  name: string;
  generic_name: string | null;
  brand: string | null;
  internal_sku: string | null;
  barcode_gtin: string | null;
  category: string;
  subcategory: string | null;
  unit_of_measure: string;
  pack_size: number | null;
  reorder_point: number | null;
  par_level: number | null;
  max_level: number | null;
  is_controlled_drug: boolean;
  requires_refrigeration: boolean;
  is_serialized: boolean;
  created_at: string;
};

export type GetItemStockResult = {
  item: ItemDetail;
  stocks: ItemStockRecord[];
};

export async function listItems(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  branch_id?: string;
  sort_by?: SortBy;
  sort_dir?: SortDir;
}): Promise<ListItemsResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = new URL(
    "/functions/v1/list-items",
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.search) url.searchParams.set("search", params.search);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.branch_id) url.searchParams.set("branch_id", params.branch_id);
  if (params.sort_by) url.searchParams.set("sort_by", params.sort_by);
  if (params.sort_dir) url.searchParams.set("sort_dir", params.sort_dir);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "list-items request failed");
  }

  return res.json();
}

export async function getItemStock(itemId: string): Promise<GetItemStockResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = new URL(
    "/functions/v1/item-stock",
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );
  url.searchParams.set("item_id", itemId);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "item-stock request failed");
  }

  return res.json();
}
```

- [ ] **Step 10: Run inventory test to verify it passes**

```bash
npm test -- __tests__/services/inventory.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 11: Commit**

```bash
git add lib/services/ __tests__/services/
git commit -m "feat: add auth, user, and inventory service layer"
```

---

## Task 5: UI primitives

**Files:**
- Create: `components/ui/Skeleton.tsx`
- Create: `components/ui/FlashMessage.tsx`

- [ ] **Step 1: Create `components/ui/Skeleton.tsx`**

```tsx
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className={`bg-muted rounded-md ${className}`}
    />
  );
}
```

- [ ] **Step 2: Create `components/ui/FlashMessage.tsx`**

```tsx
import { View, Text } from "react-native";

interface FlashMessageProps {
  message: string;
  variant?: "error" | "success";
}

export function FlashMessage({
  message,
  variant = "error",
}: FlashMessageProps) {
  const styles =
    variant === "error"
      ? "border border-destructive/20 bg-destructive/10"
      : "border border-emerald-200 bg-emerald-50";
  const textStyle = variant === "error" ? "text-destructive" : "text-emerald-700";

  return (
    <View className={`rounded-lg px-4 py-3 mb-4 ${styles}`}>
      <Text className={`text-sm ${textStyle}`}>{message}</Text>
    </View>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/
git commit -m "feat: add Skeleton and FlashMessage UI primitives"
```

---

## Task 6: Root layout and auth guard

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/auth/_layout.tsx`

- [ ] **Step 1: Create `app/_layout.tsx`**

This is the root entry point. It imports the global CSS (required for NativeWind), initialises Supabase auth state listening, and redirects unauthenticated users to login.

```tsx
import "../global.css";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments, SplashScreen } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still loading

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "auth";

    if (!session && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (session && inAuthGroup) {
      router.replace("/(app)/dashboard");
    }
  }, [session, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Create `app/auth/_layout.tsx`**

```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx app/auth/_layout.tsx
git commit -m "feat: add root layout with Supabase auth guard"
```

---

## Task 7: Login screen

**Files:**
- Create: `components/auth/LoginForm.tsx`
- Create: `app/auth/login.tsx`

- [ ] **Step 1: Create `components/auth/LoginForm.tsx`**

```tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Stethoscope } from "lucide-react-native";
import { signInWithEmail } from "@/lib/services/auth";
import { FlashMessage } from "@/components/ui/FlashMessage";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const result = await signInWithEmail(email, password);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else {
      router.replace("/(app)/dashboard");
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow items-center justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-sm bg-card rounded-xl border border-border p-10 shadow-sm">
          {/* Brand */}
          <View className="flex-row items-center gap-3 mb-10">
            <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
              <Stethoscope size={20} color="#ffffff" />
            </View>
            <View>
              <Text className="text-base font-bold text-card-foreground leading-tight">
                DLD
              </Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Clinical Ops
              </Text>
            </View>
          </View>

          <Text className="text-xl font-bold text-card-foreground mb-1">
            Welcome back
          </Text>
          <Text className="text-sm text-muted-foreground mb-8">
            Sign in to your clinic account
          </Text>

          {error && <FlashMessage message={error} variant="error" />}

          {/* Email */}
          <Text className="text-sm font-medium text-card-foreground mb-1.5">
            Email address
          </Text>
          <TextInput
            className="border border-border rounded-lg px-3 py-3 text-sm text-foreground bg-background mb-4"
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          {/* Password */}
          <Text className="text-sm font-medium text-card-foreground mb-1.5">
            Password
          </Text>
          <TextInput
            className="border border-border rounded-lg px-3 py-3 text-sm text-foreground bg-background mb-6"
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            autoComplete="current-password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TouchableOpacity
            className="bg-primary rounded-lg py-3.5 items-center"
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-sm">
                Sign in
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 2: Create `app/auth/login.tsx`**

```tsx
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginScreen() {
  return <LoginForm />;
}
```

- [ ] **Step 3: Commit**

```bash
git add components/auth/ app/auth/login.tsx
git commit -m "feat: add login screen with email/password form"
```

---

## Task 8: Sidebar component

**Files:**
- Create: `components/layout/Sidebar.tsx`

- [ ] **Step 1: Create `components/layout/Sidebar.tsx`**

```tsx
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter, usePathname } from "expo-router";
import {
  LayoutDashboard,
  Package,
  Stethoscope,
  User,
  LogOut,
} from "lucide-react-native";
import { signOut } from "@/lib/services/auth";

const NAV_ITEMS = [
  { href: "/(app)/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/(app)/inventory", icon: Package, label: "Inventory" },
] as const;

interface SidebarProps {
  displayName: string;
  email: string;
}

export function Sidebar({ displayName, email }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  return (
    <View className="w-64 bg-card border-r border-border flex-col h-full">
      {/* Logo */}
      <View className="p-6 flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
          <Stethoscope size={20} color="#ffffff" />
        </View>
        <View>
          <Text className="font-bold text-base text-card-foreground leading-tight">
            DLD
          </Text>
          <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Clinical Ops
          </Text>
        </View>
      </View>

      {/* Nav items */}
      <View className="flex-1 px-4 gap-1 mt-4">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const segment = href.split("/").pop()!;
          const active = pathname.includes(segment);
          return (
            <TouchableOpacity
              key={href}
              onPress={() => router.push(href as any)}
              activeOpacity={0.7}
              className={`flex-row items-center gap-3 px-3 py-3 rounded-xl ${
                active ? "bg-primary/10" : ""
              }`}
            >
              <Icon size={20} color={active ? "#4f46e5" : "#64748b"} />
              <Text
                className={`text-sm font-medium ${
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* User footer */}
      <View className="p-4 mt-auto border-t border-border">
        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-8 h-8 rounded-full bg-muted items-center justify-center">
            <User size={14} color="#64748b" />
          </View>
          <View className="flex-1 overflow-hidden">
            <Text className="text-xs font-bold text-foreground" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
              {email}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.7}
          className="flex-row items-center gap-2 px-3 py-2 rounded-xl"
        >
          <LogOut size={14} color="#ef4444" />
          <Text className="text-sm text-destructive font-medium">Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Sidebar.tsx
git commit -m "feat: add responsive Sidebar component for iPad layout"
```

---

## Task 9: App layout (responsive tabs + sidebar)

**Files:**
- Create: `app/(app)/_layout.tsx`
- Create: `app/(app)/inventory/_layout.tsx`

- [ ] **Step 1: Create `app/(app)/_layout.tsx`**

On narrow screens (< 768pt) this renders a bottom tab bar. On wide screens (iPad, ≥ 768pt) it hides the tab bar and shows the `Sidebar` alongside the content. The `Sidebar` needs the logged-in user's name and email, so we fetch the profile here once.

```tsx
import { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { LayoutDashboard, Package, UserCircle } from "lucide-react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { getUserProfile, type UserProfile } from "@/lib/services/user";
import { Sidebar } from "@/components/layout/Sidebar";

const BREAKPOINT = 768;

const COLORS = {
  primary: "#4f46e5",
  muted: "#64748b",
  card: "#ffffff",
  border: "#e2e8f0",
};

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      setSession(session);
      getUserProfile(session.user.id).then(setProfile);
    });
  }, []);

  const displayName = profile?.name ?? session?.user?.email ?? "User";
  const email = profile?.email ?? session?.user?.email ?? "";

  return (
    <View style={{ flex: 1, flexDirection: isWide ? "row" : "column" }}>
      {isWide && <Sidebar displayName={displayName} email={email} />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: isWide
              ? { display: "none" }
              : {
                  backgroundColor: COLORS.card,
                  borderTopColor: COLORS.border,
                  height: 64,
                },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.muted,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "600",
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color }) => (
                <LayoutDashboard size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="inventory"
            options={{
              title: "Inventory",
              tabBarIcon: ({ color }) => <Package size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: "Account",
              tabBarIcon: ({ color }) => <UserCircle size={22} color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Create `app/(app)/inventory/_layout.tsx`**

This wraps the inventory tab in a Stack so `[id].tsx` can be pushed on top of `index.tsx`.

```tsx
import { Stack } from "expo-router";

export default function InventoryLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/_layout.tsx" "app/(app)/inventory/_layout.tsx"
git commit -m "feat: add responsive app layout with bottom tabs and iPad sidebar"
```

---

## Task 10: StatCard component and Dashboard screen

**Files:**
- Create: `components/dashboard/StatCard.tsx`
- Create: `app/(app)/dashboard.tsx`

- [ ] **Step 1: Create `components/dashboard/StatCard.tsx`**

```tsx
import { View, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  bgClassName?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "#ffffff",
  bgClassName = "bg-primary",
}: StatCardProps) {
  return (
    <View className="bg-card p-6 rounded-xl border border-border min-w-36 flex-1">
      <View className={`w-9 h-9 rounded-lg items-center justify-center mb-4 ${bgClassName}`}>
        <Icon size={20} color={iconColor} />
      </View>
      <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
        {label}
      </Text>
      <Text className="text-2xl font-bold text-card-foreground tracking-tight">
        {value}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: Create `app/(app)/dashboard.tsx`**

```tsx
import { ScrollView, View, Text } from "react-native";
import { Package, Activity, TrendingUp, AlertCircle } from "lucide-react-native";
import { StatCard } from "@/components/dashboard/StatCard";

export default function DashboardScreen() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground tracking-tight">
          Dashboard
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          Live inventory overview
        </Text>
      </View>

      {/* Stat cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-4 pb-1"
        className="mb-6"
      >
        <StatCard
          label="Total Items"
          value="—"
          icon={Package}
          bgClassName="bg-primary"
          iconColor="#ffffff"
        />
        <StatCard
          label="In Stock"
          value="—"
          icon={Activity}
          bgClassName="bg-emerald-500"
          iconColor="#ffffff"
        />
        <StatCard
          label="Low Stock"
          value="—"
          icon={AlertCircle}
          bgClassName="bg-destructive"
          iconColor="#ffffff"
        />
        <StatCard
          label="Expiring Soon"
          value="—"
          icon={TrendingUp}
          bgClassName="bg-amber-500"
          iconColor="#ffffff"
        />
      </ScrollView>

      {/* Placeholder */}
      <View className="bg-card rounded-xl border border-border p-12 items-center">
        <Package size={36} color="#94a3b8" />
        <Text className="text-sm font-bold text-muted-foreground mt-3">
          Stock table — connecting to real data next
        </Text>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ "app/(app)/dashboard.tsx"
git commit -m "feat: add Dashboard screen with stat cards"
```

---

## Task 11: Inventory list screen

**Files:**
- Create: `app/(app)/inventory/index.tsx`

- [ ] **Step 1: Create `app/(app)/inventory/index.tsx`**

Replicates the PWA inventory page. Uses `FlatList` instead of `<table>`. Sort and pagination work via the same API params. Category filter uses a horizontal `ScrollView` of pill buttons.

```tsx
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react-native";
import { CATEGORY_META } from "@/lib/category-meta";
import {
  listItems,
  type InventoryItem,
  type ListItemsMeta,
  type SortBy,
  type SortDir,
} from "@/lib/services/inventory";
import { Skeleton } from "@/components/ui/Skeleton";

const PAGE_SIZE = 20;

const SORT_COLUMNS: { key: SortBy; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "unit_of_measure", label: "Unit" },
];

const COLORS = { primary: "#4f46e5", muted: "#64748b", destructive: "#ef4444" };

function CategoryIcon({ category }: { category: string }) {
  const meta = CATEGORY_META[category];
  if (!meta) return <View className="w-9 h-9 rounded-xl bg-muted" />;
  const Icon = meta.icon;
  return (
    <View className={`w-9 h-9 rounded-xl items-center justify-center ${meta.bg}`}>
      <Icon size={18} color={meta.iconColor} />
    </View>
  );
}

function SkeletonRow() {
  return (
    <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <View className="flex-1 gap-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </View>
      <Skeleton className="h-4 w-10" />
    </View>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [meta, setMeta] = useState<ListItemsMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number, q: string, cat: string, sb: SortBy, sd: SortDir) => {
      setLoading(true);
      setError(null);
      try {
        const result = await listItems({
          page: p,
          limit: PAGE_SIZE,
          search: q || undefined,
          category: cat || undefined,
          sort_by: sb,
          sort_dir: sd,
        });
        setItems(result.data);
        setMeta(result.meta);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(page, query, category, sortBy, sortDir);
  }, [page, query, category, sortBy, sortDir, load]);

  function handleSearch() {
    setPage(1);
    setQuery(searchInput);
  }

  function handleSort(col: SortBy) {
    if (col === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIndicator({ col }: { col: SortBy }) {
    if (col !== sortBy)
      return <ChevronUp size={10} color="#cbd5e1" style={{ marginLeft: 2 }} />;
    return sortDir === "asc" ? (
      <ChevronUp size={10} color={COLORS.primary} style={{ marginLeft: 2 }} />
    ) : (
      <ChevronDown size={10} color={COLORS.primary} style={{ marginLeft: 2 }} />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="p-6 pb-3">
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6">
          <Package size={20} color={COLORS.primary} />
          <Text className="text-2xl font-bold text-foreground tracking-tight">
            Inventory
          </Text>
        </View>

        {/* Search */}
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 flex-row items-center border border-border rounded-lg bg-background px-3">
            <Search size={16} color={COLORS.muted} />
            <TextInput
              className="flex-1 ml-2 text-sm text-foreground py-3"
              placeholder="Search items…"
              placeholderTextColor="#94a3b8"
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            className="bg-primary px-4 rounded-lg items-center justify-center"
            activeOpacity={0.8}
          >
            <Text className="text-primary-foreground font-semibold text-sm">
              Search
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pb-1"
          className="mb-4"
        >
          {["", ...Object.keys(CATEGORY_META)].map((cat) => {
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat || "__all__"}
                onPress={() => { setCategory(cat); setPage(1); }}
                activeOpacity={0.7}
                className={`px-3 py-1.5 rounded-full border ${
                  active
                    ? "bg-primary border-primary"
                    : "bg-card border-border"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {cat || "All"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 mb-2"
        >
          {SORT_COLUMNS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => handleSort(key)}
              activeOpacity={0.7}
              className="flex-row items-center px-3 py-1.5 rounded-full border border-border bg-card"
            >
              <Text className="text-xs font-semibold text-muted-foreground">
                {label}
              </Text>
              <SortIndicator col={key} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {error && (
        <View className="px-6 py-4">
          <Text className="text-sm text-destructive text-center">{error}</Text>
        </View>
      )}

      {!error && loading && (
        <View>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      )}

      {!error && !loading && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerClassName="pb-6"
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Text className="text-sm text-muted-foreground">
                No items found
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const low =
              item.reorder_point !== null &&
              item.total_quantity <= item.reorder_point;
            return (
              <Pressable
                onPress={() => router.push(`/(app)/inventory/${item.id}` as any)}
                className="flex-row items-center px-4 py-3 border-b border-border active:bg-muted/50"
              >
                <CategoryIcon category={item.category} />
                <View className="flex-1 ml-3">
                  <Text
                    className="text-sm font-medium text-card-foreground"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {item.category} · {item.unit_of_measure}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className={`text-sm font-semibold ${
                      low ? "text-destructive" : "text-card-foreground"
                    }`}
                  >
                    {item.total_quantity}
                  </Text>
                  {item.reorder_point !== null && (
                    <Text className="text-[10px] text-muted-foreground">
                      reorder: {item.reorder_point}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <View className="flex-row items-center justify-between px-6 py-3 border-t border-border bg-card">
          <Text className="text-xs text-muted-foreground">
            {meta.total} items · page {meta.page} of {meta.total_pages}
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`w-9 h-9 rounded-lg border border-border items-center justify-center ${
                page === 1 ? "opacity-40" : ""
              }`}
            >
              <ChevronLeft size={16} color={COLORS.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setPage((p) => Math.min(meta.total_pages, p + 1))
              }
              disabled={page === meta.total_pages}
              className={`w-9 h-9 rounded-lg border border-border items-center justify-center ${
                page === meta.total_pages ? "opacity-40" : ""
              }`}
            >
              <ChevronRight size={16} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(app)/inventory/index.tsx"
git commit -m "feat: add Inventory list screen with search, filter, sort, and pagination"
```

---

## Task 12: Inventory detail screen

**Files:**
- Create: `app/(app)/inventory/[id].tsx`

- [ ] **Step 1: Create `app/(app)/inventory/[id].tsx`**

```tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Package,
  AlertTriangle,
  Thermometer,
  ShieldAlert,
  Barcode,
} from "lucide-react-native";
import { CATEGORY_META } from "@/lib/category-meta";
import {
  getItemStock,
  type GetItemStockResult,
  type ItemStockRecord,
} from "@/lib/services/inventory";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate, isExpiringSoon } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-muted", text: "text-muted-foreground" },
  in_stock: { bg: "bg-emerald-100", text: "text-emerald-700" },
  partially_used: { bg: "bg-amber-100", text: "text-amber-700" },
  flagged: { bg: "bg-orange-100", text: "text-orange-700" },
  transferred: { bg: "bg-blue-100", text: "text-blue-700" },
  consumed: { bg: "bg-muted", text: "text-muted-foreground" },
  disposed: { bg: "bg-destructive/10", text: "text-destructive" },
};

const COLORS = {
  primary: "#4f46e5",
  muted: "#64748b",
  destructive: "#ef4444",
  orange: "#f97316",
};

function MetaField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-0.5">
        {label}
      </Text>
      <View className="flex-row items-center gap-1">
        {highlight && <AlertTriangle size={13} color={COLORS.destructive} />}
        <Text
          className={`font-medium ${
            highlight ? "text-destructive" : "text-card-foreground"
          }`}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function StockRow({ stock }: { stock: ItemStockRecord }) {
  const expiringSoon = isExpiringSoon(stock.expiry_date);
  const expired =
    stock.expiry_date && new Date(stock.expiry_date) < new Date();
  const statusStyle = STATUS_STYLES[stock.status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-500",
  };

  return (
    <View className="px-4 py-3 border-b border-border">
      <View className="flex-row items-start justify-between mb-1">
        <Text className="text-sm font-medium text-card-foreground flex-1">
          {stock.location_name ?? stock.location_id}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${statusStyle.bg} ml-2`}>
          <Text className={`text-[10px] font-medium ${statusStyle.text}`}>
            {stock.status}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <Text className="text-xs text-muted-foreground font-mono">
          {stock.lot_number ?? stock.serial_number ?? "—"}
        </Text>
        <Text
          className={`text-xs ${
            expired
              ? "text-destructive font-medium"
              : expiringSoon
              ? "text-orange-500 font-medium"
              : "text-muted-foreground"
          }`}
        >
          Exp: {formatDate(stock.expiry_date)}
          {expiringSoon && !expired ? " ⚠" : ""}
        </Text>
        <Text className="text-xs font-semibold text-card-foreground ml-auto">
          Qty: {stock.quantity_on_hand}
        </Text>
      </View>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View className="p-6 gap-6">
      <View className="bg-card rounded-xl border border-border p-6">
        <View className="flex-row items-start gap-4 mb-5">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </View>
        </View>
        <View className="flex-row flex-wrap gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} className="w-[45%] gap-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </View>
          ))}
        </View>
      </View>
      <View className="bg-card rounded-xl border border-border">
        <View className="px-6 py-4 border-b border-border">
          <Skeleton className="h-5 w-32" />
        </View>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} className="px-4 py-3 border-b border-border gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function InventoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<GetItemStockResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getItemStock(id)
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load stock")
      )
      .finally(() => setLoading(false));
  }, [id]);

  const totalQty =
    data?.stocks.reduce((sum, s) => sum + s.quantity_on_hand, 0) ?? 0;

  return (
    <View className="flex-1 bg-background">
      {/* Back button */}
      <View className="px-6 pt-6 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1"
          activeOpacity={0.7}
        >
          <ChevronLeft size={16} color={COLORS.muted} />
          <Text className="text-sm text-muted-foreground">
            Back to Inventory
          </Text>
        </TouchableOpacity>
      </View>

      {loading && <DetailSkeleton />}

      {error && (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      )}

      {!loading && !error && data && (
        <ScrollView contentContainerClassName="p-6 gap-6">
          {/* Item header card */}
          <View className="bg-card rounded-xl border border-border p-6">
            <View className="flex-row items-start gap-4 mb-5">
              {(() => {
                const catMeta = CATEGORY_META[data.item.category];
                if (catMeta) {
                  const Icon = catMeta.icon;
                  return (
                    <View
                      className={`w-14 h-14 rounded-xl items-center justify-center ${catMeta.bg}`}
                    >
                      <Icon size={26} color={catMeta.iconColor} />
                    </View>
                  );
                }
                return (
                  <View className="w-14 h-14 rounded-xl bg-primary/10 items-center justify-center">
                    <Package size={24} color={COLORS.primary} />
                  </View>
                );
              })()}

              <View className="flex-1">
                <Text className="text-xl font-bold text-card-foreground mb-1">
                  {data.item.name}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {data.item.is_controlled_drug && (
                    <View className="flex-row items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-full">
                      <ShieldAlert size={11} color={COLORS.destructive} />
                      <Text className="text-[10px] font-medium text-destructive">
                        Controlled
                      </Text>
                    </View>
                  )}
                  {data.item.requires_refrigeration && (
                    <View className="flex-row items-center gap-1 bg-blue-100 px-2 py-0.5 rounded-full">
                      <Thermometer size={11} color="#2563eb" />
                      <Text className="text-[10px] font-medium text-blue-700">
                        Cold chain
                      </Text>
                    </View>
                  )}
                </View>
                {data.item.generic_name && (
                  <Text className="text-sm text-muted-foreground mt-1">
                    {data.item.generic_name}
                  </Text>
                )}
              </View>

              <View className="items-end">
                <Text className="text-3xl font-bold text-card-foreground">
                  {totalQty}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {data.item.unit_of_measure} total
                </Text>
              </View>
            </View>

            {/* Meta grid */}
            <View className="flex-row flex-wrap">
              <View className="w-1/2">
                <MetaField label="Category" value={data.item.category} />
              </View>
              <View className="w-1/2">
                <MetaField
                  label="Subcategory"
                  value={data.item.subcategory ?? "—"}
                />
              </View>
              <View className="w-1/2">
                <MetaField
                  label="Internal SKU"
                  value={data.item.internal_sku ?? "—"}
                />
              </View>
              <View className="w-1/2">
                <MetaField
                  label="Barcode / GTIN"
                  value={data.item.barcode_gtin ?? "—"}
                />
              </View>
              <View className="w-1/2">
                <MetaField
                  label="Reorder point"
                  value={
                    data.item.reorder_point !== null
                      ? String(data.item.reorder_point)
                      : "—"
                  }
                  highlight={totalQty <= (data.item.reorder_point ?? Infinity)}
                />
              </View>
              <View className="w-1/2">
                <MetaField
                  label="Par level"
                  value={
                    data.item.par_level !== null
                      ? String(data.item.par_level)
                      : "—"
                  }
                />
              </View>
              <View className="w-1/2">
                <MetaField
                  label="Max level"
                  value={
                    data.item.max_level !== null
                      ? String(data.item.max_level)
                      : "—"
                  }
                />
              </View>
              <View className="w-1/2">
                <MetaField
                  label="Pack size"
                  value={
                    data.item.pack_size !== null
                      ? String(data.item.pack_size)
                      : "—"
                  }
                />
              </View>
            </View>
          </View>

          {/* Stock batches */}
          <View className="bg-card rounded-xl border border-border">
            <View className="px-6 py-4 border-b border-border flex-row items-center gap-2">
              <Text className="font-semibold text-card-foreground">
                Stock batches
              </Text>
              <Text className="text-sm text-muted-foreground">
                ({data.stocks.length})
              </Text>
            </View>
            {data.stocks.length === 0 ? (
              <View className="px-6 py-12 items-center">
                <Text className="text-sm text-muted-foreground">
                  No stock found at this branch
                </Text>
              </View>
            ) : (
              data.stocks.map((stock) => (
                <StockRow key={stock.id} stock={stock} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(app)/inventory/[id].tsx"
git commit -m "feat: add Inventory detail screen with item meta and stock batches"
```

---

## Task 13: Account screen

**Files:**
- Create: `app/(app)/account.tsx`

- [ ] **Step 1: Create `app/(app)/account.tsx`**

```tsx
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { User, Settings } from "lucide-react-native";
import { supabase } from "@/lib/supabase/client";
import { getUserProfile, type UserProfile } from "@/lib/services/user";
import { signOut } from "@/lib/services/auth";

const COLORS = { muted: "#64748b", destructive: "#ef4444" };

export default function AccountScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setEmail(session.user.email ?? "");
      getUserProfile(session.user.id).then(setProfile);
    });
  }, []);

  const displayName = profile?.name ?? email ?? "User";
  const displayEmail = profile?.email ?? email ?? "";

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="max-w-lg self-center w-full px-4 py-8 gap-6">
      <Text className="text-2xl font-bold text-foreground">Account</Text>

      {/* Profile card */}
      <View className="bg-card border border-border rounded-2xl p-5 flex-row items-center gap-4">
        <View className="w-14 h-14 rounded-full bg-muted items-center justify-center">
          <User size={24} color={COLORS.muted} />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-card-foreground" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {displayEmail}
          </Text>
        </View>
      </View>

      {/* General section */}
      <View className="bg-card border border-border rounded-2xl overflow-hidden">
        <View className="px-5 py-3 border-b border-border">
          <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            General
          </Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-3 px-5 py-4 active:bg-muted"
          activeOpacity={0.7}
          onPress={() => {
            /* settings not yet implemented */
          }}
        >
          <Settings size={16} color={COLORS.muted} />
          <Text className="text-sm text-foreground">Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        onPress={handleSignOut}
        activeOpacity={0.8}
        className="border border-destructive/30 bg-destructive/5 rounded-xl py-3.5 items-center"
      >
        <Text className="text-sm font-semibold text-destructive">Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(app)/account.tsx"
git commit -m "feat: add Account screen with profile card and sign out"
```

---

## Task 14: Run all tests and verify the app starts

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: All tests pass. Count should be ≥ 12 (utils: 4, supabase: 2, auth: 3, user: 2, inventory: 5).

- [ ] **Step 2: Start the Expo dev server**

```bash
npx expo start
```

Expected: QR code displayed, Metro bundler running, no startup errors in the terminal.

- [ ] **Step 3: Test on iOS Simulator (iPhone)**

Press `i` in the terminal. Verify:
- Splash screen shows, then redirects to `/auth/login`
- Login form renders with DLD logo, email/password fields, Sign in button
- Entering wrong credentials shows error message
- Entering correct credentials navigates to Dashboard with bottom tabs (Dashboard, Inventory, Account)
- Dashboard shows 4 stat cards with `—` values
- Inventory tab shows list with search bar, category filter pills, and sort buttons; items load from API
- Tapping an item navigates to detail screen with item header card and stock batches
- Back button returns to list
- Account tab shows profile card and Sign out button; tapping Sign out redirects to login

- [ ] **Step 4: Test on iPad Simulator**

In the Expo DevTools, switch to iPad Air or iPad Pro simulator. Verify:
- Sidebar is visible on the left with DLD logo, Dashboard and Inventory nav items, user info at the bottom
- No bottom tab bar is shown
- Tapping nav items in the sidebar navigates between screens
- All screens scroll and render correctly at wider width

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify app runs on iPhone and iPad simulators"
```
