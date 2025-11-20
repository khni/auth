import { describe, beforeEach, it, expect, vi } from "vitest";
import { AuthTokensService } from "../AuthTokensService.js";
import { AuthDomainError } from "@khni/auth-errors";

// Mock data
const mockUserId = "user-id-123";
const mockRefreshToken = { token: "mock-refresh-token-123" };
const mockAccessToken = "mock-access-token-456";
const mockTokens = {
  refreshToken: mockRefreshToken.token,
  accessToken: mockAccessToken,
};

// Mocks
const mockRefreshTokenService = {
  create: vi.fn(),
  verify: vi.fn(),
  revoke: vi.fn(),
};

const mockAccessTokenService = {
  generate: vi.fn(),
  verify: vi.fn(),
};

describe("AuthTokensService", () => {
  let authTokensService: AuthTokensService;

  beforeEach(() => {
    vi.clearAllMocks();
    authTokensService = new AuthTokensService(
      mockRefreshTokenService,
      mockAccessTokenService
    );
  });

  describe("generate", () => {
    it("should generate both refresh and access tokens", async () => {
      mockRefreshTokenService.create.mockResolvedValue(mockRefreshToken);
      mockAccessTokenService.generate.mockReturnValue(mockAccessToken);

      const result = await authTokensService.generate(mockUserId);

      expect(mockRefreshTokenService.create).toHaveBeenCalledWith(mockUserId);
      expect(mockAccessTokenService.generate).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockTokens);
    });

    it("should throw error if refresh token creation fails", async () => {
      const creationError = new Error("Creation failed");
      mockRefreshTokenService.create.mockRejectedValue(creationError);

      await expect(authTokensService.generate(mockUserId)).rejects.toThrow(
        creationError
      );
    });

    it("should throw error if access token generation fails", async () => {
      mockRefreshTokenService.create.mockResolvedValue(mockRefreshToken);
      const generationError = new Error("Generation failed");
      mockAccessTokenService.generate.mockImplementation(() => {
        throw generationError;
      });

      await expect(authTokensService.generate(mockUserId)).rejects.toThrow(
        generationError
      );
    });
  });

  describe("refresh", () => {
    it("should refresh tokens with valid refresh token", async () => {
      mockRefreshTokenService.verify.mockResolvedValue({ userId: mockUserId });
      mockRefreshTokenService.create.mockResolvedValue(mockRefreshToken);
      mockAccessTokenService.generate.mockReturnValue(mockAccessToken);

      const result = await authTokensService.refresh("valid-refresh-token");

      expect(mockRefreshTokenService.verify).toHaveBeenCalledWith({
        token: "valid-refresh-token",
      });
      expect(mockRefreshTokenService.create).toHaveBeenCalledWith(mockUserId);
      expect(mockAccessTokenService.generate).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockTokens);
    });

    it("should throw AuthDomainError when refresh token is empty string", async () => {
      await expect(authTokensService.refresh("")).rejects.toThrow(
        AuthDomainError
      );
      await expect(authTokensService.refresh("")).rejects.toThrow(
        "REFRESH_TOKEN_INVALID"
      );
    });

    it("should throw AuthDomainError when refresh token is null", async () => {
      await expect(authTokensService.refresh(null as any)).rejects.toThrow(
        AuthDomainError
      );
      await expect(authTokensService.refresh(null as any)).rejects.toThrow(
        "REFRESH_TOKEN_INVALID"
      );
    });

    it("should throw AuthDomainError when refresh token verification returns no userId", async () => {
      mockRefreshTokenService.verify.mockResolvedValue({ userId: null });

      await expect(authTokensService.refresh("invalid-token")).rejects.toThrow(
        AuthDomainError
      );
      await expect(authTokensService.refresh("invalid-token")).rejects.toThrow(
        "REFRESH_TOKEN_INVALID"
      );
    });

    it("should throw AuthDomainError when refresh token verification returns undefined userId", async () => {
      mockRefreshTokenService.verify.mockResolvedValue({ userId: undefined });

      await expect(authTokensService.refresh("invalid-token")).rejects.toThrow(
        AuthDomainError
      );
      await expect(authTokensService.refresh("invalid-token")).rejects.toThrow(
        "REFRESH_TOKEN_INVALID"
      );
    });

    it("should propagate errors from token generation during refresh", async () => {
      mockRefreshTokenService.verify.mockResolvedValue({ userId: mockUserId });
      const generationError = new Error("Generation failed");
      mockRefreshTokenService.create.mockRejectedValue(generationError);

      await expect(authTokensService.refresh("valid-token")).rejects.toThrow(
        generationError
      );
    });
  });

  describe("logout", () => {
    it("should revoke refresh token successfully", async () => {
      mockRefreshTokenService.revoke.mockResolvedValue(undefined);

      await authTokensService.logout("refresh-token-to-revoke");

      expect(mockRefreshTokenService.revoke).toHaveBeenCalledWith({
        token: "refresh-token-to-revoke",
      });
    });

    it("should propagate errors from token revocation", async () => {
      const revocationError = new Error("Revocation failed");
      mockRefreshTokenService.revoke.mockRejectedValue(revocationError);

      await expect(authTokensService.logout("token-to-revoke")).rejects.toThrow(
        revocationError
      );
    });

    it("should handle revocation with empty token", async () => {
      mockRefreshTokenService.revoke.mockResolvedValue(undefined);

      await authTokensService.logout("");

      expect(mockRefreshTokenService.revoke).toHaveBeenCalledWith({
        token: "",
      });
    });
  });
});
