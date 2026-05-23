import { Dimensions } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export { SCREEN_HEIGHT };
export const SHEET_TOP = SCREEN_HEIGHT * 0.5;
export const SNAP_COLLAPSED = SHEET_TOP;
export const SNAP_EXPANDED = 0;
export const FINDER_SIZE = 200;
export const CORNER_SIZE = 22;
export const CORNER_THICKNESS = 3;
export const PRIMARY = "#4f46e5";
