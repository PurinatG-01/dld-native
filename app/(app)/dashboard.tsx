import { ScrollView, View, Text, Pressable } from "react-native";
import {
  Package,
  Activity,
  TrendingUp,
  AlertCircle,
  PackagePlus,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatCard } from "@/components/dashboard/StatCard";
import { useColor } from "@/lib/useColor";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6"
      contentContainerStyle={{ paddingTop: Math.max(insets.top, 24) }}
    >
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground tracking-tight">
          Dashboard
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          Live inventory overview
        </Text>
      </View>

      <Pressable
        onPress={() => router.push("/inbound")}
        className="flex-row items-center gap-3 bg-primary rounded-xl px-4 py-4 mb-6 active:opacity-70"
      >
        <PackagePlus size={22} color={useColor("primary-foreground")} />
        <View className="flex-1">
          <Text className="text-sm font-bold text-primary-foreground">
            Receive delivery
          </Text>
          <Text className="text-xs text-primary-foreground/80 mt-0.5">
            Record incoming stock
          </Text>
        </View>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-4 pb-1"
        className="mb-6"
      >
        <StatCard
          label="Total Items"
          value="—"
          icon={Package}
          bgClassName="bg-primary"
          iconColor={useColor("primary-foreground")}
        />
        <StatCard
          label="In Stock"
          value="—"
          icon={Activity}
          bgClassName="bg-emerald-500"
          iconColor={useColor("primary-foreground")}
        />
        <StatCard
          label="Low Stock"
          value="—"
          icon={AlertCircle}
          bgClassName="bg-destructive"
          iconColor={useColor("primary-foreground")}
        />
        <StatCard
          label="Expiring Soon"
          value="—"
          icon={TrendingUp}
          bgClassName="bg-amber-500"
          iconColor={useColor("primary-foreground")}
        />
      </ScrollView>

      <View className="bg-card rounded-xl border border-border p-12 items-center">
        <Package size={36} color={useColor("placeholder")} />
        <Text className="text-sm font-bold text-muted-foreground mt-3">
          Stock table — connecting to real data next
        </Text>
      </View>
    </ScrollView>
  );
}
