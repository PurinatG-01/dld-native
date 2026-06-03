import type { SelectOption } from "@/components/ui/Select";

/**
 * Line status. Manual lines are implicitly ready (status omitted). Scanned
 * lines carry `error` when their barcode could not be resolved to an item —
 * the form blocks submit until every error line is fixed or removed.
 */
export type InboundLineStatus = "ready" | "error";

/** A single item line being received in an inbound session. */
export type InboundLine = {
  /** Local-only key for list rendering / edit / remove. */
  key: string;
  /** Null while a scanned line is unresolved (status `error`). */
  item: { id: string; name: string; unit_of_measure: string } | null;
  quantity: number;
  lot_number: string | null;
  /** Raw user-entered expiry, YYYY-MM-DD or null. */
  expiry_date: string | null;
  location_id: string | null;
  /** Scanned GTIN, if the line originated from the scanner. */
  barcode?: string | null;
  /** Omitted for manual lines (treated as ready). */
  status?: InboundLineStatus;
};

/** Inbound draft state held by the reducer in the Receive-delivery screen. */
export type InboundState = {
  supplierId: string | null;
  branchId: string | null;
  /** Pre-fills the location of each newly added line. */
  defaultLocationId: string | null;
  lines: InboundLine[];
  submit: "idle" | "submitting" | "error";
  errorMsg: string | null;
};

export type InboundAction =
  | { type: "SET_SUPPLIER"; supplierId: string | null }
  | { type: "SET_BRANCH"; branchId: string | null }
  | { type: "SET_DEFAULT_LOCATION"; locationId: string | null }
  | { type: "ADD_LINE"; line: InboundLine }
  | { type: "ADD_SCANNED_LINES"; lines: InboundLine[] }
  | { type: "UPDATE_LINE"; key: string; patch: Partial<Omit<InboundLine, "key">> }
  | { type: "REMOVE_LINE"; key: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_ERROR"; message: string }
  | { type: "RESET" };

export type { SelectOption };
