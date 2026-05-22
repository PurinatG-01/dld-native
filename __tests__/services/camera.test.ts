jest.mock("expo-camera", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  getCameraPermissionsAsync: jest.fn(),
}));

import {
  requestCameraPermissionsAsync,
  getCameraPermissionsAsync,
} from "expo-camera";
import {
  requestCameraPermission,
  getCameraPermissionStatus,
} from "@/lib/services/camera";

const mockRequest = requestCameraPermissionsAsync as jest.Mock;
const mockGet = getCameraPermissionsAsync as jest.Mock;

describe("requestCameraPermission", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns granted when permission is granted", async () => {
    mockRequest.mockResolvedValue({ status: "granted" });
    const result = await requestCameraPermission();
    expect(result).toBe("granted");
  });

  it("returns denied when permission is denied", async () => {
    mockRequest.mockResolvedValue({ status: "denied" });
    const result = await requestCameraPermission();
    expect(result).toBe("denied");
  });

  it("returns undetermined when permission is undetermined", async () => {
    mockRequest.mockResolvedValue({ status: "undetermined" });
    const result = await requestCameraPermission();
    expect(result).toBe("undetermined");
  });
});

describe("getCameraPermissionStatus", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns current granted status", async () => {
    mockGet.mockResolvedValue({ status: "granted" });
    const result = await getCameraPermissionStatus();
    expect(result).toBe("granted");
  });

  it("returns denied when permission is denied", async () => {
    mockGet.mockResolvedValue({ status: "denied" });
    const result = await getCameraPermissionStatus();
    expect(result).toBe("denied");
  });

  it("returns undetermined when not yet requested", async () => {
    mockGet.mockResolvedValue({ status: "undetermined" });
    const result = await getCameraPermissionStatus();
    expect(result).toBe("undetermined");
  });
});
