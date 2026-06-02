import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import {
  Package,
  Activity,
  TrendingUp,
  AlertCircle,
  PackagePlus,
  ChevronRight,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { StatCard } from "@/components/dashboard/StatCard";
import { MovementRow } from "@/components/activities/MovementRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { listMovements, type StockMovement } from "@/lib/services/movements";
import { getColor } from "@/lib/color";

const RECENT_LIMIT = 10;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [recent, setRecent] = useState<StockMovement[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listMovements({
      page: 1,
      limit: RECENT_LIMIT,
      sort_by: "created_at",
      sort_dir: "desc",
    })
      .then((res) => {
        if (active) setRecent(res.data);
      })
      .catch((e) => {
        if (active)
          setRecentError(
            e instanceof Error ? e.message : "Failed to load activity"
          );
      })
      .finally(() => {
        if (active) setRecentLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
        <PackagePlus size={22} color={getColor("primary-foreground")} />
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
          iconColor={getColor("primary-foreground")}
        />
        <StatCard
          label="In Stock"
          value="—"
          icon={Activity}
          bgClassName="bg-emerald-500"
          iconColor={getColor("primary-foreground")}
        />
        <StatCard
          label="Low Stock"
          value="—"
          icon={AlertCircle}
          bgClassName="bg-destructive"
          iconColor={getColor("primary-foreground")}
        />
        <StatCard
          label="Expiring Soon"
          value="—"
          icon={TrendingUp}
          bgClassName="bg-amber-500"
          iconColor={getColor("primary-foreground")}
        />
      </ScrollView>

      {/* Recent activity */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-foreground">
          Recent activity
        </Text>
        <Pressable
          onPress={() => router.push("/(app)/activities" as any)}
          className="flex-row items-center active:opacity-70"
        >
          <Text className="text-xs font-semibold text-primary">View all</Text>
          <ChevronRight size={14} color={getColor("primary")} />
        </Pressable>
      </View>

      <View className="bg-card rounded-xl border border-border overflow-hidden">
        {recentLoading ? (
          <View>
            {Array.from({ length: 4 }).map((_, i) => (
              <View
                key={i}
                className="flex-row items-center px-4 py-3 border-b border-border gap-3"
              >
                <Skeleton className="w-9 h-9 rounded-xl" />
                <View className="flex-1 gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </View>
              </View>
            ))}
          </View>
        ) : recentError ? (
          <Text className="text-sm text-muted-foreground text-center py-10 px-4">
            {recentError}
          </Text>
        ) : recent.length > 0 ? (
          recent.map((m) => <MovementRow key={m.id} movement={m} />)
        ) : (
          <View className="p-12 items-center">
            <Package size={36} color={getColor("placeholder")} />
            <Text className="text-sm font-bold text-muted-foreground mt-3">
              No recent activity
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
