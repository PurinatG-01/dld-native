jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  })),
}));

import { supabase } from "@/lib/supabase/client";

describe("supabase client", () => {
  it("is defined", () => {
    expect(supabase).toBeDefined();
  });

  it("has auth property", () => {
    expect(supabase.auth).toBeDefined();
  });
});
