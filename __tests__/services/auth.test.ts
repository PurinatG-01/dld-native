jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

import { supabase } from "@/lib/supabase/client";
import { signInWithEmail, signOut } from "@/lib/services/auth";

const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;

describe("signInWithEmail", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns success: true when Supabase returns no error", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const result = await signInWithEmail("a@b.com", "pass");
    expect(result).toEqual({ success: true });
  });

  it("returns success: false with error message when Supabase errors", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Invalid login" } });
    const result = await signInWithEmail("a@b.com", "wrong");
    expect(result).toEqual({ success: false, error: "Invalid login" });
  });
});

describe("signOut", () => {
  it("calls supabase.auth.signOut", async () => {
    mockSignOut.mockResolvedValue({});
    await signOut();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
