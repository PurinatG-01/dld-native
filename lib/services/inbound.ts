import { supabase } from "@/lib/supabase/client";
import { lookupItemByBarcode } from "@/lib/services/inventory";

export type RefOption = { id: string; name: string };

/** One barcode resolved against the catalog; `item` null = unresolved. */
export type ResolvedScan = {
  barcode: string;
  item: { id: string; name: string; unit_of_measure: string } | null;
};

export type InboundRefData = {
  suppliers: RefOption[];
  branches: RefOption[];
  /** Locations for the requested branch (or the caller's branch by default). */
  locations: RefOption[];
  /** The caller's own branch — the only branch they may write to. */
  branch_id: string | null;
};

export type InboundPayloadLine = {
  item_id: string;
  quantity: number;
  lot_number?: string | null;
  expiry_date?: string | null;
  /** Optional per-line override; defaults to the session location in the RPC. */
  location_id?: string | null;
};

export type ReceiveInboundPayload = {
  supplier_id: string | null;
  branch_id: string;
  /** Session-level receiving location (inbound_session.location_id). Required. */
  location_id: string;
  lines: InboundPayloadLine[];
};

async function authHeader(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return `Bearer ${session.access_token}`;
}

/**
 * Reference data for the Receive-delivery form. Pass `branchId` to load that
 * branch's locations; omit to use the caller's branch.
 */
export async function getInboundRefData(
  branchId?: string
): Promise<InboundRefData> {
  const url = new URL(
    "/functions/v1/inbound-refdata",
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );
  if (branchId) url.searchParams.set("branch_id", branchId);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: await authHeader(),
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "inbound-refdata request failed");
  }

  return res.json();
}

/**
 * Resolves a batch of scanned barcodes to catalog items in one call, used by
 * the inbound batch-scan flow after the user commits the scanned list.
 *
 * TODO(dld-spb): replace with a single `resolve-barcodes` edge function that
 * takes the barcode list and returns the matches server-side. Mocked here by
 * looping the existing single-barcode lookup — runs once at commit (not per
 * scan), so per-scan API load is still avoided.
 */
export async function resolveScannedBarcodes(
  barcodes: string[]
): Promise<ResolvedScan[]> {
  return Promise.all(
    barcodes.map(async (barcode) => {
      try {
        const item = await lookupItemByBarcode(barcode);
        return {
          barcode,
          item: item
            ? {
                id: item.id,
                name: item.name,
                unit_of_measure: item.unit_of_measure,
              }
            : null,
        };
      } catch {
        return { barcode, item: null };
      }
    })
  );
}

/** Records an inbound delivery via the receive-inbound edge function. */
export async function receiveInbound(
  payload: ReceiveInboundPayload
): Promise<{ inbound_session_id: string }> {
  const url = new URL(
    "/functions/v1/receive-inbound",
    process.env.EXPO_PUBLIC_SUPABASE_URL
  );

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: await authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "receive-inbound request failed");
  }

  return res.json();
}
