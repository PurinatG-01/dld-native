import { useEffect, useReducer, useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { markModalClosed } from "@/lib/scanner-state";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { lookupItemByBarcode } from "@/lib/services/inventory";
import { ScannerSheet } from "@/components/scanner/ScannerSheet";
import { ScannerStatusPill } from "@/components/scanner/ScannerStatusPill";
import {
  FINDER_SIZE,
  CORNER_SIZE,
  CORNER_THICKNESS,
  SHEET_TOP,
  SNAP_COLLAPSED,
} from "@/components/scanner/constants";
import type { ScanState, ScanAction, ScannedItem } from "@/components/scanner/types";

const FINDER_COLOR: Record<ScanState["status"], string> = {
  idle: "rgba(255,255,255,0.85)",
  loading: "#818cf8",
  success: "rgba(255,255,255,0.85)",
  error: "#f87171",
};

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

export default function ScannerModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scanState, dispatch] = useReducer(scanReducer, { status: "idle" });

  const translateY = useSharedValue(SNAP_COLLAPSED);
  const sweepProgress = useSharedValue(0);

  const sweepAnimatedStyle = useAnimatedStyle(() => ({
    top: interpolate(sweepProgress.value, [0, 1], [0, FINDER_SIZE]),
    opacity: interpolate(sweepProgress.value, [0, 0.08, 0.92, 1], [0, 1, 1, 0]),
  }));

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

  const finderColor = FINDER_COLOR[scanState.status];

  return (
    <View className="flex-1 bg-black">
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

      <Text style={styles.hintText}>
        {scanState.status === "loading"
          ? "Looking up item…"
          : "Align barcode within the frame"}
      </Text>

      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 12 }]}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <X size={20} color="white" />
      </TouchableOpacity>

      <ScannerStatusPill scanStatus={scanState.status} />

      <ScannerSheet
        translateY={translateY}
        items={scannedItems}
        scanState={scanState}
        onAdjustQuantity={adjustQuantity}
        bottomInset={insets.bottom}
      />
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
});
