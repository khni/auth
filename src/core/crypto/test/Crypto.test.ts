import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { CryptoTokenGenerator } from "../Crypto.js";

vi.mock("crypto");

describe("CryptoTokenGenerator", () => {
  let generator: CryptoTokenGenerator;

  beforeEach(() => {
    generator = new CryptoTokenGenerator();

    // Reset mocks between tests
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate a hex token with the expected length", () => {
    // Arrange
    const fakeBuffer = Buffer.from("abcd", "utf-8");
    (crypto.randomBytes as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      fakeBuffer
    );

    // Act
    const result = generator.generateHexToken(4);

    // Assert
    expect(crypto.randomBytes).toHaveBeenCalledWith(4);
    expect(result).toBe(fakeBuffer.toString("hex"));
  });

  it("should generate a base64url token with the expected length", () => {
    const fakeBuffer = Buffer.from("1234", "utf-8");
    (crypto.randomBytes as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      fakeBuffer
    );

    const result = generator.generateBase64UrlToken(10);

    expect(crypto.randomBytes).toHaveBeenCalledWith(10);
    expect(result).toBe(fakeBuffer.toString("base64url"));
  });

  it("should generate a UUID", () => {
    (crypto.randomUUID as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      "mocked-uuid-123"
    );

    const result = generator.generateUUID();

    expect(crypto.randomUUID).toHaveBeenCalled();
    expect(result).toBe("mocked-uuid-123");
  });
});
