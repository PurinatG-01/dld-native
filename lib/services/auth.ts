import { supabase } from "@/lib/supabase/client";

export type SignInResult =
  | { success: true }
  | { success: false; error: string };

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
