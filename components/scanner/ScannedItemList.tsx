import { ScrollView, Text, View } from "react-native";
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

export function ScannedItemList({
  items,
  scanStatus,
  justAddedBarcode,
  onAdjustQuantity,
  bottomInset,
}: Props) {
  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomInset + 32 }}
    >
      {scanStatus === "loading" && (
        <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <View className="flex-1 gap-1.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </View>
          <Skeleton className="w-14 h-7 rounded-full" />
        </View>
      )}

      {items.length === 0 && scanStatus !== "loading" ? (
        <Text className="text-sm text-muted-foreground text-center mt-6">
          No items scanned yet
        </Text>
      ) : (
        items.map((item) => (
          <ScannedItemRow
            key={item.id}
            item={item}
            isJustAdded={scanStatus === "success" && item.barcode === justAddedBarcode}
            onIncrement={() => onAdjustQuantity(item.id, 1)}
            onDecrement={() => onAdjustQuantity(item.id, -1)}
          />
        ))
      )}
    </ScrollView>
  );
}
