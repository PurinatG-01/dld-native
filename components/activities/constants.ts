import {
  PackagePlus,
  ArrowDownCircle,
  Trash2,
  ArrowLeftRight,
  SlidersHorizontal,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { ColorToken } from "@/lib/useColor";
import type { ActionType } from "@/lib/services/movements";

export type ActionMeta = {
  label: string;
  icon: LucideIcon;
  bg: string;
  iconColorToken: ColorToken;
};

export const ACTION_META: Record<ActionType, ActionMeta> = {
  INBOUND: {
    label: "Inbound",
    icon: PackagePlus,
    bg: "bg-emerald-100",
    iconColorToken: "success",
  },
  USE: {
    label: "Use",
    icon: ArrowDownCircle,
    bg: "bg-blue-100",
    iconColorToken: "category-pharma",
  },
  DISCARD: {
    label: "Discard",
    icon: Trash2,
    bg: "bg-red-100",
    iconColorToken: "destructive",
  },
  TRANSFER: {
    label: "Transfer",
    icon: ArrowLeftRight,
    bg: "bg-violet-100",
    iconColorToken: "category-supplies",
  },
  ADJUST: {
    label: "Adjust",
    icon: SlidersHorizontal,
    bg: "bg-amber-100",
    iconColorToken: "category-lab",
  },
};

/** All action_type values, in display order — drives the filter chips. */
export const ACTION_TYPES = Object.keys(ACTION_META) as ActionType[];

/** Formats an ISO timestamp as a compact local date+time, e.g. "2 Jun 2026, 18:42". */
export function formatMovementDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
