import { memo, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { Package, Trash2 } from "lucide-react-native";
import { useColor } from "@/lib/useColor";

type Props = {
  lineKey: string;
  name: string;
  quantity: number;
  unit: string;
  lot: string | null;
  expiry: string | null;
  locationName: string | null;
  onEdit: (key: string) => void;
  onRemove: (key: string) => void;
};

export const LineRow = memo(function LineRow({
  lineKey,
  name,
  quantity,
  unit,
  lot,
  expiry,
  locationName,
  onEdit,
  onRemove,
}: Props) {
  const handleEdit = useCallback(() => onEdit(lineKey), [lineKey, onEdit]);
  const handleRemove = useCallback(() => onRemove(lineKey), [lineKey, onRemove]);

  const meta = [
    locationName,
    lot ? `Lot ${lot}` : null,
    expiry ? `Exp ${expiry}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={handleEdit}
      className="flex-row items-center px-4 py-3 border-b border-border active:bg-muted/50"
    >
      <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
        <Package size={18} color={useColor("primary")} />
      </View>
      <View className="flex-1 ml-3">
        <Text
          className="text-sm font-medium text-card-foreground"
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
          {meta.length > 0 ? meta : "No location set"}
        </Text>
      </View>
      <Text className="text-sm font-semibold text-card-foreground mx-3">
        {quantity}
        <Text className="text-xs font-normal text-muted-foreground"> {unit}</Text>
      </Text>
      <Pressable
        onPress={handleRemove}
        hitSlop={8}
        className="w-8 h-8 rounded-full bg-muted items-center justify-center active:opacity-70"
      >
        <Trash2 size={15} color={useColor("muted-foreground")} />
      </Pressable>
    </Pressable>
  );
});
