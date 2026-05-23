import { useCallback, memo } from "react";
import { FlatList, Text, View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { ScannedItemRow } from "./ScannedItemRow";
import type { ScannedItem, ScanStatus } from "./types";

type Props = {
  items: ScannedItem[];
  scanStatus: ScanStatus;
  justAddedBarcode: string | null;
  onAdjustQuantity: (id: string, delta: number) => void;
  bottomInset: number;
};

type RowProps = {
  item: ScannedItem;
  isJustAdded: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
};

const Row = memo(function Row({ item, isJustAdded, onIncrement, onDecrement }: RowProps) {
  return (
    <ScannedItemRow
      item={item}
      isJustAdded={isJustAdded}
      onIncrement={onIncrement}
      onDecrement={onDecrement}
    />
  );
});

export function ScannedItemList({
  items,
  scanStatus,
  justAddedBarcode,
  onAdjustQuantity,
  bottomInset,
}: Props) {
  const renderItem = useCallback(
    ({ item }: { item: ScannedItem }) => (
      <Row
        item={item}
        isJustAdded={scanStatus === "success" && item.barcode === justAddedBarcode}
        onIncrement={() => onAdjustQuantity(item.id, 1)}
        onDecrement={() => onAdjustQuantity(item.id, -1)}
      />
    ),
    [scanStatus, justAddedBarcode, onAdjustQuantity],
  );

  return (
    <FlatList
      className="flex-1"
      data={items}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomInset + 32 }}
      ListHeaderComponent={
        scanStatus === "loading" ? (
          <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <View className="flex-1 gap-1.5">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2.5 w-1/3" />
            </View>
            <Skeleton className="w-14 h-7 rounded-full" />
          </View>
        ) : null
      }
      ListEmptyComponent={
        scanStatus !== "loading" ? (
          <Text className="text-sm text-muted-foreground text-center mt-6">
            No items scanned yet
          </Text>
        ) : null
      }
      renderItem={renderItem}
    />
  );
}
