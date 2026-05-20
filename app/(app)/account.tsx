import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, Settings } from "lucide-react-native";
import { supabase } from "@/lib/supabase/client";
import { getUserProfile, type UserProfile } from "@/lib/services/user";
import { signOut } from "@/lib/services/auth";

const MUTED = "#64748b";

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setEmail(session.user.email ?? "");
      getUserProfile(session.user.id).then(setProfile);
    });
  }, []);

  const displayName = profile?.name ?? email ?? "User";
  const displayEmail = profile?.email ?? email ?? "";

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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="max-w-lg self-center w-full px-4 gap-6"
      contentContainerStyle={{ paddingTop: Math.max(insets.top, 24) + 8, paddingBottom: Math.max(insets.bottom, 16) + 49 }}
    >
      <Text className="text-2xl font-bold text-foreground">Account</Text>

      {/* Profile card */}
      <View className="bg-card border border-border rounded-2xl p-5 flex-row items-center gap-4">
        <View className="w-14 h-14 rounded-full bg-muted items-center justify-center">
          <User size={24} color={MUTED} />
        </View>
        <View className="flex-1">
          <Text
            className="font-semibold text-card-foreground"
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {displayEmail}
          </Text>
        </View>
      </View>

      {/* General section */}
      <View className="bg-card border border-border rounded-2xl overflow-hidden">
        <View className="px-5 py-3 border-b border-border">
          <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            General
          </Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center gap-3 px-5 py-4 active:bg-muted"
          activeOpacity={0.7}
        >
          <Settings size={16} color={MUTED} />
          <Text className="text-sm text-foreground">Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        onPress={handleSignOut}
        activeOpacity={0.8}
        className="border border-destructive/30 bg-destructive/5 rounded-xl py-3.5 items-center"
      >
        <Text className="text-sm font-semibold text-destructive">Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
