import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthDomainError } from "@khni/auth-errors";
import { AuthUnexpectedError } from "@khni/auth-errors";
import { parseIdentifier } from "../utils.js";
import { LocalAuthService } from "../LocalAuthService.js";

// ---- Dependency Mocks ----
const mockUserRepository = {
  findByIdentifier: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockHasher = {
  hash: vi.fn(),
  compare: vi.fn(),
};

// Mock identifierSchema
vi.mock("../utils.js");

// Test data
const mockUser = {
  id: "user-123",
  identifier: "test@example.com",
  password: "hashedPassword123",
  identifierType: "email" as const,
  name: "Test User",
};

const mockCreateData = {
  identifier: "test@example.com",
  password: "plainPassword123",
  name: "Test User",
};

let service: LocalAuthService<any, any>;

describe("LocalAuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service = new LocalAuthService(
      mockUserRepository as any,
      mockHasher as any
    );
  });

  // -------------------------------
  // CREATE USER
  // -------------------------------
  describe("createUser", () => {
    it("should successfully create user with unique identifier", async () => {
      // Mock successful flow

      vi.mocked(parseIdentifier).mockReturnValue({
        value: "test@example.com",
        type: "email",
      });
      mockUserRepository.findByIdentifier.mockResolvedValue(null);
      mockHasher.hash.mockResolvedValue("hashedPassword123");
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await service.createUser({
        data: mockCreateData,
      });

      expect(parseIdentifier).toHaveBeenCalledWith(mockCreateData.identifier);
      expect(mockUserRepository.findByIdentifier).toHaveBeenCalledWith({
        identifier: "test@example.com",
      });
      expect(mockHasher.hash).toHaveBeenCalledWith("plainPassword123");
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...mockCreateData,
        identifier: "test@example.com",
        identifierType: "email",
        password: "hashedPassword123",
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw AuthDomainError if identifier already used", async () => {
      vi.mocked(parseIdentifier).mockReturnValue({
        value: "test@example.com",
        type: "email",
      });
      mockUserRepository.findByIdentifier.mockResolvedValue(mockUser);

      await expect(
        service.createUser({
          data: mockCreateData,
        })
      ).rejects.toThrow(AuthDomainError);
    });

    it("should throw AuthUnexpectedError if identifier parsing fails", async () => {
      (parseIdentifier as any).mockImplementation(() => {
        throw new Error("Invalid identifier");
      });

      await expect(
        service.createUser({
          data: mockCreateData,
        })
      ).rejects.toBeInstanceOf(AuthUnexpectedError);
    });

    it("should throw AuthUnexpectedError if hasher.hash fails", async () => {
      vi.mocked(parseIdentifier).mockReturnValue({
        value: "test@example.com",
        type: "email",
      });
      mockUserRepository.findByIdentifier.mockResolvedValue(null);
      mockHasher.hash.mockRejectedValue(new Error("hash failed"));

      await expect(
        service.createUser({
          data: mockCreateData,
        })
      ).rejects.toBeInstanceOf(AuthUnexpectedError);
    });

    it("should throw AuthUnexpectedError if UserRepository.create fails", async () => {
      vi.mocked(parseIdentifier).mockReturnValue({
        value: "test@example.com",
        type: "email",
      });
      mockUserRepository.findByIdentifier.mockResolvedValue(null);
      mockHasher.hash.mockResolvedValue("hashedPassword123");
      mockUserRepository.create.mockRejectedValue(new Error("create failed"));

      await expect(
        service.createUser({
          data: mockCreateData,
        })
      ).rejects.toBeInstanceOf(AuthUnexpectedError);
    });
  });

  // -------------------------------
  // VERIFY PASSWORD
  // -------------------------------
  describe("verifyPassword", () => {
    it("should successfully verify password with valid credentials", async () => {
      mockUserRepository.findByIdentifier.mockResolvedValue(mockUser);
      mockHasher.compare.mockResolvedValue(true);

      const result = await service.verifyPassword({
        data: {
          identifier: "test@example.com",
          password: "plainPassword123",
        },
      });

      expect(mockUserRepository.findByIdentifier).toHaveBeenCalledWith({
        identifier: "test@example.com",
      });
      expect(mockHasher.compare).toHaveBeenCalledWith(
        "plainPassword123",
        mockUser.password
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw AuthDomainError for non-existent user", async () => {
      mockUserRepository.findByIdentifier.mockResolvedValue(null);

      await expect(
        service.verifyPassword({
          data: {
            identifier: "nonexistent@example.com",
            password: "password123",
          },
        })
      ).rejects.toMatchObject({
        code: "INCORRECT_CREDENTIALS",
      });
    });

    it("should throw AuthDomainError for non-local user", async () => {
      mockUserRepository.findByIdentifier.mockResolvedValue({
        ...mockUser,
        password: null,
      });

      await expect(
        service.verifyPassword({
          data: {
            identifier: "oauth@example.com",
            password: "password123",
          },
        })
      ).rejects.toMatchObject({
        code: "USER_NOT_LOCAL",
      });
    });

    it("should throw AuthDomainError for invalid password", async () => {
      mockUserRepository.findByIdentifier.mockResolvedValue(mockUser);
      mockHasher.compare.mockResolvedValue(false);

      await expect(
        service.verifyPassword({
          data: {
            identifier: "test@example.com",
            password: "wrong-password",
          },
        })
      ).rejects.toMatchObject({
        code: "INCORRECT_CREDENTIALS",
      });
    });

    it("should wrap unexpected errors into AuthUnexpectedError", async () => {
      mockUserRepository.findByIdentifier.mockRejectedValue(
        new Error("database down")
      );

      await expect(
        service.verifyPassword({
          data: {
            identifier: "test@example.com",
            password: "password123",
          },
        })
      ).rejects.toBeInstanceOf(AuthUnexpectedError);
    });
  });

  // -------------------------------
  // RESET PASSWORD
  // -------------------------------
  describe("resetPassword", () => {
    it("should successfully reset password", async () => {
      const updatedUser = { ...mockUser, password: "newHashedPassword" };
      mockHasher.hash.mockResolvedValue("newHashedPassword");
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.resetPassword({
        data: {
          identifier: "test@example.com",
          newPassword: "newPassword123",
        },
      });

      expect(mockHasher.hash).toHaveBeenCalledWith("newPassword123");
      expect(mockUserRepository.update).toHaveBeenCalledWith({
        data: { password: "newHashedPassword" },
        identifier: "test@example.com",
      });
      expect(result).toEqual(updatedUser);
    });

    it("should throw AuthUnexpectedError if hasher.hash fails", async () => {
      mockHasher.hash.mockRejectedValue(new Error("hash failed"));

      await expect(
        service.resetPassword({
          data: {
            identifier: "test@example.com",
            newPassword: "newPassword123",
          },
        })
      ).rejects.toBeInstanceOf(AuthUnexpectedError);
    });

    it("should throw AuthUnexpectedError if UserRepository.update fails", async () => {
      mockHasher.hash.mockResolvedValue("newHashedPassword");
      mockUserRepository.update.mockRejectedValue(new Error("update failed"));

      await expect(
        service.resetPassword({
          data: {
            identifier: "test@example.com",
            newPassword: "newPassword123",
          },
        })
      ).rejects.toBeInstanceOf(AuthUnexpectedError);
    });
  });

  // -------------------------------
  // FIND USER BY IDENTIFIER
  // -------------------------------
  describe("findUserByIdentifier", () => {
    it("should successfully find user by identifier", async () => {
      mockUserRepository.findByIdentifier.mockResolvedValue(mockUser);

      const result = await service.findUserByIdentifier("test@example.com");

      expect(mockUserRepository.findByIdentifier).toHaveBeenCalledWith({
        identifier: "test@example.com",
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      mockUserRepository.findByIdentifier.mockResolvedValue(null);

      const result = await service.findUserByIdentifier(
        "nonexistent@example.com"
      );

      expect(result).toBeNull();
    });

    it("should wrap unexpected errors into AuthUnexpectedError", async () => {
      mockUserRepository.findByIdentifier.mockRejectedValue(
        new Error("database down")
      );

      await expect(
        service.findUserByIdentifier("test@example.com")
      ).rejects.toBeInstanceOf(AuthUnexpectedError);
    });
  });

  // -------------------------------
  // ERROR HANDLING
  // -------------------------------
  describe("error handling", () => {
    it("should preserve AuthDomainError without wrapping", async () => {
      const domainError = new AuthDomainError("AUTH_UNVERIFIED_EMAIL");
      mockUserRepository.findByIdentifier.mockRejectedValue(domainError);

      await expect(
        service.findUserByIdentifier("test@example.com")
      ).rejects.toBe(domainError);
    });

    it("should include metadata in AuthUnexpectedError when provided", async () => {
      mockUserRepository.findByIdentifier.mockRejectedValue(
        new Error("database down")
      );

      try {
        await service.findUserByIdentifier("test@example.com");
      } catch (error) {
        expect(error).toBeInstanceOf(AuthUnexpectedError);
        if (error instanceof AuthUnexpectedError) {
          expect(error.meta).toEqual({ identifier: "test@example.com" });
        }
      }
    });
  });
});
