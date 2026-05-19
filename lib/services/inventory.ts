import { supabase } from "@/lib/supabase/client";

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  unit_of_measure: string;
  reorder_point: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_quantity: number;
};

export type SortDir = "asc" | "desc";
export type SortBy =
  | "name"
  | "category"
  | "unit_of_measure"
  | "reorder_point"
  | "created_at";

export type ListItemsMeta = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  sort_by: SortBy;
  sort_dir: SortDir;
};

export type ListItemsResult = {
  data: InventoryItem[];
  meta: ListItemsMeta;
};

export type ItemStockRecord = {
  id: string;
  item_id: string;
  location_id: string;
  location_name: string | null;
  lot_number: string | null;
  serial_number: string | null;
  expiry_date: string | null;
  manufacturing_date: string | null;
  received_date: string | null;
  quantity_on_hand: number;
  unit_cost_at_receipt: number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ItemDetail = {
  id: string;
  name: string;
  generic_name: string | null;
  brand: string | null;
  internal_sku: string | null;
  barcode_gtin: string | null;
  category: string;
  subcategory: string | null;
  unit_of_measure: string;
  pack_size: number | null;
  reorder_point: number | null;
  par_level: number | null;
  max_level: number | null;
  is_controlled_drug: boolean;
  requires_refrigeration: boolean;
  is_serialized: boolean;
  created_at: string;
};

export type GetItemStockResult = {
  item: ItemDetail;
  stocks: ItemStockRecord[];
};

export async function listItems(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  branch_id?: string;
  sort_by?: SortBy;
  sort_dir?: SortDir;
}): Promise<ListItemsResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = new URL(
    "/functions/v1/list-items",
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.search) url.searchParams.set("search", params.search);
  if (params.category) url.searchParams.set("category", params.category);
  if (params.branch_id) url.searchParams.set("branch_id", params.branch_id);
  if (params.sort_by) url.searchParams.set("sort_by", params.sort_by);
  if (params.sort_dir) url.searchParams.set("sort_dir", params.sort_dir);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "list-items request failed");
  }

  return res.json();
}

export async function getItemStock(
  itemId: string
): Promise<GetItemStockResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = new URL(
    "/functions/v1/item-stock",
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );
  url.searchParams.set("item_id", itemId);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "item-stock request failed");
  }

  return res.json();
}
