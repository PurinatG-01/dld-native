const mockStore = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (k: string) =>
    mockStore.has(k) ? mockStore.get(k)! : null
  ),
  setItemAsync: jest.fn(async (k: string, v: string) => {
    mockStore.set(k, v);
  }),
  deleteItemAsync: jest.fn(async (k: string) => {
    mockStore.delete(k);
  }),
}));

import { SecureStoreAdapter } from "@/lib/supabase/secure-store";

beforeEach(() => mockStore.clear());

describe("SecureStoreAdapter", () => {
  it("returns null for a missing key", async () => {
    expect(await SecureStoreAdapter.getItem("missing")).toBeNull();
  });

  it("round-trips a small value", async () => {
    await SecureStoreAdapter.setItem("k", "hello");
    expect(await SecureStoreAdapter.getItem("k")).toBe("hello");
  });

  it("round-trips a value larger than one chunk", async () => {
    const big = "x".repeat(5000);
    await SecureStoreAdapter.setItem("k", big);
    expect(mockStore.get("k")).toBe("3"); // ceil(5000 / 2000)
    expect(await SecureStoreAdapter.getItem("k")).toBe(big);
  });

  it("does not leave stale tail chunks when a value shrinks", async () => {
    await SecureStoreAdapter.setItem("k", "y".repeat(5000));
    await SecureStoreAdapter.setItem("k", "short");
    expect(mockStore.has("k.1")).toBe(false);
    expect(mockStore.has("k.2")).toBe(false);
    expect(await SecureStoreAdapter.getItem("k")).toBe("short");
  });

  it("removes all chunks", async () => {
    await SecureStoreAdapter.setItem("k", "z".repeat(5000));
    await SecureStoreAdapter.removeItem("k");
    expect(mockStore.size).toBe(0);
    expect(await SecureStoreAdapter.getItem("k")).toBeNull();
  });
});
