jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: { getSession: jest.fn() },
  },
}));

global.fetch = jest.fn();

import { supabase } from "@/lib/supabase/client";
import {
  listItems,
  getItemStock,
  listBranchLocations,
  listSuppliers,
  createInbound,
} from "@/lib/services/inventory";

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

describe("listBranchLocations", () => {
  afterEach(() => jest.clearAllMocks());

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(listBranchLocations("branch-1")).rejects.toThrow("Not authenticated");
  });

  it("returns locations on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    const payload = [
      { id: "loc-1", branch_id: "branch-1", parent_id: null, name: "Stockroom A", type: "stockroom", created_at: "2026-01-01" },
    ];
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => payload });
    const result = await listBranchLocations("branch-1");
    expect(result).toEqual(payload);
  });

  it("throws on non-ok response", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Not Found",
      json: async () => ({ error: "Not Found" }),
    });
    await expect(listBranchLocations("branch-1")).rejects.toThrow("Not Found");
  });
});

describe("listSuppliers", () => {
  afterEach(() => jest.clearAllMocks());

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(listSuppliers()).rejects.toThrow("Not authenticated");
  });

  it("returns suppliers on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    const payload = [{ id: "sup-1", name: "Med Supply Co", contact_name: null, email: null, phone: null }];
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => payload });
    const result = await listSuppliers();
    expect(result).toEqual(payload);
  });

  it("throws on non-ok response", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Server Error",
      json: async () => ({ error: "Server Error" }),
    });
    await expect(listSuppliers()).rejects.toThrow("Server Error");
  });
});

describe("createInbound", () => {
  afterEach(() => jest.clearAllMocks());

  const params = {
    locationId: "loc-1",
    items: [{ itemId: "item-1", quantity: 2 }],
  };

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(createInbound(params)).rejects.toThrow("Not authenticated");
  });

  it("resolves on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    await expect(createInbound(params)).resolves.toBeUndefined();
  });

  it("sends POST with correct body", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    await createInbound(params);
    const [, options] = (fetch as jest.Mock).mock.calls[0];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toMatchObject({
      locationId: "loc-1",
      items: [{ itemId: "item-1", quantity: 2 }],
    });
  });

  it("throws on non-ok response", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
      json: async () => ({ error: "DB error" }),
    });
    await expect(createInbound(params)).rejects.toThrow("DB error");
  });
});
