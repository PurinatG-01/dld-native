import { View } from "react-native";
import { Package } from "lucide-react-native";
import { CATEGORY_META, type CategoryName } from "@/lib/category-meta";
import { getColor } from "@/lib/color";

type Props = {
  category: CategoryName | null;
  size?: number;
  className?: string;
};

export function CategoryIcon({ category, size = 18, className = "" }: Props) {
  const meta = category ? CATEGORY_META[category] : undefined;
  if (!meta) {
    return (
      <View className={`w-9 h-9 rounded-xl bg-primary/10 items-center justify-center ${className}`}>
        <Package size={size} color={getColor("primary")} />
      </View>
    );
  }
  const Icon = meta.icon;
  return (
    <View className={`w-9 h-9 rounded-xl items-center justify-center ${meta.bg} ${className}`}>
      <Icon size={size} color={getColor(meta.iconColorToken)} />
    </View>
  );
}
