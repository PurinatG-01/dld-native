jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/services/user";

describe("getUserProfile", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns profile data on success", async () => {
    const profile = {
      id: "1",
      name: "Ada",
      email: "a@b.com",
      role_id: "r",
      branch_id: "b",
    };
    const mockSingle = jest.fn().mockResolvedValue({ data: profile, error: null });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await getUserProfile("1");
    expect(result).toEqual(profile);
    expect(supabase.from).toHaveBeenCalledWith("user");
  });

  it("returns null when Supabase errors", async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: "Not found" } });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await getUserProfile("99");
    expect(result).toBeNull();
  });
});
