import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useColor } from "@/lib/useColor";
import { SHEET_TOP, HAIRLINE_WIDTH } from "./constants";
import type { ScanStatus } from "./types";

type Props = {
  scanStatus: ScanStatus;
};

export function ScannerStatusPill({ scanStatus }: Props) {
  const pillOpacity = useSharedValue(0);

  useEffect(() => {
    pillOpacity.value = withTiming(scanStatus !== "idle" ? 1 : 0, { duration: 150 });
  }, [scanStatus]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
  }));

  return (
    <Animated.View
      className="absolute inset-x-0 items-center"
      style={[{ top: SHEET_TOP - 52 }, pillAnimatedStyle]}
      pointerEvents="none"
    >
      {scanStatus === "loading" && (
        <View
          className="flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5 bg-black/65 border-primary/60"
          style={{ borderWidth: HAIRLINE_WIDTH }}
        >
          <ActivityIndicator
            size="small"
            color={useColor("primary-light")}
            style={{ transform: [{ scale: 0.75 }] }}
          />
          <Text className="text-xs font-semibold text-primary-lighter">Scanning…</Text>
        </View>
      )}
      {scanStatus === "success" && (
        <View
          className="flex-row items-center rounded-full px-3.5 py-1.5 bg-success-muted/92 border-success"
          style={{ borderWidth: HAIRLINE_WIDTH }}
        >
          <Text className="text-xs font-semibold text-success-foreground">✓ Added</Text>
        </View>
      )}
      {scanStatus === "error" && (
        <View
          className="flex-row items-center rounded-full px-3.5 py-1.5 bg-error-muted/92 border-destructive"
          style={{ borderWidth: HAIRLINE_WIDTH }}
        >
          <Text className="text-xs font-semibold text-error-foreground">✕ Not found</Text>
        </View>
      )}
    </Animated.View>
  );
}
