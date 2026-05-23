import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
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
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
// Sheet starts translated DOWN by this amount (collapsed = camera visible above)
const SHEET_TOP = SCREEN_HEIGHT * 0.5;
const SNAP_COLLAPSED = SHEET_TOP;
const SNAP_EXPANDED = 0;

const FINDER_SIZE = 200;
const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;
const PRIMARY = "#4f46e5";

const MOCK_PRODUCTS = [
  "Wireless Headphones",
  "USB-C Cable 2m",
  "Laptop Stand",
  "Mechanical Keyboard",
  "Mouse Pad XL",
  "Webcam HD 1080p",
  "Monitor Desk Light",
  "Phone Mount Holder",
];

type ScannedItem = {
  id: string;
  barcode: string;
  name: string;
  quantity: number;
  scannedAt: Date;
};

function generateMockItem(): ScannedItem {
  const barcode = Array.from({ length: 13 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  const name = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
  return {
    id: `${Date.now()}-${Math.random()}`,
    barcode,
    name,
    quantity: 1,
    scannedAt: new Date(),
  };
}

export default function ScannerModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

  // Sheet starts at SNAP_COLLAPSED (pushed down) and animates toward 0 (full screen)
  const translateY = useSharedValue(SNAP_COLLAPSED);
  const startY = useSharedValue(0);

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
        {
          velocity: e.velocityY,
          damping: 20,
          stiffness: 200,
          overshootClamping: true,
        }
      );
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Inner view height always matches the visible sheet area so ScrollView scrolls correctly
  const innerHeightStyle = useAnimatedStyle(() => ({
    height: SCREEN_HEIGHT - translateY.value,
  }));

  useEffect(() => {
    requestPermission();
  }, []);

  const handleClose = () => {
    markModalClosed();
    router.dismissTo("/(app)/dashboard");
  };

  const handleSimulateScan = () => {
    setScannedItems((prev) => [generateMockItem(), ...prev]);
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

  return (
    <View className="flex-1 bg-black">
      {/* Layer 1: Camera — full screen */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Layer 2: Viewfinder dim overlay — full screen, finder centered in camera area */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Camera area: finder + dim strips scoped to top SHEET_TOP px */}
        <View style={{ height: SHEET_TOP }}>
          <View style={styles.dimStrip} />
          <View style={styles.finderRow}>
            <View style={styles.dimStrip} />
            <View style={styles.finderBox}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.dimStrip} />
          </View>
          <View style={styles.dimStrip} />
        </View>
        {/* Below camera area: transparent (sheet covers this) */}
      </View>

      {/* Hint text — below the finder box */}
      <Text style={styles.hintText}>Align barcode within the frame</Text>

      {/* Close button — sits on the camera layer, covered by sheet when expanded */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 12 }]}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <X size={20} color="white" />
      </TouchableOpacity>

      {/* Simulate scan — small floating pill just above sheet edge */}
      <View style={styles.simulateWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.simulateButton}
          onPress={handleSimulateScan}
          activeOpacity={0.8}
        >
          <Text className="text-white text-xs font-semibold tracking-wide">
            Simulate Scan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Layer 3: Summary sheet */}
      {/* Outer: rectangular bg-card fills corner areas so camera never bleeds through the radius */}
      <Animated.View className="bg-card" style={[styles.sheet, sheetAnimatedStyle]}>
        {/* Inner: height tracks visible sheet area so ScrollView always knows its real bounds */}
        <Animated.View className="rounded-t-2xl overflow-hidden bg-card" style={innerHeightStyle}>
        {/* Drag handle + header */}
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

        {/* Scanned items list — inventory row style */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        >
          {scannedItems.length === 0 ? (
            <Text className="text-sm text-muted-foreground text-center mt-6">
              No items scanned yet
            </Text>
          ) : (
            scannedItems.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center px-4 py-3 border-b border-border"
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
            ))
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
    borderColor: "white",
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
  hintText: {
    position: "absolute",
    left: 0,
    right: 0,
    // 12px below the bottom edge of the centered finder box
    top: (SHEET_TOP + FINDER_SIZE) / 2 + 12,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    textAlign: "center",
  },
  simulateWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    top: SHEET_TOP - 52,
    alignItems: "center",
  },
  simulateButton: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.3)",
  },
  sheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // Extends one full screen height below so spring bounce never exposes camera at the bottom
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
});
