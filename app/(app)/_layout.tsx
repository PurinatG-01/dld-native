import { useEffect, useState } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

const PRIMARY = "#4f46e5";

export default function AppLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => setSession(null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <View style={{ flex: 1, backgroundColor: "#f8fafc" }} />;
  }

  if (!session) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <NativeTabs tintColor={PRIMARY}>
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
