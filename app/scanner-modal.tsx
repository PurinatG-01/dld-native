import { useEffect, useReducer, useCallback, useState, useRef } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Flashlight, FlashlightOff } from "lucide-react-native";
import { markModalClosed, setScanBatchResult } from "@/lib/scanner-state";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { lookupItemByBarcode } from "@/lib/services/inventory";
import { resolveScannedBarcodes } from "@/lib/services/inbound";
import { makeLineKey } from "@/lib/inbound-reducer";
import { ScannerSheet } from "@/components/scanner/ScannerSheet";
import { ScannerStatusPill } from "@/components/scanner/ScannerStatusPill";
import {
  FINDER_SIZE,
  CORNER_SIZE,
  CORNER_THICKNESS,
  SHEET_TOP,
  SNAP_COLLAPSED,
} from "@/components/scanner/constants";
import { getColor } from "@/lib/color";
import type {
  ScanState,
  ScanAction,
  ScannedItem,
  ScanStatus,
} from "@/components/scanner/types";
import type { InboundLine } from "@/components/inbound/types";

// Barcode symbologies we decode. GS1 DataMatrix (2D) is preferred over linear
// codes when both are seen in the same frame (see the collect-window below).
const BARCODE_TYPES = [
  "datamatrix",
  "code128",
  "ean13",
  "upc_a",
  "upc_e",
] as const;
// Codes decoded within this window are collapsed to one scan, preferring 2D.
const SCAN_COLLECT_MS = 150;

// Dev-only fixtures for the simulate-scan button (also gated by __DEV__);
// empty in production so the data never ships.
const MOCK_SCAN_ITEMS = __DEV__
  ? ([
      { barcode: "MOCK-001", name: "Amoxicillin 500mg" },
      { barcode: "MOCK-002", name: "Nitrile Gloves (Box)" },
      { barcode: "MOCK-003", name: "Dental Mirror #5" },
      { barcode: "MOCK-004", name: "Composite Resin A2" },
      { barcode: "MOCK-005", name: "Surgical Mask (50-pack)" },
    ] as const)
  : [];

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

/** Increment an existing scanned barcode's qty, or prepend a new entry. */
function upsertScan(
  prev: ScannedItem[],
  barcode: string,
  name: string
): ScannedItem[] {
  const existing = prev.find((i) => i.barcode === barcode);
  if (existing) {
    return prev.map((i) =>
      i.barcode === barcode ? { ...i, quantity: i.quantity + 1 } : i
    );
  }
  return [
    {
      id: `${Date.now()}-${Math.random()}`,
      barcode,
      name,
      quantity: 1,
      scannedAt: new Date(),
    },
    ...prev,
  ];
}

