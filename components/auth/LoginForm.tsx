import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Stethoscope } from "lucide-react-native";
import { signInWithEmail } from "@/lib/services/auth";
import { FlashMessage } from "@/components/ui/FlashMessage";
import { useColor } from "@/lib/useColor";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const result = await signInWithEmail(email, password);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else {
      router.replace("/(app)/dashboard");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background">
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-grow items-center justify-center p-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-sm bg-card rounded-xl border border-border p-10 shadow-sm">
          <View className="flex-row items-center gap-3 mb-10">
            <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center">
              <Stethoscope size={20} color={useColor("primary-foreground")} />
            </View>
            <View>
              <Text className="text-base font-bold text-card-foreground leading-tight">
                DLD
              </Text>
              <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Clinical Ops
              </Text>
            </View>
          </View>

          <Text className="text-xl font-bold text-card-foreground mb-1">
            Welcome back
          </Text>
          <Text className="text-sm text-muted-foreground mb-8">
            Sign in to your clinic account
          </Text>

          {error && <FlashMessage message={error} variant="error" />}

          <Text className="text-sm font-medium text-card-foreground mb-1.5">
            Email address
          </Text>
          <TextInput
            className="border border-border rounded-lg px-3 py-3 text-sm text-foreground bg-background mb-4"
            placeholder="you@example.com"
            placeholderTextColor={useColor("placeholder")}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text className="text-sm font-medium text-card-foreground mb-1.5">
            Password
          </Text>
          <TextInput
            className="border border-border rounded-lg px-3 py-3 text-sm text-foreground bg-background mb-6"
            placeholder="••••••••"
            placeholderTextColor={useColor("placeholder")}
            autoComplete="current-password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <Pressable
            className="bg-primary rounded-lg py-3.5 items-center active:opacity-70"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={useColor("primary-foreground")} size="small" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-sm">
                Sign in
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
