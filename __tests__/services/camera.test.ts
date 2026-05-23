import { Camera } from "expo-camera";
import {
  requestCameraPermission,
  getCameraPermissionStatus,
} from "@/lib/services/camera";

describe("requestCameraPermission", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns granted when permission is granted", async () => {
    jest.spyOn(Camera, "requestCameraPermissionsAsync").mockResolvedValue({ status: "granted" } as any);
    const result = await requestCameraPermission();
    expect(result).toBe("granted");
  });

  it("returns denied when permission is denied", async () => {
    jest.spyOn(Camera, "requestCameraPermissionsAsync").mockResolvedValue({ status: "denied" } as any);
    const result = await requestCameraPermission();
    expect(result).toBe("denied");
  });

  it("returns undetermined when permission is undetermined", async () => {
    jest.spyOn(Camera, "requestCameraPermissionsAsync").mockResolvedValue({ status: "undetermined" } as any);
    const result = await requestCameraPermission();
    expect(result).toBe("undetermined");
  });
});

describe("getCameraPermissionStatus", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns current granted status", async () => {
    jest.spyOn(Camera, "getCameraPermissionsAsync").mockResolvedValue({ status: "granted" } as any);
    const result = await getCameraPermissionStatus();
    expect(result).toBe("granted");
  });

  it("returns denied when permission is denied", async () => {
    jest.spyOn(Camera, "getCameraPermissionsAsync").mockResolvedValue({ status: "denied" } as any);
    const result = await getCameraPermissionStatus();
    expect(result).toBe("denied");
  });

  it("returns undetermined when not yet requested", async () => {
    jest.spyOn(Camera, "getCameraPermissionsAsync").mockResolvedValue({ status: "undetermined" } as any);
    const result = await getCameraPermissionStatus();
    expect(result).toBe("undetermined");
  });
});
