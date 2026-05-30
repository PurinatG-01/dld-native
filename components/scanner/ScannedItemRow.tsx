import { View, Text, Pressable } from "react-native";
import { Plus, Minus, Package, ChevronRight } from "lucide-react-native";
import { useColor } from "@/lib/useColor";
import type { ScannedItem } from "./types";

type Props = {
  item: ScannedItem;
  isJustAdded: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onPress: () => void;
};

function detailSubtitle(item: ScannedItem): { text: string; isSuccess: boolean } {
  if (item.lotNumber || item.expiryDate) {
    const parts: string[] = [];
    if (item.lotNumber) parts.push(item.lotNumber);
    if (item.expiryDate) parts.push(`exp ${item.expiryDate}`);
    return { text: `✓ ${parts.join(" · ")}`, isSuccess: true };
  }
  return { text: "tap to add details", isSuccess: false };
}

export function ScannedItemRow({
  item,
  isJustAdded,
  onIncrement,
  onDecrement,
  onPress,
}: Props) {
  const primaryColor = useColor("primary");
  const mutedFg = useColor("muted-foreground");
  const primaryFg = useColor("primary-foreground");
  const { text: subtitle, isSuccess } = detailSubtitle(item);

  return (
    <View
      className={`flex-row items-center px-4 py-3 border-b border-border${isJustAdded ? " bg-primary/5" : ""}`}
    >
      <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
        <Package size={18} color={primaryColor} />
      </View>

      <Pressable className="flex-1 ml-3 active:opacity-70" onPress={onPress}>
        <Text className="text-sm font-medium text-card-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text
          className={`text-xs mt-0.5 ${isSuccess ? "text-green-500" : "text-amber-500"}`}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </Pressable>

      <View className="flex-row items-center gap-2 ml-2">
        <Pressable
          className="w-7 h-7 rounded-full bg-muted items-center justify-center active:opacity-70"
          onPress={onDecrement}
        >
          <Minus size={13} color={mutedFg} />
        </Pressable>
        <Text className="text-sm font-semibold text-card-foreground w-5 text-center">
          {item.quantity}
        </Text>
        <Pressable
          className="w-7 h-7 rounded-full bg-primary items-center justify-center active:opacity-70"
          onPress={onIncrement}
        >
          <Plus size={13} color={primaryFg} />
        </Pressable>
      </View>

      <Pressable className="ml-2 p-1 active:opacity-70" onPress={onPress}>
        <ChevronRight size={16} color={mutedFg} />
      </Pressable>
    </View>
  );
}
