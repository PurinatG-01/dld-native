import { useReducer, useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { useColor } from "@/lib/useColor";
import { FlashMessage } from "@/components/ui/FlashMessage";
import { SessionHeader } from "@/components/inbound/SessionHeader";
import { SessionHeaderSkeleton } from "@/components/inbound/SessionHeaderSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { LineList } from "@/components/inbound/LineList";
import { LineEditor } from "@/components/inbound/LineEditor";
import {
  inboundReducer,
  initialInboundState,
  canSubmit,
} from "@/lib/inbound-reducer";
import {
  getInboundRefData,
  receiveInbound,
  type RefOption,
} from "@/lib/services/inbound";
import type { InboundLine } from "@/components/inbound/types";

export default function InboundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [state, dispatch] = useReducer(inboundReducer, initialInboundState);

  const [suppliers, setSuppliers] = useState<RefOption[]>([]);
  const [branches, setBranches] = useState<RefOption[]>([]);
  const [locations, setLocations] = useState<RefOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor: null = closed; { line } open (line null = add).
  const [editor, setEditor] = useState<{ line: InboundLine | null } | null>(
    null
  );

  // Initial load: suppliers + branches + caller's branch (locations come from
  // the branch effect once the branch is set).
  useEffect(() => {
    let cancelled = false;
    getInboundRefData()
      .then((ref) => {
        if (cancelled) return;
        setSuppliers(ref.suppliers);
        setBranches(ref.branches);
        // Caller may only write to their own branch — pre-select it.
        if (ref.branch_id) {
          dispatch({ type: "SET_BRANCH", branchId: ref.branch_id });
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Load locations whenever the selected branch changes.
  useEffect(() => {
    if (!state.branchId) {
      setLocations([]);
      return;
    }
    let cancelled = false;
    getInboundRefData(state.branchId)
      .then((ref) => !cancelled && setLocations(ref.locations))
      .catch(() => !cancelled && setLocations([]));
    return () => {
      cancelled = true;
    };
  }, [state.branchId]);

  const handleSaveLine = useCallback(
    (line: InboundLine) => {
      const exists = state.lines.some((l) => l.key === line.key);
      dispatch(
        exists
          ? { type: "UPDATE_LINE", key: line.key, patch: line }
          : { type: "ADD_LINE", line }
      );
      setEditor(null);
    },
    [state.lines]
  );

  const handleEdit = useCallback(
    (key: string) => {
      const line = state.lines.find((l) => l.key === key) ?? null;
      if (line) setEditor({ line });
    },
    [state.lines]
  );

  const handleRemove = useCallback((key: string) => {
    dispatch({ type: "REMOVE_LINE", key });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit(state)) return;
    dispatch({ type: "SUBMIT_START" });
    try {
      const result = await receiveInbound({
        supplier_id: state.supplierId,
        branch_id: state.branchId!,
        location_id: state.defaultLocationId!,
        lines: state.lines.map((l) => ({
          item_id: l.item.id,
          quantity: l.quantity,
          lot_number: l.lot_number,
          expiry_date: l.expiry_date,
          location_id: l.location_id,
        })),
      });
      Alert.alert(
        "Delivery received",
        `Inbound session ${result.inbound_session_id} recorded.`,
        [
          {
            text: "Done",
            onPress: () => {
              dispatch({ type: "RESET" });
              router.back();
            },
          },
        ]
      );
    } catch (e) {
      dispatch({
        type: "SUBMIT_ERROR",
        message: e instanceof Error ? e.message : "Failed to submit delivery.",
      });
    }
  }, [state, router]);

  const submitting = state.submit === "submitting";
  const submittable = canSubmit(state);

  // Wait for the first inbound-refdata load before showing the form.
  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <SessionHeaderSkeleton />
        <View className="px-5 pt-4 gap-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SessionHeader
        supplierId={state.supplierId}
        branchId={state.branchId}
        defaultLocationId={state.defaultLocationId}
        suppliers={suppliers}
        branches={branches}
        locations={locations}
        onSupplier={(id) => dispatch({ type: "SET_SUPPLIER", supplierId: id })}
        onBranch={(id) => dispatch({ type: "SET_BRANCH", branchId: id })}
        onDefaultLocation={(id) =>
          dispatch({ type: "SET_DEFAULT_LOCATION", locationId: id })
        }
      />

      <LineList
        lines={state.lines}
        locations={locations}
        onEdit={handleEdit}
        onRemove={handleRemove}
        bottomInset={0}
      />

      <View
        className="px-5 pt-3 border-t border-border gap-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {state.submit === "error" && state.errorMsg ? (
          <FlashMessage message={state.errorMsg} variant="error" />
        ) : null}

        <Pressable
          onPress={() => setEditor({ line: null })}
          disabled={!state.branchId}
          className="flex-row items-center justify-center gap-2 border border-border rounded-lg py-3 active:opacity-70 disabled:opacity-40"
        >
          <Plus size={16} color={useColor("primary")} />
          <Text className="text-sm font-semibold text-primary">Add line</Text>
        </Pressable>

        <Pressable
          onPress={handleSubmit}
          disabled={!submittable}
          className="flex-row items-center justify-center gap-2 bg-primary rounded-lg py-3.5 active:opacity-70 disabled:opacity-40"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={useColor("primary-foreground")} />
          ) : null}
          <Text className="text-sm font-bold text-primary-foreground">
            {submitting ? "Submitting…" : "Submit delivery"}
          </Text>
        </Pressable>
      </View>

      <LineEditor
        visible={editor !== null}
        editing={editor?.line ?? null}
        defaultLocationId={state.defaultLocationId}
        locations={locations}
        onSave={handleSaveLine}
        onCancel={() => setEditor(null)}
      />
    </View>
  );
}
