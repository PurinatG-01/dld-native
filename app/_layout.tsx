import "../global.css";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments, SplashScreen } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "auth";

    if (!session && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (session && inAuthGroup) {
      router.replace("/(app)/dashboard");
    }
  }, [session, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
