import { describe, beforeEach, it, expect, vi } from "vitest";
import { RefreshTokenService } from "../RefreshTokenService.js";
import { AuthUnexpectedError, AuthDomainError } from "@khni/auth-errors";
import { mockedRefreshToken } from "./data.js";
import { mockCrypto } from "../../core/crypto/test/mocks.js";
import { mockFindUniqueUserById, mockRefreshTokenRepository } from "./mocks.js";

describe("RefreshTokenService", () => {
  let refreshTokenService: RefreshTokenService;
  const validFutureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour in future
  const expiredDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago

  beforeEach(() => {
    vi.clearAllMocks();
    refreshTokenService = new RefreshTokenService(
      mockRefreshTokenRepository,
      mockCrypto,
      vi.fn().mockImplementation((timeString: string) => {
        if (timeString === "1h") {
          return validFutureDate;
        }
        return new Date();
      }),
      "1h",
      mockFindUniqueUserById
    );
  });

  describe("create", () => {
    it("should create and return a refresh token", async () => {
      const generatedToken = "mocked-token-123";
      mockCrypto.generateBase64UrlToken.mockReturnValue(generatedToken);
      mockRefreshTokenRepository.create.mockResolvedValue({
        ...mockedRefreshToken,
        token: generatedToken,
        expiresAt: validFutureDate,
        userId: "user-id",
      });

      const result = await refreshTokenService.create("user-id");

      expect(mockCrypto.generateBase64UrlToken).toHaveBeenCalledWith(40);
      expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith({
        data: {
          token: generatedToken,
          expiresAt: validFutureDate,
          userId: "user-id",
        },
        tx: undefined,
      });
      expect(result.token).toBe(generatedToken);
    });

    it("should throw AuthUnexpectedError if repository.create fails", async () => {
      mockRefreshTokenRepository.create.mockRejectedValue(
        new Error("DB Create Failed")
      );

      await expect(refreshTokenService.create("user-id")).rejects.toThrow(
        AuthUnexpectedError
      );
    });
  });

  describe("verify", () => {
    it("should verify and return userId when token is valid", async () => {
      mockRefreshTokenRepository.findUnique.mockResolvedValue({
        ...mockedRefreshToken,
        expiresAt: validFutureDate,
        revokedAt: null,
      });
      mockFindUniqueUserById.mockResolvedValue({ id: "user-id" });

      const result = await refreshTokenService.verify({
        token: mockedRefreshToken.token,
      });

      expect(mockRefreshTokenRepository.findUnique).toHaveBeenCalledWith({
        where: { token: mockedRefreshToken.token },
      });
      expect(mockFindUniqueUserById).toHaveBeenCalledWith({
        where: { id: mockedRefreshToken.userId },
      });
      expect(result).toEqual({ userId: mockedRefreshToken.userId });
    });

    it("should throw AuthDomainError if refresh token does not exist", async () => {
      mockRefreshTokenRepository.findUnique.mockResolvedValue(null);

      await expect(
        refreshTokenService.verify({ token: mockedRefreshToken.token })
      ).rejects.toThrow(AuthDomainError);
    });

    it("should throw AuthDomainError if refresh token is expired", async () => {
      mockRefreshTokenRepository.findUnique.mockResolvedValue({
        ...mockedRefreshToken,
        expiresAt: expiredDate,
      });

      await expect(
        refreshTokenService.verify({ token: mockedRefreshToken.token })
      ).rejects.toThrow(AuthDomainError);
    });

    it("should throw AuthDomainError if refresh token is revoked", async () => {
      mockRefreshTokenRepository.findUnique.mockResolvedValue({
        ...mockedRefreshToken,
        revokedAt: new Date(),
      });

      await expect(
        refreshTokenService.verify({ token: mockedRefreshToken.token })
      ).rejects.toThrow(AuthDomainError);
    });

    it("should throw AuthDomainError if user does not exist", async () => {
      mockRefreshTokenRepository.findUnique.mockResolvedValue({
        ...mockedRefreshToken,
        expiresAt: validFutureDate,
        revokedAt: null,
      });
      mockFindUniqueUserById.mockResolvedValue(null);

      await expect(
        refreshTokenService.verify({ token: mockedRefreshToken.token })
      ).rejects.toThrow(AuthDomainError);
    });

    it("should throw AuthUnexpectedError if repository throws unexpected error", async () => {
      mockRefreshTokenRepository.findUnique.mockRejectedValue(
        new Error("DB Error")
      );

      await expect(
        refreshTokenService.verify({ token: mockedRefreshToken.token })
      ).rejects.toThrow(AuthUnexpectedError);
    });
  });

  describe("revoke", () => {
    it("should revoke a refresh token successfully", async () => {
      const revokedToken = {
        ...mockedRefreshToken,
        revokedAt: new Date(),
      };
      mockRefreshTokenRepository.update.mockResolvedValue(revokedToken);

      const result = await refreshTokenService.revoke({
        token: mockedRefreshToken.token,
      });

      expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith({
        where: { token: mockedRefreshToken.token },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result.revokedAt).toBeInstanceOf(Date);
    });

    it("should throw AuthUnexpectedError if repository.update fails", async () => {
      mockRefreshTokenRepository.update.mockRejectedValue(
        new Error("DB Update Failed")
      );

      await expect(
        refreshTokenService.revoke({ token: mockedRefreshToken.token })
      ).rejects.toThrow(AuthUnexpectedError);
    });
  });
});
