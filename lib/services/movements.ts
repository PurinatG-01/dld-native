import { supabase } from "@/lib/supabase/client";

export type ActionType =
  | "INBOUND"
  | "USE"
  | "DISCARD"
  | "TRANSFER"
  | "ADJUST";

export type MovementSortBy = "created_at" | "action_type";
export type SortDir = "asc" | "desc";

export type StockMovementLine = {
  id: string;
  quantity: number;
  note: string | null;
  item_name: string | null;
  unit_of_measure: string | null;
  lot_number: string | null;
  location_name: string | null;
};

export type StockMovement = {
  id: string;
  action_type: ActionType;
  created_at: string;
  note: string | null;
  actor_name: string | null;
  item_count: number;
  items: StockMovementLine[];
};

export type ListMovementsMeta = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  sort_by: MovementSortBy;
  sort_dir: SortDir;
};

export type ListMovementsResult = {
  data: StockMovement[];
  meta: ListMovementsMeta;
};

export async function listMovements(params: {
  page?: number;
  limit?: number;
  action_type?: ActionType;
  branch_id?: string;
  sort_by?: MovementSortBy;
  sort_dir?: SortDir;
}): Promise<ListMovementsResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = new URL(
    "/functions/v1/list-movements",
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.action_type)
    url.searchParams.set("action_type", params.action_type);
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
    throw new Error(err.error ?? "list-movements request failed");
  }

  return res.json();
}
