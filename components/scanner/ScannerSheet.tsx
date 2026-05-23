import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ScannedItemList } from "./ScannedItemList";
import { SCREEN_HEIGHT, SNAP_COLLAPSED, SNAP_EXPANDED } from "./constants";
import type { ScannedItem, ScanState } from "./types";

type Props = {
  translateY: SharedValue<number>;
  items: ScannedItem[];
  scanState: ScanState;
  onAdjustQuantity: (id: string, delta: number) => void;
  bottomInset: number;
};

export function ScannerSheet({
  translateY,
  items,
  scanState,
  onAdjustQuantity,
  bottomInset,
}: Props) {
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
        { velocity: e.velocityY, damping: 20, stiffness: 200, overshootClamping: true }
      );
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const justAddedBarcode =
    scanState.status === "success" ? scanState.barcode : null;

  return (
    <Animated.View className="bg-card absolute inset-x-0 top-0" style={[{ bottom: -SCREEN_HEIGHT }, sheetAnimatedStyle]}>
      <View
        className="rounded-t-2xl overflow-hidden bg-card"
        style={{ height: SCREEN_HEIGHT }}
      >
        <GestureDetector gesture={panGesture}>
          <View className="items-center pt-3 pb-1">
            <View className="w-9 h-1 rounded-full bg-border" />
            <View className="flex-row items-center gap-1.5 self-start px-4 pt-3 pb-1">
              <Text className="text-sm font-semibold text-card-foreground">
                Scanned Items
              </Text>
              {items.length > 0 && (
                <Text className="text-sm text-muted-foreground">
                  ({items.length})
                </Text>
              )}
            </View>
          </View>
        </GestureDetector>

        <ScannedItemList
          items={items}
          scanStatus={scanState.status}
          justAddedBarcode={justAddedBarcode}
          onAdjustQuantity={onAdjustQuantity}
          bottomInset={bottomInset}
        />
      </View>
    </Animated.View>
  );
}

