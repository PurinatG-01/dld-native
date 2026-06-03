import { useCallback } from "react";
import { FlatList, View, Text } from "react-native";
import { LineRow } from "./LineRow";
import type { InboundLine, SelectOption } from "./types";

type Props = {
  lines: InboundLine[];
  locations: SelectOption[];
  onEdit: (key: string) => void;
  onRemove: (key: string) => void;
  bottomInset: number;
};

export function LineList({
  lines,
  locations,
  onEdit,
  onRemove,
  bottomInset,
}: Props) {
  const locationName = useCallback(
    (id: string | null) => locations.find((l) => l.id === id)?.name ?? null,
    [locations]
  );

  const totalUnits = lines.reduce((sum, l) => sum + l.quantity, 0);

  const renderItem = useCallback(
    ({ item }: { item: InboundLine }) => (
      <LineRow
        lineKey={item.key}
        name={item.item?.name ?? "Unidentified item"}
        category={item.item?.category ?? null}
        quantity={item.quantity}
        unit={item.item?.unit_of_measure ?? ""}
        lot={item.lot_number}
        expiry={item.expiry_date}
        locationName={locationName(item.location_id)}
        barcode={item.barcode ?? null}
        isError={item.status === "error"}
        onEdit={onEdit}
        onRemove={onRemove}
      />
    ),
    [locationName, onEdit, onRemove]
  );

  return (
    <FlatList
      className="flex-1"
      data={lines}
      keyExtractor={(l) => l.key}
      contentContainerStyle={{ paddingBottom: bottomInset + 16 }}
      renderItem={renderItem}
      ListHeaderComponent={
        lines.length > 0 ? (
          <View className="px-4 py-2.5 bg-muted/30">
            <Text className="text-xs font-semibold text-muted-foreground">
              {lines.length} {lines.length === 1 ? "line" : "lines"} ·{" "}
              {totalUnits} {totalUnits === 1 ? "unit" : "units"}
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View className="py-16 items-center px-8">
          <Text className="text-sm text-muted-foreground text-center">
            No lines yet. Tap “Add line” to record an item.
          </Text>
        </View>
      }
    />
  );
}
