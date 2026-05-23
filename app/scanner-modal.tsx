import { useEffect, useReducer, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Plus, Minus, Package } from "lucide-react-native";
import { markModalClosed } from "@/lib/scanner-state";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { lookupItemByBarcode } from "@/lib/services/inventory";
import { Skeleton } from "@/components/ui/Skeleton";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_TOP = SCREEN_HEIGHT * 0.5;
const SNAP_COLLAPSED = SHEET_TOP;
const SNAP_EXPANDED = 0;

const FINDER_SIZE = 200;
const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;
const PRIMARY = "#4f46e5";

const FINDER_COLOR: Record<ScanStatus, string> = {
  idle: "rgba(255,255,255,0.85)",
  loading: "#818cf8",
  success: "rgba(255,255,255,0.85)",
  error: "#f87171",
};

// --- Types ---

type ScanStatus = "idle" | "loading" | "success" | "error";

type ScannedItem = {
  id: string;
  barcode: string;
  name: string;
  quantity: number;
  scannedAt: Date;
};

type ScanState =
  | { status: "idle" }
  | { status: "loading"; barcode: string }
  | { status: "success"; barcode: string }
  | { status: "error"; barcode: string };

type ScanAction =
  | { type: "SCAN_START"; barcode: string }
  | { type: "SCAN_SUCCESS"; barcode: string }
  | { type: "SCAN_ERROR"; barcode: string }
  | { type: "SCAN_RESET" };

// --- Reducer ---

function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case "SCAN_START":
      if (state.status !== "idle") return state;
      return { status: "loading", barcode: action.barcode };
    case "SCAN_SUCCESS":
      if (state.status !== "loading") return state;
      return { status: "success", barcode: action.barcode };
    case "SCAN_ERROR":
      if (state.status !== "loading") return state;
      return { status: "error", barcode: action.barcode };
    case "SCAN_RESET":
      return { status: "idle" };
    default:
      return state;
  }
}

// --- Component ---

