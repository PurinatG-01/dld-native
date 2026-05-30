export type ScanStatus = "idle" | "loading" | "success" | "error";

export type ScannedItem = {
  id: string;
  barcode: string;
  itemId: string;
  name: string;
  quantity: number;
  scannedAt: Date;
  lotNumber?: string;
  expiryDate?: string;
  serialNumber?: string;
  unitCost?: number;
};

export type InboundSessionParams = {
  locationId: string;
  locationName: string;
  supplierId?: string;
  referenceNote?: string;
};

export type ScanState =
  | { status: "idle" }
  | { status: "loading"; barcode: string }
  | { status: "success"; barcode: string }
  | { status: "error"; barcode: string };

export type ScanAction =
  | { type: "SCAN_START"; barcode: string }
  | { type: "SCAN_SUCCESS"; barcode: string }
  | { type: "SCAN_ERROR"; barcode: string }
  | { type: "SCAN_RESET" };
