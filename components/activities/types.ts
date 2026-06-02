import type {
  ActionType,
  StockMovement,
  StockMovementLine,
} from "@/lib/services/movements";

export type { ActionType, StockMovement, StockMovementLine };

export type MovementRowProps = {
  movement: StockMovement;
};
