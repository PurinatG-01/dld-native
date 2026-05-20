import "../global.css";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Fallback: if AsyncStorage is slow on physical devices, unblock after 5 s
    const fallback = setTimeout(() => setSession((s) => (s === undefined ? null : s)), 5000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => setSession(null))
      .finally(() => clearTimeout(fallback));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    SplashScreen.hideAsync().catch(() => {});

    const inAuthGroup = segments[0] === "auth";

    if (!session && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (session && inAuthGroup) {
      router.replace("/(app)/dashboard");
    }
  }, [session, segments]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
