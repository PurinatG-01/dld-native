import { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { X } from "lucide-react-native";
import { useColor } from "@/lib/useColor";
import { SCREEN_HEIGHT } from "./constants";
import type { ScannedItem } from "./types";

type DetailFields = Pick<ScannedItem, "lotNumber" | "expiryDate" | "serialNumber" | "unitCost">;

type Props = {
  item: ScannedItem | null;
  onSave: (id: string, details: DetailFields) => void;
  onClose: () => void;
  bottomInset: number;
};

const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

export function ItemDetailSheet({ item, onSave, onClose, bottomInset }: Props) {
  const mutedFg = useColor("muted-foreground");
  const translateY = useSharedValue(SHEET_HEIGHT);

  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [unitCost, setUnitCost] = useState("");

  useEffect(() => {
    if (item) {
      setLotNumber(item.lotNumber ?? "");
      setExpiryDate(item.expiryDate ?? "");
      setSerialNumber(item.serialNumber ?? "");
      setUnitCost(item.unitCost !== undefined ? String(item.unitCost) : "");
      translateY.value = withSpring(0, { damping: 20, stiffness: 200, overshootClamping: true });
    } else {
      translateY.value = withSpring(SHEET_HEIGHT, { damping: 20, stiffness: 200, overshootClamping: true });
    }
  }, [item]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSave = useCallback(() => {
    if (!item) return;
    onSave(item.id, {
      lotNumber: lotNumber.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      unitCost: unitCost.trim() ? parseFloat(unitCost) : undefined,
    });
  }, [item, lotNumber, expiryDate, serialNumber, unitCost, onSave]);

  return (
    <Animated.View
      className="absolute inset-x-0 bottom-0 bg-card rounded-t-2xl"
      style={[{ height: SHEET_HEIGHT }, sheetStyle]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <View className="items-center pt-3 pb-1">
          <View className="w-9 h-1 rounded-full bg-border" />
        </View>

        <View className="flex-row items-center px-4 pt-2 pb-4">
          <View className="flex-1">
            <Text className="text-base font-semibold text-card-foreground" numberOfLines={1}>
              {item?.name ?? ""}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              Qty: {item?.quantity ?? 0}
            </Text>
          </View>
          <Pressable
            className="w-8 h-8 rounded-full bg-muted items-center justify-center active:opacity-70"
            onPress={onClose}
          >
            <X size={16} color={mutedFg} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 16, gap: 16 }}
        >
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Lot Number
            </Text>
            <TextInput
              className="bg-muted/40 border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
              placeholder="e.g. LOT-2026-001"
              placeholderTextColor={mutedFg}
              value={lotNumber}
              onChangeText={setLotNumber}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Expiry Date
            </Text>
            <TextInput
              className="bg-muted/40 border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
              placeholder="YYYY-MM-DD"
              placeholderTextColor={mutedFg}
              value={expiryDate}
              onChangeText={setExpiryDate}
              keyboardType="numbers-and-punctuation"
              returnKeyType="next"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Serial Number{" "}
              <Text className="text-muted-foreground normal-case">(optional)</Text>
            </Text>
            <TextInput
              className="bg-muted/40 border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
              placeholder=""
              placeholderTextColor={mutedFg}
              value={serialNumber}
              onChangeText={setSerialNumber}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Unit Cost THB{" "}
              <Text className="text-muted-foreground normal-case">(optional)</Text>
            </Text>
            <TextInput
              className="bg-muted/40 border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
              placeholder="0.00"
              placeholderTextColor={mutedFg}
              value={unitCost}
              onChangeText={setUnitCost}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>

          <Pressable
            className="bg-primary rounded-xl py-4 items-center active:opacity-70 mt-2"
            onPress={handleSave}
          >
            <Text className="text-sm font-semibold text-primary-foreground">Save Details</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}
