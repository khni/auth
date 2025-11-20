import { IRefreshTokenRepository } from "auth-tokens/interfaces/IRefreshTokenRepository.js";
import { IUserRepository } from "local-auth/index.js";
import { Mocked, vi } from "vitest";

function createMockRepository<T>(): Mocked<T> {
  return {
    count: vi.fn(),
    create: vi.fn(),
    createTransaction: vi.fn().mockImplementation(async (callback) => {
      const fakeTx = {}; // a fake transaction object
      return callback(fakeTx);
    }),
    delete: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  } as unknown as Mocked<T>;
}

export const mockRefreshTokenRepository =
  createMockRepository<IRefreshTokenRepository>();

export const mockFindUniqueUserById: ReturnType<typeof vi.fn> = vi.fn();