export default function ScannerModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  // Inbound batch mode: scan raw barcodes, then resolve the whole batch on
  // commit and hand the lines back to the inbound form.
  const isInbound = mode === "inbound";

  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scanState, dispatch] = useReducer(scanReducer, { status: "idle" });
  const [torchOn, setTorchOn] = useState(false);
  const [committing, setCommitting] = useState(false);
  const mockIndexRef = useRef(0);

  // Collect-window buffer: groups codes from one physical read so a GS1 2D
  // code wins over a linear one in the same frame.
  const scanBufferRef = useRef<{ data: string; type: string }[]>([]);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finderColorMap: Record<ScanStatus, string> = {
    idle: "rgba(255,255,255,0.85)",
    loading: getColor("primary-light"),
    success: "rgba(255,255,255,0.85)",
    error: getColor("error-foreground"),
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

  // Clear any pending collect-window timer on unmount.
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, []);

  // Process one decoded barcode. Inbound mode records it raw (no lookup);
  // default mode resolves it live against inventory.
  const processScan = useCallback(
    (data: string) => {
      dispatch({ type: "SCAN_START", barcode: data });

      if (isInbound) {
        setScannedItems((prev) => upsertScan(prev, data, ""));
        dispatch({ type: "SCAN_SUCCESS", barcode: data });
        return;
      }

      lookupItemByBarcode(data)
        .then((inventoryItem) => {
          if (!inventoryItem) {
            dispatch({ type: "SCAN_ERROR", barcode: data });
            return;
          }
          setScannedItems((prev) => upsertScan(prev, data, inventoryItem.name));
          dispatch({ type: "SCAN_SUCCESS", barcode: data });
        })
        .catch(() => dispatch({ type: "SCAN_ERROR", barcode: data }));
    },
    [isInbound]
  );

  const flushScanBuffer = useCallback(() => {
    const buf = scanBufferRef.current;
    scanBufferRef.current = [];
    scanTimerRef.current = null;
    if (buf.length === 0) return;
    // Prefer a 2D (GS1 DataMatrix) read over a linear one in the same frame.
    const preferred = buf.find((b) => b.type === "datamatrix") ?? buf[0];
    processScan(preferred.data);
  }, [processScan]);

  const handleBarcodeScanned = useCallback(
    ({ data, type }: { data: string; type: string }) => {
      if (scanState.status !== "idle") return;
      scanBufferRef.current.push({ data, type });
      if (!scanTimerRef.current) {
        scanTimerRef.current = setTimeout(flushScanBuffer, SCAN_COLLECT_MS);
      }
    },
    [scanState.status, flushScanBuffer]
  );

  const handleSimulateScan = useCallback(() => {
    if (!__DEV__ || scanState.status !== "idle") return;
    const mock = MOCK_SCAN_ITEMS[mockIndexRef.current % MOCK_SCAN_ITEMS.length];
    mockIndexRef.current += 1;

    dispatch({ type: "SCAN_START", barcode: mock.barcode });

    setTimeout(() => {
      setScannedItems((prev) =>
        upsertScan(prev, mock.barcode, isInbound ? "" : mock.name)
      );
      dispatch({ type: "SCAN_SUCCESS", barcode: mock.barcode });
    }, 600);
  }, [scanState.status, isInbound]);

  const handleClose = useCallback(() => {
    const dismiss = () => {
      markModalClosed();
      // Inbound mode was pushed over the inbound screen — go back to it.
      // Default mode opened over the dashboard tab.
      if (isInbound) router.back();
      else router.dismissTo("/(app)/dashboard");
    };
    if (scannedItems.length === 0) {
      dismiss();
      return;
    }
    Alert.alert("Exit scanner?", "Scanned items won't be saved.", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", style: "destructive", onPress: dismiss },
    ]);
  }, [router, scannedItems.length, isInbound]);

  // Inbound commit: resolve the scanned batch, build lines (ready/error),
  // hand them to the inbound screen, and dismiss back to it.
  const handleCommit = useCallback(async () => {
    if (committing || scannedItems.length === 0) return;
    setCommitting(true);
    try {
      const uniqueBarcodes = [...new Set(scannedItems.map((i) => i.barcode))];
      const resolved = await resolveScannedBarcodes(uniqueBarcodes);
      const byBarcode = new Map(resolved.map((r) => [r.barcode, r.item]));

      const lines: InboundLine[] = scannedItems.map((si) => {
        const item = byBarcode.get(si.barcode) ?? null;
        return {
          key: makeLineKey(),
          item,
          quantity: si.quantity,
          lot_number: null,
          expiry_date: null,
          // Session default location is applied by the inbound reducer.
          location_id: null,
          barcode: si.barcode,
          status: item ? "ready" : "error",
        };
      });

      setScanBatchResult(lines);
      markModalClosed();
      router.back();
    } catch {
      setCommitting(false);
      Alert.alert(
        "Couldn't add items",
        "Failed to resolve the scanned items. Please try again."
      );
    }
  }, [committing, scannedItems, router]);

  const adjustQuantity = useCallback((id: string, delta: number) => {
    setScannedItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  if (!permission || !permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Pressable
          className="absolute right-5 w-10 h-10 rounded-full bg-black/50 items-center justify-center active:opacity-70"
          style={{ top: insets.top + 12 }}
          onPress={handleClose}
        >
          <X size={20} color={getColor("primary-foreground")} />
        </Pressable>
        <Text className="text-white text-base text-center leading-6">
          Camera access is required to scan items.{"\n"}Please enable it in
          Settings.
        </Text>
      </View>
    );
  }

  // Resolving phase: full-screen loading while the committed batch is looked up.
  if (committing) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6 gap-4">
        <ActivityIndicator size="large" color={getColor("primary-light")} />
        <Text className="text-white text-base text-center">
          Resolving {scannedItems.length}{" "}
          {scannedItems.length === 1 ? "item" : "items"}…
        </Text>
      </View>
    );
  }

  const finderColor = finderColorMap[scanState.status];
  const primaryLight = getColor("primary-light");

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
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
          ? isInbound
            ? "Recording…"
            : "Looking up item…"
          : "Align barcode within the frame"}
      </Text>

      {__DEV__ && (
        <Pressable
          onPress={handleSimulateScan}
          disabled={scanState.status !== "idle"}
          className="absolute self-center px-4 py-1.5 rounded-full bg-black/50 border border-white/20 active:opacity-70 disabled:opacity-40"
          style={{ top: (SHEET_TOP + FINDER_SIZE) / 2 + 36 }}
        >
          <Text className="text-xs font-semibold text-white/80">Simulate scan</Text>
        </Pressable>
      )}

      {/* Torch toggle */}
      <Pressable
        className="absolute left-5 w-10 h-10 rounded-full bg-black/50 items-center justify-center active:opacity-70"
        style={{ top: insets.top + 12 }}
        onPress={() => setTorchOn((on) => !on)}
      >
        {torchOn ? (
          <Flashlight size={20} color={getColor("primary-foreground")} />
        ) : (
          <FlashlightOff size={20} color={getColor("primary-foreground")} />
        )}
      </Pressable>

      <Pressable
        className="absolute right-5 w-10 h-10 rounded-full bg-black/50 items-center justify-center active:opacity-70"
        style={{ top: insets.top + 12 }}
        onPress={handleClose}
      >
        <X size={20} color={getColor("primary-foreground")} />
      </Pressable>

      <ScannerStatusPill scanStatus={scanState.status} />

      <ScannerSheet
        translateY={translateY}
        items={scannedItems}
        scanState={scanState}
        onAdjustQuantity={adjustQuantity}
        bottomInset={isInbound ? insets.bottom + 72 : insets.bottom}
        rawMode={isInbound}
      />

      {/* Inbound commit bar — fixed to the screen bottom, above the sheet. */}
      {isInbound ? (
        <View
          className="absolute inset-x-0 bottom-0 px-5 pt-3 border-t border-border bg-card"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Pressable
            onPress={handleCommit}
            disabled={scannedItems.length === 0}
            className="flex-row items-center justify-center bg-primary rounded-lg py-3.5 active:opacity-70 disabled:opacity-40"
          >
            <Text className="text-sm font-bold text-primary-foreground">
              {scannedItems.length > 0
                ? `Add ${scannedItems.length} ${scannedItems.length === 1 ? "item" : "items"} to delivery`
                : "Add to delivery"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
