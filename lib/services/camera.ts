import {
  requestCameraPermissionsAsync,
  getCameraPermissionsAsync,
} from "expo-camera";
import { PermissionStatus } from "expo-modules-core";

export type { PermissionStatus as CameraPermissionStatus };

export async function requestCameraPermission(): Promise<PermissionStatus> {
  const { status } = await requestCameraPermissionsAsync();
  return status;
}

export async function getCameraPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await getCameraPermissionsAsync();
  return status;
}
