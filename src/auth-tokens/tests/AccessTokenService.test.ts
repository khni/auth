import { describe, beforeEach, it, expect, vi } from "vitest";
import { AccessTokenService } from "../AccessTokenService.js";
import { AuthDomainError } from "@khni/auth-errors";
import { TokenExpiredError } from "jsonwebtoken";

// Mock data
const mockToken = "mocked-access-token-123";
const mockPayload = { userId: "user-id-123" };
const mockVerifiedPayload = {
  userId: "user-id-123",
  iat: 1234567890,
  exp: 1234567890,
};

// Mocks
const mockTokenService = {
  sign: vi.fn(),
  verify: vi.fn(),
};

describe("AccessTokenService", () => {
  let accessTokenService: AccessTokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    accessTokenService = new AccessTokenService(
      mockTokenService,
      "10m" // default expiry
    );
  });

  describe("generate", () => {
    it("should generate an access token with correct parameters", () => {
      mockTokenService.sign.mockReturnValue(mockToken);

      const result = accessTokenService.generate("user-id-123");

      expect(mockTokenService.sign).toHaveBeenCalledWith(
        { userId: "user-id-123" },
        { expiresIn: "10m" }
      );
      expect(result).toBe(mockToken);
    });

    it("should use custom expiresIn when provided in constructor", () => {
      const customAccessTokenService = new AccessTokenService(
        mockTokenService,
        "1h"
      );
      mockTokenService.sign.mockReturnValue(mockToken);

      const result = customAccessTokenService.generate("user-id-123");

      expect(mockTokenService.sign).toHaveBeenCalledWith(
        { userId: "user-id-123" },
        { expiresIn: "1h" }
      );
      expect(result).toBe(mockToken);
    });
  });

  describe("verify", () => {
    it("should verify and return payload when token is valid", () => {
      mockTokenService.verify.mockReturnValue(mockVerifiedPayload);

      const result = accessTokenService.verify(mockToken);

      expect(mockTokenService.verify).toHaveBeenCalledWith(mockToken);
      expect(result).toEqual(mockVerifiedPayload);
    });

    it("should throw AuthDomainError when token is null", () => {
      expect(() => accessTokenService.verify(null)).toThrow(AuthDomainError);
      expect(() => accessTokenService.verify(null)).toThrow(
        "MISSING_ACCESS_TOKEN"
      );
    });

    it("should throw AuthDomainError when token is undefined", () => {
      expect(() => accessTokenService.verify(undefined)).toThrow(
        AuthDomainError
      );
      expect(() => accessTokenService.verify(undefined)).toThrow(
        "MISSING_ACCESS_TOKEN"
      );
    });

    it("should throw AuthDomainError when token is empty string", () => {
      expect(() => accessTokenService.verify("")).toThrow(AuthDomainError);
      expect(() => accessTokenService.verify("")).toThrow(
        "MISSING_ACCESS_TOKEN"
      );
    });

    it("should throw AuthDomainError when token is expired", () => {
      const expiredError = new TokenExpiredError("jwt expired", new Date());
      mockTokenService.verify.mockImplementation(() => {
        throw expiredError;
      });

      expect(() => accessTokenService.verify(mockToken)).toThrow(
        AuthDomainError
      );
      expect(() => accessTokenService.verify(mockToken)).toThrow(
        "EXPIRED_ACCESS_TOKEN"
      );
    });

    it("should rethrow non-TokenExpiredError errors", () => {
      const otherError = new Error("Some other JWT error");
      mockTokenService.verify.mockImplementation(() => {
        throw otherError;
      });

      expect(() => accessTokenService.verify(mockToken)).toThrow(otherError);
    });

    it("should handle various JWT verification errors without converting them", () => {
      const jwtErrors = [
        new Error("invalid signature"),
        new Error("jwt malformed"),
        new Error("invalid token"),
      ];

      jwtErrors.forEach((error) => {
        mockTokenService.verify.mockImplementation(() => {
          throw error;
        });

        expect(() => accessTokenService.verify(mockToken)).toThrow(error);
      });
    });
  });
});
