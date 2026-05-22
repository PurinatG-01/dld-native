import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { markModalClosed } from "@/lib/scanner-state";

export default function ScannerModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    requestPermission();
  }, []);

  const handleClose = () => {
    markModalClosed();
    router.dismissTo("/(app)/dashboard");
  };

  const closeButton = (
    <TouchableOpacity
      style={[styles.closeButton, { top: insets.top + 12 }]}
      onPress={handleClose}
    >
      <X size={20} color="white" />
    </TouchableOpacity>
  );

  if (!permission || !permission.granted) {
    return (
      <View style={styles.denied}>
        {closeButton}
        <Text style={styles.deniedText}>
          Camera access is required to scan items.{"\n"}Please enable it in
          Settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />
      {closeButton}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
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
    zIndex: 10,
  },
  denied: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  deniedText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
});
