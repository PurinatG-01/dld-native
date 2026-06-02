import { View, Text } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { getColor } from "@/lib/color";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  bgClassName?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  bgClassName = "bg-primary",
}: StatCardProps) {
  const resolvedIconColor = iconColor ?? getColor("primary-foreground");
  return (
    <View className="bg-card p-6 rounded-xl border border-border min-w-36 flex-1">
      <View
        className={`w-9 h-9 rounded-lg items-center justify-center mb-4 ${bgClassName}`}
      >
        <Icon size={20} color={resolvedIconColor} />
      </View>
      <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">
        {label}
      </Text>
      <Text className="text-2xl font-bold text-card-foreground tracking-tight">
        {value}
      </Text>
    </View>
  );
}
