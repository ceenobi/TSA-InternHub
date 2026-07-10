// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("~/.server/services/better-auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("~/.server/config/logger", () => ({
  default: { error: vi.fn() },
}));
vi.mock("~/.server/utils/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => {}),
}));
vi.mock("~/.server/config/keys", () => ({
  env: { cloudinary: { cloudName: "test-cloud", apiKey: "test-key", apiSecret: "test-secret" } },
}));

const mockGetSignedUrl = vi.fn();
const mockUploadToCloudinary = vi.fn();
const mockDeleteFromCloudinary = vi.fn();
vi.mock("~/.server/utils/cloudinary", () => ({
  getSignedUrl: (...args: any[]) => mockGetSignedUrl(...args),
  uploadToCloudinary: (...args: any[]) => mockUploadToCloudinary(...args),
  deleteFromCloudinary: (...args: any[]) => mockDeleteFromCloudinary(...args),
}));

import { getUploadSignature, uploadFile, deleteFile } from "../upload";
import { auth } from "~/.server/services/better-auth";
import { checkRateLimit } from "~/.server/utils/rate-limit";

const mockSession = {
  user: { id: "user-1", name: "Test", email: "test@example.com", role: "user", program: "full-stack" } as any,
  session: { token: "mock" } as any,
};
const mockRequest = new Request("http://localhost:3700");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(undefined as any);
  vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
});

describe("getUploadSignature", () => {
  it("returns upload signature", async () => {
    mockGetSignedUrl.mockResolvedValue({
      timestamp: 1234567890,
      signature: "abc123",
      uploadPreset: "test-preset",
      folder: "test-folder",
      eager: "",
      responsive_breakpoints: "",
    });

    const response = await getUploadSignature(mockRequest, { folder: "test-folder" });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.signature).toBe("abc123");
    expect(body.cloudName).toBe("test-cloud");
    expect(body.apiKey).toBe("test-key");
    expect(mockGetSignedUrl).toHaveBeenCalledWith("test-folder");
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await getUploadSignature(mockRequest, { folder: "test" });
    expect(response.status).toBe(401);
  });
});

describe("uploadFile", () => {
  it("uploads files", async () => {
    mockUploadToCloudinary.mockResolvedValue({ secure_url: "https://cloudinary.com/test.jpg" });

    const response = await uploadFile(mockRequest, {
      files: ["data:image/jpeg;base64,/9j/4AAQ=="],
      folder: "avatars",
    });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.body).toHaveLength(1);
    expect(mockUploadToCloudinary).toHaveBeenCalledWith(
      "data:image/jpeg;base64,/9j/4AAQ==",
      expect.objectContaining({ folder: "tsaInterns/avatars" }),
    );
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await uploadFile(mockRequest, { files: [], folder: "test" });
    expect(response.status).toBe(401);
  });
});

describe("deleteFile", () => {
  it("deletes files", async () => {
    mockDeleteFromCloudinary.mockResolvedValue({ deleted: ["abc123"] });

    const response = await deleteFile(mockRequest, { publicIds: ["abc123"] });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockDeleteFromCloudinary).toHaveBeenCalledWith(["abc123"]);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const response = await deleteFile(mockRequest, { publicIds: ["abc123"] });
    expect(response.status).toBe(401);
  });
});
