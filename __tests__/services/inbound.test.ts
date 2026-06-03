jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: { getSession: jest.fn() },
  },
}));

jest.mock("@/lib/services/inventory", () => ({
  lookupItemByBarcode: jest.fn(),
}));

global.fetch = jest.fn();

import { supabase } from "@/lib/supabase/client";
import { lookupItemByBarcode } from "@/lib/services/inventory";
import {
  getInboundRefData,
  resolveScannedBarcodes,
  receiveInbound,
} from "@/lib/services/inbound";

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockLookupItem = lookupItemByBarcode as jest.Mock;

const SESSION = { access_token: "tok" };

describe("getInboundRefData", () => {
  afterEach(() => jest.clearAllMocks());

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(getInboundRefData()).rejects.toThrow("Not authenticated");
  });

  it("returns ref data on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    const payload = {
      suppliers: [{ id: "s1", name: "Supplier A" }],
      branches: [{ id: "b1", name: "Branch 1" }],
      locations: [{ id: "l1", name: "Shelf A" }],
      branch_id: "b1",
    };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    const result = await getInboundRefData("b1");
    expect(result).toEqual(payload);
  });

  it("throws on non-ok response", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
      json: async () => ({ error: "Bad Request" }),
    });
    await expect(getInboundRefData()).rejects.toThrow("Bad Request");
  });

  it("falls back to statusText when json body has no error", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Forbidden",
      json: async () => ({}),
    });
    await expect(getInboundRefData()).rejects.toThrow(
      "inbound-refdata request failed"
    );
  });
});

describe("resolveScannedBarcodes", () => {
  afterEach(() => jest.clearAllMocks());

  it("resolves each barcode against the catalog", async () => {
    mockLookupItem.mockResolvedValueOnce({
      id: "item-1",
      name: "Amoxicillin 500mg",
      unit_of_measure: "tablet",
      category: "medicine",
    });
    mockLookupItem.mockResolvedValueOnce(null);

    const result = await resolveScannedBarcodes([
      "MOCK-001",
      "UNKNOWN-BARCODE",
    ]);
    expect(result).toEqual([
      {
        barcode: "MOCK-001",
        item: {
          id: "item-1",
          name: "Amoxicillin 500mg",
          unit_of_measure: "tablet",
          category: "medicine",
        },
      },
      { barcode: "UNKNOWN-BARCODE", item: null },
    ]);
  });

  it("handles lookup errors gracefully per barcode", async () => {
    mockLookupItem.mockRejectedValueOnce(new Error("network"));
    mockLookupItem.mockResolvedValueOnce({
      id: "item-2",
      name: "Nitrile Gloves",
      unit_of_measure: "box",
      category: "supplies",
    });

    const result = await resolveScannedBarcodes(["ERR-BCODE", "GLOVES"]);
    expect(result).toEqual([
      { barcode: "ERR-BCODE", item: null },
      {
        barcode: "GLOVES",
        item: {
          id: "item-2",
          name: "Nitrile Gloves",
          unit_of_measure: "box",
          category: "supplies",
        },
      },
    ]);
  });
});

describe("receiveInbound", () => {
  afterEach(() => jest.clearAllMocks());

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    await expect(
      receiveInbound({
        supplier_id: null,
        branch_id: "b1",
        location_id: "l1",
        lines: [],
      })
    ).rejects.toThrow("Not authenticated");
  });

  it("returns session id on success", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    const payload = { inbound_session_id: "is-1" };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    const result = await receiveInbound({
      supplier_id: "s1",
      branch_id: "b1",
      location_id: "l1",
      lines: [{ item_id: "item-1", quantity: 10 }],
    });
    expect(result).toEqual(payload);
  });

  it("throws on non-ok response", async () => {
    mockGetSession.mockResolvedValue({ data: { session: SESSION } });
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Conflict",
      json: async () => ({ error: "Duplicate" }),
    });
    await expect(
      receiveInbound({
        supplier_id: null,
        branch_id: "b1",
        location_id: "l1",
        lines: [],
      })
    ).rejects.toThrow("Duplicate");
  });
});
