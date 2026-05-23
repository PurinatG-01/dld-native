import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SHEET_TOP } from "./constants";
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
          className="flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5"
          style={styles.pillScanning}
        >
          <ActivityIndicator
            size="small"
            color="#818cf8"
            style={{ transform: [{ scale: 0.75 }] }}
          />
          <Text className="text-xs font-semibold" style={{ color: "#a5b4fc" }}>
            Scanning…
          </Text>
        </View>
      )}
      {scanStatus === "success" && (
        <View
          className="flex-row items-center rounded-full px-3.5 py-1.5"
          style={styles.pillAdded}
        >
          <Text className="text-xs font-semibold" style={{ color: "#4ade80" }}>
            ✓ Added
          </Text>
        </View>
      )}
      {scanStatus === "error" && (
        <View
          className="flex-row items-center rounded-full px-3.5 py-1.5"
          style={styles.pillNotFound}
        >
          <Text className="text-xs font-semibold" style={{ color: "#f87171" }}>
            ✕ Not found
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
});
