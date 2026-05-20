import { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs, Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { getUserProfile, type UserProfile } from "@/lib/services/user";
import { Sidebar } from "@/components/layout/Sidebar";
import { LayoutDashboard, Package, UserCircle } from "lucide-react-native";

const BREAKPOINT = 768;

const COLORS = {
  primary: "#4f46e5",
  muted: "#64748b",
  card: "#ffffff",
  border: "#e2e8f0",
};

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) getUserProfile(session.user.id).then(setProfile);
      })
      .catch(() => setSession(null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) getUserProfile(session.user.id).then(setProfile);
        else setProfile(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <View style={{ flex: 1, backgroundColor: "#f8fafc" }} />;
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  const displayName = profile?.name ?? session.user.email ?? "User";
  const email = profile?.email ?? session.user.email ?? "";

  // iPad wide: sidebar drives navigation, tab bar is hidden
  if (isWide) {
    return (
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#f8fafc" }}>
        <Sidebar displayName={displayName} email={email} />
        <View style={{ flex: 1 }}>
          <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
            <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
            <Tabs.Screen name="inventory" options={{ title: "Inventory" }} />
            <Tabs.Screen name="account" options={{ title: "Account" }} />
          </Tabs>
        </View>
      </View>
    );
  }

  // iPhone: native UITabBar via react-native-bottom-tabs, SF Symbols icons
  return (
    <NativeTabs tintColor={COLORS.primary}>
      <NativeTabs.Trigger
        name="dashboard"
        options={{ title: "Dashboard", icon: { sf: "house" } }}
      />
      <NativeTabs.Trigger
        name="inventory"
        options={{ title: "Inventory", icon: { sf: "shippingbox" } }}
      />
      <NativeTabs.Trigger
        name="account"
        options={{ title: "Account", icon: { sf: "person.circle" } }}
      />
    </NativeTabs>
  );
}
