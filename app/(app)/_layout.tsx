import { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs, Redirect } from "expo-router";
import { LayoutDashboard, Package, UserCircle } from "lucide-react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { getUserProfile, type UserProfile } from "@/lib/services/user";
import { Sidebar } from "@/components/layout/Sidebar";

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

  // Show blank while session loads — avoids flash before redirect
  if (session === undefined) {
    return <View style={{ flex: 1, backgroundColor: "#f8fafc" }} />;
  }

  // Not authenticated — let expo-router redirect declaratively
  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  const displayName = profile?.name ?? session.user.email ?? "User";
  const email = profile?.email ?? session.user.email ?? "";

  return (
    <View style={{ flex: 1, flexDirection: isWide ? "row" : "column", paddingTop: insets.top, backgroundColor: "#f8fafc" }}>
      {isWide && <Sidebar displayName={displayName} email={email} />}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: isWide
              ? { display: "none" }
              : {
                  backgroundColor: COLORS.card,
                  borderTopColor: COLORS.border,
                  height: 64,
                },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.muted,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "600",
            },
          }}
        >
          <Tabs.Screen
            name="dashboard"
            options={{
              title: "Dashboard",
              tabBarIcon: ({ color }) => (
                <LayoutDashboard size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="inventory"
            options={{
              title: "Inventory",
              tabBarIcon: ({ color }) => <Package size={22} color={color} />,
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: "Account",
              tabBarIcon: ({ color }) => <UserCircle size={22} color={color} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
