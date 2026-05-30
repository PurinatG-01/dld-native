// MOCK SERVICE — Story 1B (RN form only).
// Ref-data reads (suppliers/branches/locations) and the receive_inbound RPC are
// stubbed here so the form works end-to-end without Story 1A. Real read paths +
// RPC wiring are tracked as a side-story in the Inbound EPIC (Notion).
// IDs are uuid in the live DB (the EPIC's `bigint` note is stale).

export type RefOption = { id: string; name: string };

export type InboundPayloadLine = {
  item_id: string;
  quantity: number;
  lot_number?: string | null;
  expiry_date?: string | null;
  branch_location_id: string;
};

export type ReceiveInboundPayload = {
  supplier_id: string;
  branch_id: string;
  lines: InboundPayloadLine[];
};

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const MOCK_SUPPLIERS: RefOption[] = [
  { id: "sup-1", name: "DKSH (Thailand)" },
  { id: "sup-2", name: "Zuellig Pharma" },
  { id: "sup-3", name: "Henry Schein" },
];

const MOCK_BRANCHES: RefOption[] = [
  { id: "br-1", name: "Sukhumvit Clinic" },
  { id: "br-2", name: "Chiang Mai Clinic" },
];

const MOCK_LOCATIONS: Record<string, RefOption[]> = {
  "br-1": [
    { id: "loc-1", name: "Main Store Room" },
    { id: "loc-2", name: "Refrigerator A" },
    { id: "loc-3", name: "Chairside Cabinet 1" },
  ],
  "br-2": [
    { id: "loc-4", name: "Stock Room" },
    { id: "loc-5", name: "Refrigerator" },
  ],
};

export function listSuppliers(): Promise<RefOption[]> {
  return delay(MOCK_SUPPLIERS);
}

export function listBranches(): Promise<RefOption[]> {
  return delay(MOCK_BRANCHES);
}

export function listLocations(branchId: string): Promise<RefOption[]> {
  return delay(MOCK_LOCATIONS[branchId] ?? []);
}

/** Stubbed receive_inbound RPC. Resolves with a fake session id, or throws. */
export async function receiveInbound(
  payload: ReceiveInboundPayload
): Promise<{ inbound_session_id: string }> {
  await delay(null, 800);
  if (payload.lines.length === 0) {
    throw new Error("Cannot submit an inbound session with no lines.");
  }
  if (payload.lines.some((l) => !Number.isInteger(l.quantity) || l.quantity <= 0)) {
    throw new Error("All line quantities must be positive integers.");
  }
  return { inbound_session_id: `mock-session-${Date.now()}` };
}
