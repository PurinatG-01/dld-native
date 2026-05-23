import { useEffect, useReducer, useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
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
import { useColor } from "@/lib/useColor";
import type { ScanState, ScanAction, ScannedItem, ScanStatus } from "@/components/scanner/types";

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

  const finderColorMap: Record<ScanStatus, string> = {
    idle: "rgba(255,255,255,0.85)",
    loading: useColor("primary-light"),
    success: "rgba(255,255,255,0.85)",
    error: useColor("error-foreground"),
  };

  const translateY = useSharedValue(SNAP_COLLAPSED);
  const sweepProgress = useSharedValue(0);

  const sweepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(sweepProgress.value, [0, 1], [0, FINDER_SIZE]) }],
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
          className="absolute right-5 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          style={{ top: insets.top + 12 }}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <X size={20} color={useColor("primary-foreground")} />
        </TouchableOpacity>
        <Text className="text-white text-base text-center leading-6">
          Camera access is required to scan items.{"\n"}Please enable it in
          Settings.
        </Text>
      </View>
    );
  }

  const finderColor = finderColorMap[scanState.status];
  const primaryLight = useColor("primary-light");

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Dim overlay + viewfinder */}
      <View className="absolute inset-0" pointerEvents="none">
        <View style={{ height: SHEET_TOP }}>
          <View className="flex-1 bg-black/60" />
          <View className="flex-row" style={{ height: FINDER_SIZE }}>
            <View className="flex-1 bg-black/60" />
            <View style={{ width: FINDER_SIZE, height: FINDER_SIZE }}>
              <View
                className="absolute top-0 left-0"
                style={{ width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: finderColor }}
              />
              <View
                className="absolute top-0 right-0"
                style={{ width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: finderColor }}
              />
              <View
                className="absolute bottom-0 left-0"
                style={{ width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: finderColor }}
              />
              <View
                className="absolute bottom-0 right-0"
                style={{ width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: finderColor }}
              />
              {scanState.status === "loading" && (
                <Animated.View
                  className="absolute left-1 right-1 bg-primary-light"
                  style={[{ height: 1.5, shadowColor: primaryLight, shadowOpacity: 0.8, shadowRadius: 4 }, sweepAnimatedStyle]}
                />
              )}
            </View>
            <View className="flex-1 bg-black/60" />
          </View>
          <View className="flex-1 bg-black/60" />
        </View>
      </View>

      <Text
        className="absolute inset-x-0 text-xs text-center text-white/75"
        style={{ top: (SHEET_TOP + FINDER_SIZE) / 2 + 12 }}
      >
        {scanState.status === "loading"
          ? "Looking up item…"
          : "Align barcode within the frame"}
      </Text>

      <Pressable
        className="absolute right-5 w-10 h-10 rounded-full bg-black/50 items-center justify-center active:opacity-70"
        style={{ top: insets.top + 12 }}
        onPress={handleClose}
      >
        <X size={20} color={useColor("primary-foreground")} />
      </Pressable>

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
