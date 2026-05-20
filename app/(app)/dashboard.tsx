import { ScrollView, View, Text } from "react-native";
import {
  Package,
  Activity,
  TrendingUp,
  AlertCircle,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatCard } from "@/components/dashboard/StatCard";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
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
          iconColor="#ffffff"
        />
        <StatCard
          label="In Stock"
          value="—"
          icon={Activity}
          bgClassName="bg-emerald-500"
          iconColor="#ffffff"
        />
        <StatCard
          label="Low Stock"
          value="—"
          icon={AlertCircle}
          bgClassName="bg-destructive"
          iconColor="#ffffff"
        />
        <StatCard
          label="Expiring Soon"
          value="—"
          icon={TrendingUp}
          bgClassName="bg-amber-500"
          iconColor="#ffffff"
        />
      </ScrollView>

      <View className="bg-card rounded-xl border border-border p-12 items-center">
        <Package size={36} color="#94a3b8" />
        <Text className="text-sm font-bold text-muted-foreground mt-3">
          Stock table — connecting to real data next
        </Text>
      </View>
    </ScrollView>
  );
}
