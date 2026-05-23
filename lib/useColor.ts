const ITEM_CATEGORY_COLORS = {
  "category-supplies": "#7c3aed",
  "category-equipment": "#64748b",
  "category-pharma": "#2563eb",
  "category-hygiene": "#0891b2",
  "category-lab": "#d97706",
  "category-ppe": "#059669",
  "category-restorative": "#f43f5e",
  "category-surgical": "#ea580c",
} as const

const COLORS = {
  primary: "#4f46e5",
  "primary-foreground": "#ffffff",
  "primary-light": "#818cf8",
  "primary-lighter": "#a5b4fc",
  background: "#f8fafc",
  card: "#ffffff",
  "card-foreground": "#0f172a",
  border: "#e2e8f0",
  foreground: "#0f172a",
  muted: "#f1f5f9",
  "muted-foreground": "#64748b",
  destructive: "#ef4444",
  "destructive-foreground": "#ffffff",
  success: "#16a34a",
  "success-foreground": "#4ade80",
  "success-muted": "#052e16",
  "error-foreground": "#f87171",
  "error-muted": "#2d0a0a",
  inactive: "#cbd5e1",
  placeholder: "#94a3b8",
  ...ITEM_CATEGORY_COLORS,
} as const
export type ColorToken = keyof typeof COLORS

export function useColor(token: ColorToken): string {
  return COLORS[token]
}
