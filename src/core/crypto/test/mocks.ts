import { Mocked, vi } from "vitest";
import { ICrypto } from "../ICrypto.js";

export const mockCrypto: Mocked<ICrypto> = {
  generateHexToken: vi.fn(),
  generateBase64UrlToken: vi.fn(),
  generateUUID: vi.fn(),
};
