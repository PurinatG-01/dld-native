import { Dimensions, PixelRatio } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export { SCREEN_HEIGHT };
export const SHEET_TOP = SCREEN_HEIGHT * 0.5;
export const SNAP_COLLAPSED = SHEET_TOP;
// Gap kept below the safe-area top when the sheet is fully expanded, so the
// close button + a strip of camera stay visible and the sheet can never
// fully cover the modal (which risks an accidental swipe-dismiss).
export const SHEET_EXPANDED_MIN_GAP = 72;
export const FINDER_SIZE = 200;
export const CORNER_SIZE = 22;
export const CORNER_THICKNESS = 3;
export const HAIRLINE_WIDTH = 1 / PixelRatio.get();
