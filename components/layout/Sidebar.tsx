import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import {
  LayoutDashboard,
  Package,
  Stethoscope,
  User,
  LogOut,
} from "lucide-react-native";
import { signOut } from "@/lib/services/auth";

const NAV_ITEMS = [
  { href: "/(app)/dashboard", segment: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/(app)/inventory", segment: "inventory", icon: Package, label: "Inventory" },
] as const;

interface SidebarProps {
  displayName: string;
  email: string;
}

export function Sidebar({ displayName, email }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  return (
    <View className="w-64 bg-card border-r border-border flex-col h-full">
      <View className="p-6 flex-row items-center gap-3" style={{ paddingTop: Math.max(insets.top, 24) }}>
        <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
          <Stethoscope size={20} color="#ffffff" />
        </View>
        <View>
          <Text className="font-bold text-base text-card-foreground leading-tight">
            DLD
          </Text>
          <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Clinical Ops
          </Text>
        </View>
      </View>

      <View className="flex-1 px-4 gap-1 mt-4">
        {NAV_ITEMS.map(({ href, segment, icon: Icon, label }) => {
          const active = pathname.includes(segment);
          return (
            <TouchableOpacity
              key={href}
              onPress={() => router.push(href as any)}
              activeOpacity={0.7}
              className={`flex-row items-center gap-3 px-3 py-3 rounded-xl ${
                active ? "bg-primary/10" : ""
              }`}
            >
              <Icon size={20} color={active ? "#4f46e5" : "#64748b"} />
              <Text
                className={`text-sm ${
                  active
                    ? "text-primary font-semibold"
                    : "text-muted-foreground font-medium"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="px-4 pt-4 mt-auto border-t border-border" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-8 h-8 rounded-full bg-muted items-center justify-center">
            <User size={14} color="#64748b" />
          </View>
          <View className="flex-1">
            <Text
              className="text-xs font-bold text-foreground"
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              className="text-[10px] text-muted-foreground"
              numberOfLines={1}
            >
              {email}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.7}
          className="flex-row items-center gap-2 px-3 py-2 rounded-xl"
        >
          <LogOut size={14} color="#ef4444" />
          <Text className="text-sm text-destructive font-medium">Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
