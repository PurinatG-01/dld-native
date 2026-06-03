import { View, Text, Pressable } from "react-native";
import { Plus, Minus } from "lucide-react-native";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { getColor } from "@/lib/color";
import type { ScannedItem } from "./types";

type Props = {
  item: ScannedItem;
  isJustAdded: boolean;
  /** Inbound batch mode: item name unknown until commit-time resolution. */
  rawMode?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function ScannedItemRow({ item, isJustAdded, rawMode = false, onIncrement, onDecrement }: Props) {
  return (
    <View
      className={`flex-row items-center px-4 py-3 border-b border-border${isJustAdded ? " bg-success-muted/20 border-l-2 border-l-success" : ""}`}
    >
      <CategoryIcon category={item.category} size={18} />
      <View className="flex-1 ml-3">
        {rawMode ? (
          <>
            <Text className="text-sm font-medium text-card-foreground font-mono" numberOfLines={1}>
              {item.barcode}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Identified on commit
            </Text>
          </>
        ) : (
          <>
            <Text className="text-sm font-medium text-card-foreground" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5 font-mono">
              {item.barcode}
            </Text>
          </>
        )}
      </View>
      <View className="flex-row items-center gap-2 ml-3">
        <Pressable
          className="w-7 h-7 rounded-full bg-muted items-center justify-center active:opacity-70"
          onPress={onDecrement}
        >
          <Minus size={13} color={getColor("muted-foreground")} />
        </Pressable>
        <Text className="text-sm font-semibold text-card-foreground w-5 text-center">
          {item.quantity}
        </Text>
        <Pressable
          className="w-7 h-7 rounded-full bg-primary items-center justify-center active:opacity-70"
          onPress={onIncrement}
        >
          <Plus size={13} color={getColor("primary-foreground")} />
        </Pressable>
      </View>
    </View>
  );
}
