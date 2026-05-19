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
  bg: string;
  iconColor: string;
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
