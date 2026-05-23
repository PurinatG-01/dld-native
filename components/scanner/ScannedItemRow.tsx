import { View, Text, TouchableOpacity } from "react-native";
import { Plus, Minus, Package } from "lucide-react-native";
import { PRIMARY } from "./constants";
import type { ScannedItem } from "./types";

type Props = {
  item: ScannedItem;
  isJustAdded: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
};

export function ScannedItemRow({ item, isJustAdded, onIncrement, onDecrement }: Props) {
  return (
    <View
      className={`flex-row items-center px-4 py-3 border-b border-border${isJustAdded ? " bg-success-muted/20 border-l-2 border-l-success" : ""}`}
    >
      <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
        <Package size={18} color={PRIMARY} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-sm font-medium text-card-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5 font-mono">
          {item.barcode}
        </Text>
      </View>
      <View className="flex-row items-center gap-2 ml-3">
        <TouchableOpacity
          className="w-7 h-7 rounded-full bg-muted items-center justify-center"
          onPress={onDecrement}
          activeOpacity={0.7}
        >
          <Minus size={13} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-sm font-semibold text-card-foreground w-5 text-center">
          {item.quantity}
        </Text>
        <TouchableOpacity
          className="w-7 h-7 rounded-full bg-primary items-center justify-center"
          onPress={onIncrement}
          activeOpacity={0.7}
        >
          <Plus size={13} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
