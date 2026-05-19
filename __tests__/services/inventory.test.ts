jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: { getSession: jest.fn() },
  },
}));

global.fetch = jest.fn();

import { supabase } from "@/lib/supabase/client";
import { listItems, getItemStock } from "@/lib/services/inventory";

const mockGetSession = supabase.auth.getSession as jest.Mock;

const SESSION = { access_token: "tok" };

describe("listItems", () => {
  afterEach(() => jest.clearAllMocks());

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(listItems({})).rejects.toThrow("Not authenticated");
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
        sort_by: "name",
        sort_dir: "asc",
      },
    };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    const result = await listItems({ page: 1 });
    expect(result).toEqual(payload);
  });

  it("throws on non-ok response", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Server Error",
      json: async () => ({ error: "Server Error" }),
    });
    await expect(listItems({})).rejects.toThrow("Server Error");
  });
});

describe("getItemStock", () => {
  afterEach(() => jest.clearAllMocks());

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(getItemStock("item-1")).rejects.toThrow("Not authenticated");
  });

  it("returns item stock data on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    const payload = { item: { id: "item-1", name: "Amoxicillin" }, stocks: [] };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    const result = await getItemStock("item-1");
    expect(result).toEqual(payload);
  });
});
