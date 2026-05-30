import { useCallback } from "react";
import { View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { consumeModalOpened, markModalOpened } from "@/lib/scanner-state";

export default function ScannerTab() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (consumeModalOpened()) {
        router.navigate("/(app)/dashboard");
        return;
      }
      markModalOpened();
      router.push("/inbound-header");
    }, [router])
  );

  return <View style={{ flex: 1 }} />;
}
