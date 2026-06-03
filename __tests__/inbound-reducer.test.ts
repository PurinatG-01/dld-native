import {
  inboundReducer,
  initialInboundState,
  isLineValid,
  canSubmit,
  makeLineKey,
} from "@/lib/inbound-reducer";
import type { InboundLine, InboundState } from "@/components/inbound/types";

function makeLine(over: Partial<InboundLine> = {}): InboundLine {
  return {
    key: makeLineKey(),
    item: { id: "item-1", name: "Amoxicillin", unit_of_measure: "box", category: "Disposables & Office" as const },
    quantity: 2,
    lot_number: null,
    expiry_date: null,
    location_id: "loc-1",
    ...over,
  };
}

describe("inboundReducer", () => {
  it("sets supplier", () => {
    const s = inboundReducer(initialInboundState, {
      type: "SET_SUPPLIER",
      supplierId: "sup-1",
    });
    expect(s.supplierId).toBe("sup-1");
  });

  it("clears location selections when branch changes", () => {
    const line = makeLine({ location_id: "loc-1" });
    const start: InboundState = {
      ...initialInboundState,
      defaultLocationId: "loc-1",
      lines: [line],
    };
    const s = inboundReducer(start, { type: "SET_BRANCH", branchId: "br-2" });
    expect(s.branchId).toBe("br-2");
    expect(s.defaultLocationId).toBeNull();
    expect(s.lines[0].location_id).toBeNull();
  });

  it("adds a line to the front", () => {
    const a = makeLine({ key: "a" });
    const b = makeLine({ key: "b" });
    let s = inboundReducer(initialInboundState, { type: "ADD_LINE", line: a });
    s = inboundReducer(s, { type: "ADD_LINE", line: b });
    expect(s.lines.map((l) => l.key)).toEqual(["b", "a"]);
  });

  it("updates a line by key", () => {
    const line = makeLine({ key: "x", quantity: 1 });
    const start = { ...initialInboundState, lines: [line] };
    const s = inboundReducer(start, {
      type: "UPDATE_LINE",
      key: "x",
      patch: { quantity: 5 },
    });
    expect(s.lines[0].quantity).toBe(5);
  });

  it("removes a line by key", () => {
    const line = makeLine({ key: "x" });
    const start = { ...initialInboundState, lines: [line] };
    const s = inboundReducer(start, { type: "REMOVE_LINE", key: "x" });
    expect(s.lines).toHaveLength(0);
  });

  describe("ADD_SCANNED_LINES", () => {
    it("inherits the session default location when none is set", () => {
      const start = { ...initialInboundState, defaultLocationId: "loc-1" };
      const scanned = makeLine({ key: "s1", location_id: null, status: "ready" });
      const s = inboundReducer(start, {
        type: "ADD_SCANNED_LINES",
        lines: [scanned],
      });
      expect(s.lines[0].location_id).toBe("loc-1");
    });

    it("merges a ready scanned line into an existing ready line for the same item", () => {
      const existing = makeLine({ key: "a", quantity: 2, status: "ready" });
      const start = {
        ...initialInboundState,
        defaultLocationId: "loc-1",
        lines: [existing],
      };
      const scanned = makeLine({ key: "s1", quantity: 3, status: "ready" });
      const s = inboundReducer(start, {
        type: "ADD_SCANNED_LINES",
        lines: [scanned],
      });
      expect(s.lines).toHaveLength(1);
      expect(s.lines[0].key).toBe("a");
      expect(s.lines[0].quantity).toBe(5);
    });

    it("prepends error lines without merging", () => {
      const errLineA = makeLine({
        key: "e1",
        item: null,
        barcode: "GTIN-X",
        status: "error",
      });
      const errLineB = makeLine({
        key: "e2",
        item: null,
        barcode: "GTIN-X",
        status: "error",
      });
      const start = { ...initialInboundState, lines: [errLineA] };
      const s = inboundReducer(start, {
        type: "ADD_SCANNED_LINES",
        lines: [errLineB],
      });
      expect(s.lines).toHaveLength(2);
    });
  });

  it("ignores SUBMIT_START while already submitting (double-submit guard)", () => {
    const start: InboundState = { ...initialInboundState, submit: "submitting" };
    const s = inboundReducer(start, { type: "SUBMIT_START" });
    expect(s).toBe(start);
  });

  it("RESET returns initial state", () => {
    const start: InboundState = {
      ...initialInboundState,
      supplierId: "sup-1",
      lines: [makeLine()],
    };
    expect(inboundReducer(start, { type: "RESET" })).toEqual(initialInboundState);
  });
});

describe("isLineValid", () => {
  it("true for a complete line", () => {
    expect(isLineValid(makeLine())).toBe(true);
  });

  it("false without a location", () => {
    expect(isLineValid(makeLine({ location_id: null }))).toBe(false);
  });

  it("false for non-positive or non-integer quantity", () => {
    expect(isLineValid(makeLine({ quantity: 0 }))).toBe(false);
    expect(isLineValid(makeLine({ quantity: -1 }))).toBe(false);
    expect(isLineValid(makeLine({ quantity: 1.5 }))).toBe(false);
  });

  it("false for an unresolved error line (no item)", () => {
    expect(
      isLineValid(makeLine({ item: null, barcode: "GTIN-X", status: "error" }))
    ).toBe(false);
  });
});

describe("canSubmit", () => {
  const ready: InboundState = {
    ...initialInboundState,
    supplierId: "sup-1",
    branchId: "br-1",
    defaultLocationId: "loc-1",
    lines: [makeLine()],
  };

  it("true when supplier, branch, location, and ≥1 valid line present", () => {
    expect(canSubmit(ready)).toBe(true);
  });

  it("false without a session default location", () => {
    expect(canSubmit({ ...ready, defaultLocationId: null })).toBe(false);
  });

  it("false with zero lines", () => {
    expect(canSubmit({ ...ready, lines: [] })).toBe(false);
  });

  it("false when a line is invalid", () => {
    expect(canSubmit({ ...ready, lines: [makeLine({ quantity: 0 })] })).toBe(
      false
    );
  });

  it("false while submitting", () => {
    expect(canSubmit({ ...ready, submit: "submitting" })).toBe(false);
  });

  it("false without a supplier", () => {
    expect(canSubmit({ ...ready, supplierId: null })).toBe(false);
  });

  it("false when any line is an unresolved error line", () => {
    const errLine = makeLine({
      key: "e1",
      item: null,
      barcode: "GTIN-X",
      status: "error",
    });
    expect(canSubmit({ ...ready, lines: [...ready.lines, errLine] })).toBe(false);
  });
});
