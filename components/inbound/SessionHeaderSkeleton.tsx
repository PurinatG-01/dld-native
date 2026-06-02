import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

/** Placeholder for SessionHeader while inbound-refdata loads. */
export function SessionHeaderSkeleton() {
  return (
    <View className="px-5 pt-4 pb-5 gap-4 border-b border-border">
      {[0, 1, 2].map((i) => (
        <View key={i}>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </View>
      ))}
    </View>
  );
}
