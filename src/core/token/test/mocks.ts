import { vi } from "vitest";

export const mockToken = {
  sign: vi.fn(),
  verify: vi.fn(),
};
