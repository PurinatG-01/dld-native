import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, ChevronDown } from "lucide-react-native";
import { useColor } from "@/lib/useColor";
import { supabase } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/services/user";
import {
  listBranchLocations,
  listSuppliers,
  type BranchLocationItem,
  type SupplierItem,
} from "@/lib/services/inventory";
import { markModalClosed } from "@/lib/scanner-state";

export default function InboundHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mutedFg = useColor("muted-foreground");

  const [locations, setLocations] = useState<BranchLocationItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<BranchLocationItem | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);
  const [referenceNote, setReferenceNote] = useState("");

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const profile = await getUserProfile(session.user.id);
      if (!profile) throw new Error("User profile not found");
      const [locs, sups] = await Promise.all([
        listBranchLocations(profile.branch_id),
        listSuppliers(),
      ]);
      setLocations(locs);
      setSuppliers(sups);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClose = useCallback(() => {
    markModalClosed();
    router.dismissTo("/(app)/dashboard");
  }, [router]);

  const handleStartScanning = useCallback(() => {
    if (!selectedLocation) return;
    router.push({
      pathname: "/scanner-modal",
      params: {
        locationId: selectedLocation.id,
        locationName: selectedLocation.name,
        ...(selectedSupplier ? { supplierId: selectedSupplier.id } : {}),
        ...(referenceNote.trim() ? { referenceNote: referenceNote.trim() } : {}),
      },
    });
  }, [router, selectedLocation, selectedSupplier, referenceNote]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center px-4 mb-8">
        <Text className="flex-1 text-lg font-semibold text-foreground">New Inbound</Text>
        <Pressable
          className="w-9 h-9 rounded-full bg-muted items-center justify-center active:opacity-70"
          onPress={handleClose}
        >
          <X size={18} color={mutedFg} />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : loadError ? (
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Text className="text-sm text-muted-foreground text-center">{loadError}</Text>
          <Pressable
            className="px-5 py-2.5 bg-primary rounded-xl active:opacity-70"
            onPress={loadData}
          >
            <Text className="text-sm font-semibold text-primary-foreground">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View className="px-4 gap-5">
          {/* Location */}
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Storing Into <Text className="text-destructive">*</Text>
            </Text>
            <Pressable
              className="flex-row items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-3.5 active:opacity-70"
              onPress={() => setShowLocationPicker(true)}
            >
              <Text
                className={
                  selectedLocation
                    ? "text-sm text-foreground"
                    : "text-sm text-muted-foreground"
                }
              >
                {selectedLocation?.name ?? "Select location…"}
              </Text>
              <ChevronDown size={16} color={mutedFg} />
            </Pressable>
          </View>

          {/* Supplier */}
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Supplier{" "}
              <Text className="text-muted-foreground normal-case">(optional)</Text>
            </Text>
            <Pressable
              className="flex-row items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-3.5 active:opacity-70"
              onPress={() => setShowSupplierPicker(true)}
            >
              <Text
                className={
                  selectedSupplier
                    ? "text-sm text-foreground"
                    : "text-sm text-muted-foreground"
                }
              >
                {selectedSupplier?.name ?? "Select supplier…"}
              </Text>
              <ChevronDown size={16} color={mutedFg} />
            </Pressable>
          </View>

          {/* Reference note */}
          <View className="gap-1.5">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Reference / PO Note{" "}
              <Text className="text-muted-foreground normal-case">(optional)</Text>
            </Text>
            <TextInput
              className="bg-muted/40 border border-border rounded-xl px-4 py-3.5 text-sm text-foreground"
              placeholder="e.g. PO-2026-0123"
              placeholderTextColor={mutedFg}
              value={referenceNote}
              onChangeText={setReferenceNote}
              returnKeyType="done"
            />
          </View>

          {/* CTA */}
          <Pressable
            className="bg-primary rounded-xl py-4 items-center active:opacity-70 disabled:opacity-40"
            disabled={!selectedLocation}
            onPress={handleStartScanning}
          >
            <Text className="text-sm font-semibold text-primary-foreground">
              Start Scanning
            </Text>
          </Pressable>
        </View>
      )}

      {/* Location picker modal */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowLocationPicker(false)}
        >
          <View
            className="bg-card rounded-t-2xl"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="items-center pt-3 pb-2">
              <View className="w-9 h-1 rounded-full bg-border" />
            </View>
            <Text className="text-sm font-semibold text-card-foreground px-4 pb-3">
              Select Location
            </Text>
            <FlatList
              data={locations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  className="flex-row items-center px-4 py-4 border-b border-border active:bg-muted/50"
                  onPress={() => {
                    setSelectedLocation(item);
                    setShowLocationPicker(false);
                  }}
                >
                  <Text className="flex-1 text-sm text-card-foreground">{item.name}</Text>
                  <Text className="text-xs text-muted-foreground capitalize ml-2">
                    {item.type}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Supplier picker modal */}
      <Modal
        visible={showSupplierPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSupplierPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowSupplierPicker(false)}
        >
          <View
            className="bg-card rounded-t-2xl"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="items-center pt-3 pb-2">
              <View className="w-9 h-1 rounded-full bg-border" />
            </View>
            <Text className="text-sm font-semibold text-card-foreground px-4 pb-3">
              Select Supplier
            </Text>
            {selectedSupplier !== null && (
              <Pressable
                className="flex-row items-center px-4 py-4 border-b border-border active:bg-muted/50"
                onPress={() => {
                  setSelectedSupplier(null);
                  setShowSupplierPicker(false);
                }}
              >
                <Text className="text-sm text-muted-foreground">None</Text>
              </Pressable>
            )}
            <FlatList
              data={suppliers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  className="flex-row items-center px-4 py-4 border-b border-border active:bg-muted/50"
                  onPress={() => {
                    setSelectedSupplier(item);
                    setShowSupplierPicker(false);
                  }}
                >
                  <Text className="text-sm text-card-foreground">{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
