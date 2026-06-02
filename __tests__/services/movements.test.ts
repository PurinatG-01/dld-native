jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: { getSession: jest.fn() },
  },
}));

global.fetch = jest.fn();

import { supabase } from "@/lib/supabase/client";
import { listMovements } from "@/lib/services/movements";

const mockGetSession = supabase.auth.getSession as jest.Mock;

const SESSION = { access_token: "tok" };

describe("listMovements", () => {
  afterEach(() => jest.clearAllMocks());

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(listMovements({})).rejects.toThrow("Not authenticated");
  });

  it("returns data on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    const payload = {
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
        sort_by: "created_at",
        sort_dir: "desc",
      },
    };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    const result = await listMovements({ page: 1 });
    expect(result).toEqual(payload);
  });

  it("sends filter and sort params", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], meta: {} }),
    });
    await listMovements({
      page: 2,
      limit: 10,
      action_type: "INBOUND",
      sort_by: "action_type",
      sort_dir: "asc",
    });
    const calledUrl = (fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain("page=2");
    expect(calledUrl).toContain("limit=10");
    expect(calledUrl).toContain("action_type=INBOUND");
    expect(calledUrl).toContain("sort_by=action_type");
    expect(calledUrl).toContain("sort_dir=asc");
  });

  it("throws on non-ok response", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Server Error",
      json: async () => ({ error: "Server Error" }),
    });
    await expect(listMovements({})).rejects.toThrow("Server Error");
  });
});
