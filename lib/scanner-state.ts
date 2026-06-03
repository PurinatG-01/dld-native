import type { InboundLine } from "@/components/inbound/types";

let _modalOpened = false;

export function markModalOpened() {
  _modalOpened = true;
}

export function markModalClosed() {
  _modalOpened = false;
}

export function consumeModalOpened(): boolean {
  const val = _modalOpened;
  _modalOpened = false;
  return val;
}

// Hand-off channel for the inbound batch-scan flow: the scanner modal stashes
// the resolved lines here, then the inbound screen consumes them on focus.
let _scanBatch: InboundLine[] | null = null;

export function setScanBatchResult(lines: InboundLine[]) {
  _scanBatch = lines;
}

export function consumeScanBatchResult(): InboundLine[] | null {
  const val = _scanBatch;
  _scanBatch = null;
  return val;
}
