import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Minus, X } from "lucide-react-native";
import { getColor } from "@/lib/color";
import { Select } from "@/components/ui/Select";
import { ItemSearchField } from "./ItemSearchField";
import { makeLineKey, isLineValid } from "@/lib/inbound-reducer";
import { EXPIRY_RE } from "./constants";
import type { InboundLine, SelectOption } from "./types";

type Props = {
  visible: boolean;
  /** Line being edited, or null when adding a new one. */
  editing: InboundLine | null;
  defaultLocationId: string | null;
  locations: SelectOption[];
  onSave: (line: InboundLine) => void;
  onCancel: () => void;
};

export function LineEditor({
  visible,
  editing,
  defaultLocationId,
  locations,
  onSave,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<InboundLine["item"] | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [lot, setLot] = useState("");
  const [expiry, setExpiry] = useState("");
  const [locationId, setLocationId] = useState<string | null>(null);

  // Seed form when the modal opens.
  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setItem(editing.item);
      setQuantity(editing.quantity);
      setLot(editing.lot_number ?? "");
      setExpiry(editing.expiry_date ?? "");
      setLocationId(editing.location_id);
    } else {
      setItem(null);
      setQuantity(1);
      setLot("");
      setExpiry("");
      setLocationId(defaultLocationId);
    }
  }, [visible, editing, defaultLocationId]);

  const expiryValid = expiry === "" || EXPIRY_RE.test(expiry);

  const draft: InboundLine | null = item
    ? {
        key: editing?.key ?? makeLineKey(),
        item,
        quantity,
        lot_number: lot.trim() || null,
        expiry_date: expiry.trim() || null,
        location_id: locationId,
      }
    : null;

  const canSave = !!draft && isLineValid(draft) && expiryValid;

  const handleSave = useCallback(() => {
    if (draft && canSave) onSave(draft);
  }, [draft, canSave, onSave]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-border">
          <Pressable onPress={onCancel} className="active:opacity-70 py-1">
            <Text className="text-sm text-muted-foreground">Cancel</Text>
          </Pressable>
          <Text className="text-base font-bold text-foreground">
            {editing ? "Edit line" : "Add line"}
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className="active:opacity-70 py-1 disabled:opacity-40"
          >
            <Text className="text-sm font-semibold text-primary">Save</Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5 gap-5"
          keyboardShouldPersistTaps="handled"
        >
          <ItemSearchField
            value={item}
            onSelect={setItem}
            onClear={() => setItem(null)}
          />

          {/* Quantity stepper */}
          <View>
            <Text className="text-xs font-semibold text-muted-foreground mb-1.5">
              Quantity
            </Text>
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full bg-muted items-center justify-center active:opacity-70"
              >
                <Minus size={16} color={getColor("muted-foreground")} />
              </Pressable>
              <TextInput
                className="w-20 text-center text-lg font-semibold text-foreground border border-border rounded-lg py-2"
                keyboardType="number-pad"
                value={String(quantity)}
                onChangeText={(t) => {
                  const n = parseInt(t.replace(/[^0-9]/g, ""), 10);
                  setQuantity(Number.isNaN(n) ? 0 : n);
                }}
              />
              <Pressable
                onPress={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-full bg-primary items-center justify-center active:opacity-70"
              >
                <Plus size={16} color={getColor("primary-foreground")} />
              </Pressable>
            </View>
          </View>

          <Select
            label="Location"
            placeholder="Select a location"
            value={locationId}
            options={locations}
            onChange={setLocationId}
          />

          {/* Lot — optional */}
          <View>
            <Text className="text-xs font-semibold text-muted-foreground mb-1.5">
              Lot number{" "}
              <Text className="font-normal text-muted-foreground/70">
                (optional)
              </Text>
            </Text>
            <TextInput
              className="border border-border rounded-lg bg-card px-3 py-3 text-sm text-card-foreground"
              placeholder="e.g. LOT-2026-04"
              placeholderTextColor={getColor("placeholder")}
              value={lot}
              onChangeText={setLot}
              autoCapitalize="characters"
            />
          </View>

          {/* Expiry — optional, YYYY-MM-DD text */}
          <View>
            <Text className="text-xs font-semibold text-muted-foreground mb-1.5">
              Expiry date{" "}
              <Text className="font-normal text-muted-foreground/70">
                (optional)
              </Text>
            </Text>
            <TextInput
              className={`border rounded-lg bg-card px-3 py-3 text-sm text-card-foreground ${
                expiryValid ? "border-border" : "border-destructive"
              }`}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={getColor("placeholder")}
              value={expiry}
              onChangeText={setExpiry}
              keyboardType="numbers-and-punctuation"
            />
            {!expiryValid ? (
              <Text className="text-xs text-destructive mt-1">
                Use format YYYY-MM-DD.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
