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
import type { ColorToken } from "@/lib/color";

export type CategoryMeta = {
  icon: LucideIcon;
  bg: string;
  iconColorToken: ColorToken;
};

export const CATEGORY_META = {
  "Anesthetics & Pharmaceuticals": {
    icon: Pill,
    bg: "bg-violet-100",
    iconColorToken: "category-supplies",
  },
  "Disposables & Office": {
    icon: FileText,
    bg: "bg-slate-100",
    iconColorToken: "category-equipment",
  },
  Endodontic: {
    icon: Stethoscope,
    bg: "bg-blue-100",
    iconColorToken: "category-pharma",
  },
  "Hygiene & Preventives": {
    icon: Droplets,
    bg: "bg-cyan-100",
    iconColorToken: "category-hygiene",
  },
  "Lab & Prosthodontic": {
    icon: FlaskConical,
    bg: "bg-amber-100",
    iconColorToken: "category-lab",
  },
  "PPE & Infection Control": {
    icon: ShieldCheck,
    bg: "bg-emerald-100",
    iconColorToken: "category-ppe",
  },
  "Restorative & Cosmetic": {
    icon: Sparkles,
    bg: "bg-rose-100",
    iconColorToken: "category-restorative",
  },
  "Surgical & Implant": {
    icon: Scissors,
    bg: "bg-orange-100",
    iconColorToken: "category-surgical",
  },
} as const satisfies Record<string, CategoryMeta>;

export type CategoryName = keyof typeof CATEGORY_META;
