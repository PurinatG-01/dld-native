import type { InboundState, InboundAction, InboundLine } from "@/components/inbound/types";

export const initialInboundState: InboundState = {
  supplierId: null,
  branchId: null,
  defaultLocationId: null,
  lines: [],
  submit: "idle",
  errorMsg: null,
};

export function makeLineKey(): string {
  return `${Date.now()}-${Math.random()}`;
}

export function inboundReducer(
  state: InboundState,
  action: InboundAction
): InboundState {
  switch (action.type) {
    case "SET_SUPPLIER":
      return { ...state, supplierId: action.supplierId };

    case "SET_BRANCH":
      // Switching branch invalidates location selections scoped to the old branch.
      return {
        ...state,
        branchId: action.branchId,
        defaultLocationId: null,
        lines: state.lines.map((l) => ({ ...l, location_id: null })),
      };

    case "SET_DEFAULT_LOCATION":
      return { ...state, defaultLocationId: action.locationId };

    case "ADD_LINE":
      return { ...state, lines: [action.line, ...state.lines] };

    case "ADD_SCANNED_LINES": {
      // Merge each resolved (ready) line into an existing ready line for the
      // same item; everything else (incl. unresolved error lines) is prepended.
      // Incoming lines inherit the session default location when none is set.
      let lines = state.lines;
      for (const incoming of action.lines) {
        const line: InboundLine = {
          ...incoming,
          location_id: incoming.location_id ?? state.defaultLocationId,
        };
        const mergeIdx =
          line.item && line.status !== "error"
            ? lines.findIndex(
                (l) => l.status !== "error" && l.item?.id === line.item!.id
              )
            : -1;
        lines =
          mergeIdx >= 0
            ? lines.map((l, i) =>
                i === mergeIdx
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l
              )
            : [line, ...lines];
      }
      return { ...state, lines };
    }

    case "UPDATE_LINE":
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.key === action.key ? { ...l, ...action.patch } : l
        ),
      };

    case "REMOVE_LINE":
      return { ...state, lines: state.lines.filter((l) => l.key !== action.key) };

    case "SUBMIT_START":
      // Double-submit guard: ignore if already in flight.
      if (state.submit === "submitting") return state;
      return { ...state, submit: "submitting", errorMsg: null };

    case "SUBMIT_ERROR":
      return { ...state, submit: "error", errorMsg: action.message };

    case "RESET":
      return initialInboundState;

    default:
      return state;
  }
}

/** True when a line is complete enough to submit. */
export function isLineValid(line: InboundLine): boolean {
  return (
    line.status !== "error" &&
    !!line.item?.id &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    !!line.location_id
  );
}

/** True when the whole draft can be submitted. */
export function canSubmit(state: InboundState): boolean {
  return (
    state.submit !== "submitting" &&
    !!state.supplierId &&
    !!state.branchId &&
    !!state.defaultLocationId &&
    state.lines.length > 0 &&
    state.lines.every(isLineValid)
  );
}
