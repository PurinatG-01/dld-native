import { supabase } from "@/lib/supabase/client";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role_id: string;
  branch_id: string;
};

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user")
    .select("id, name, email, role_id, branch_id")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}
