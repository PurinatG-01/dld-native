import { View, Text } from "react-native";

interface FlashMessageProps {
  message: string;
  variant?: "error" | "success";
}

export function FlashMessage({
  message,
  variant = "error",
}: FlashMessageProps) {
  const containerStyle =
    variant === "error"
      ? "border border-destructive/20 bg-destructive/10"
      : "border border-emerald-200 bg-emerald-50";
  const textStyle =
    variant === "error" ? "text-destructive" : "text-emerald-700";

  return (
    <View className={`rounded-lg px-4 py-3 mb-4 ${containerStyle}`}>
      <Text className={`text-sm ${textStyle}`}>{message}</Text>
    </View>
  );
}