export default function ScannerModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scanState, dispatch] = useReducer(scanReducer, { status: "idle" });

  const translateY = useSharedValue(SNAP_COLLAPSED);
  const startY = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const sweepProgress = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateY.value = Math.max(
        SNAP_EXPANDED,
        Math.min(SNAP_COLLAPSED, startY.value + e.translationY)
      );
    })
    .onEnd((e) => {
      const shouldExpand =
        e.velocityY < -500 || translateY.value < SNAP_COLLAPSED / 2;
      translateY.value = withSpring(
        shouldExpand ? SNAP_EXPANDED : SNAP_COLLAPSED,
        { velocity: e.velocityY, damping: 20, stiffness: 200, overshootClamping: true }
      );
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const innerHeightStyle = useAnimatedStyle(() => ({
    height: SCREEN_HEIGHT - translateY.value,
  }));

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
  }));

  const sweepAnimatedStyle = useAnimatedStyle(() => ({
    top: interpolate(sweepProgress.value, [0, 1], [0, FINDER_SIZE]),
    opacity: interpolate(sweepProgress.value, [0, 0.08, 0.92, 1], [0, 1, 1, 0]),
  }));

  // Pill fade in/out
  useEffect(() => {
    pillOpacity.value = withTiming(scanState.status !== "idle" ? 1 : 0, {
      duration: 150,
    });
  }, [scanState.status]);

  // Sweep line while loading
  useEffect(() => {
    if (scanState.status === "loading") {
      sweepProgress.value = 0;
      sweepProgress.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    } else {
      sweepProgress.value = 0;
    }
  }, [scanState.status]);

  // Auto-reset after success/error
  useEffect(() => {
    if (scanState.status === "success") {
      const id = setTimeout(() => dispatch({ type: "SCAN_RESET" }), 1000);
      return () => clearTimeout(id);
    }
    if (scanState.status === "error") {
      const id = setTimeout(() => dispatch({ type: "SCAN_RESET" }), 1500);
      return () => clearTimeout(id);
    }
  }, [scanState.status]);

  useEffect(() => {
    requestPermission();
  }, []);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanState.status !== "idle") return;
      dispatch({ type: "SCAN_START", barcode: data });

      lookupItemByBarcode(data)
        .then((inventoryItem) => {
          if (!inventoryItem) {
            dispatch({ type: "SCAN_ERROR", barcode: data });
            return;
          }
          setScannedItems((prev) => {
            const existing = prev.find((i) => i.barcode === data);
            if (existing) {
              return prev.map((i) =>
                i.barcode === data ? { ...i, quantity: i.quantity + 1 } : i
              );
            }
            return [
              {
                id: `${Date.now()}-${Math.random()}`,
                barcode: data,
                name: inventoryItem.name,
                quantity: 1,
                scannedAt: new Date(),
              },
              ...prev,
            ];
          });
          dispatch({ type: "SCAN_SUCCESS", barcode: data });
        })
        .catch(() => dispatch({ type: "SCAN_ERROR", barcode: data }));
    },
    [scanState.status]
  );

  const handleClose = () => {
    markModalClosed();
    router.dismissTo("/(app)/dashboard");
  };

  const adjustQuantity = (id: string, delta: number) => {
    setScannedItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const finderColor = FINDER_COLOR[scanState.status];

  if (!permission || !permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 12 }]}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <X size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-base text-center leading-6">
          Camera access is required to scan items.{"\n"}Please enable it in
          Settings.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Camera — full screen */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Dim overlay + viewfinder */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ height: SHEET_TOP }}>
          <View style={styles.dimStrip} />
          <View style={styles.finderRow}>
            <View style={styles.dimStrip} />
            <View style={styles.finderBox}>
              <View style={[styles.corner, styles.cornerTL, { borderColor: finderColor }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: finderColor }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: finderColor }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: finderColor }]} />
              {scanState.status === "loading" && (
                <Animated.View style={[styles.sweepLine, sweepAnimatedStyle]} />
              )}
            </View>
            <View style={styles.dimStrip} />
          </View>
          <View style={styles.dimStrip} />
        </View>
      </View>

      {/* Hint text */}
      <Text style={styles.hintText}>
        {scanState.status === "loading"
          ? "Looking up item…"
          : "Align barcode within the frame"}
      </Text>

      {/* Close button */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 12 }]}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <X size={20} color="white" />
      </TouchableOpacity>

      {/* Status pill */}
      <Animated.View style={[styles.pillWrapper, pillAnimatedStyle]} pointerEvents="none">
        {scanState.status === "loading" && (
          <View className="flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5" style={styles.pillScanning}>
            <ActivityIndicator size="small" color="#818cf8" style={{ transform: [{ scale: 0.75 }] }} />
            <Text className="text-xs font-semibold" style={{ color: "#a5b4fc" }}>Scanning…</Text>
          </View>
        )}
        {scanState.status === "success" && (
          <View className="flex-row items-center rounded-full px-3.5 py-1.5" style={styles.pillAdded}>
            <Text className="text-xs font-semibold" style={{ color: "#4ade80" }}>✓ Added</Text>
          </View>
        )}
        {scanState.status === "error" && (
          <View className="flex-row items-center rounded-full px-3.5 py-1.5" style={styles.pillNotFound}>
            <Text className="text-xs font-semibold" style={{ color: "#f87171" }}>✕ Not found</Text>
          </View>
        )}
      </Animated.View>

      {/* Summary sheet */}
      <Animated.View className="bg-card" style={[styles.sheet, sheetAnimatedStyle]}>
        <Animated.View
          className="rounded-t-2xl overflow-hidden bg-card"
          style={innerHeightStyle}
        >
          <GestureDetector gesture={panGesture}>
            <View className="items-center pt-3 pb-1">
              <View className="w-9 h-1 rounded-full bg-border" />
              <View className="flex-row items-center gap-1.5 self-start px-4 pt-3 pb-1">
                <Text className="text-sm font-semibold text-card-foreground">
                  Scanned Items
                </Text>
                {scannedItems.length > 0 && (
                  <Text className="text-sm text-muted-foreground">
                    ({scannedItems.length})
                  </Text>
                )}
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          >
            {/* Skeleton row while loading */}
            {scanState.status === "loading" && (
              <View className="flex-row items-center px-4 py-3 border-b border-border gap-3">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <View className="flex-1 gap-1.5">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/3" />
                </View>
                <Skeleton className="w-14 h-7 rounded-full" />
              </View>
            )}

            {scannedItems.length === 0 && scanState.status !== "loading" ? (
              <Text className="text-sm text-muted-foreground text-center mt-6">
                No items scanned yet
              </Text>
            ) : (
              scannedItems.map((item) => {
                const isJustAdded =
                  scanState.status === "success" &&
                  item.barcode === scanState.barcode;
                return (
                  <View
                    key={item.id}
                    className="flex-row items-center px-4 py-3 border-b border-border"
                    style={isJustAdded ? styles.rowSuccess : undefined}
                  >
                    <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
                      <Package size={18} color={PRIMARY} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text
                        className="text-sm font-medium text-card-foreground"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {item.barcode}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2 ml-3">
                      <TouchableOpacity
                        className="w-7 h-7 rounded-full bg-muted items-center justify-center"
                        onPress={() => adjustQuantity(item.id, -1)}
                        activeOpacity={0.7}
                      >
                        <Minus size={13} color="#64748b" />
                      </TouchableOpacity>
                      <Text className="text-sm font-semibold text-card-foreground w-5 text-center">
                        {item.quantity}
                      </Text>
                      <TouchableOpacity
                        className="w-7 h-7 rounded-full bg-primary items-center justify-center"
                        onPress={() => adjustQuantity(item.id, 1)}
                        activeOpacity={0.7}
                      >
                        <Plus size={13} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dimStrip: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  finderRow: {
    flexDirection: "row",
    height: FINDER_SIZE,
  },
  finderBox: {
    width: FINDER_SIZE,
    height: FINDER_SIZE,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  sweepLine: {
    position: "absolute",
    left: 4,
    right: 4,
    height: 1.5,
    backgroundColor: "#818cf8",
    shadowColor: "#818cf8",
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  hintText: {
    position: "absolute",
    left: 0,
    right: 0,
    top: (SHEET_TOP + FINDER_SIZE) / 2 + 12,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    textAlign: "center",
  },
  pillWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: SHEET_TOP - 52,
    alignItems: "center",
  },
  pillScanning: {
    backgroundColor: "rgba(0,0,0,0.65)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(79,70,229,0.6)",
  },
  pillAdded: {
    backgroundColor: "rgba(5,46,22,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#16a34a",
  },
  pillNotFound: {
    backgroundColor: "rgba(45,10,10,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dc2626",
  },
  sheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: -SCREEN_HEIGHT,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowSuccess: {
    backgroundColor: "rgba(5,46,22,0.2)",
    borderLeftWidth: 2,
    borderLeftColor: "#16a34a",
  },
});
