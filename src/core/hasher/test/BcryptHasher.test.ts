import { describe, it, expect } from "vitest";
import { BcryptHasher } from "../BcryptHasher.js";
import { IHasher } from "../IHasher.js";

describe("IHasher Interface", () => {
  describe("Contract compliance", () => {
    it("should ensure BcryptHasher implements IHasher correctly", () => {
      const hasher: IHasher = new BcryptHasher();

      // TypeScript will check this at compile time, but we can verify at runtime too
      expect(hasher).toHaveProperty("hash");
      expect(hasher).toHaveProperty("compare");
      expect(typeof hasher.hash).toBe("function");
      expect(typeof hasher.compare).toBe("function");
    });

    it("should have correct method signatures", () => {
      const hasher: IHasher = new BcryptHasher();

      // Verify hash method returns Promise<string>
      const hashPromise = hasher.hash("test");
      expect(hashPromise).toBeInstanceOf(Promise);

      // Verify compare method returns Promise<boolean>
      const comparePromise = hasher.compare("test", "hash");
      expect(comparePromise).toBeInstanceOf(Promise);
    });
  });

  describe("Method requirements", () => {
    it("should require hash method to accept string and return Promise<string>", async () => {
      const hasher: IHasher = new BcryptHasher();

      // This is mostly a TypeScript compile-time test, but we can verify the shape
      expect(hasher.hash.length).toBe(1); // hash method takes 1 parameter
    });

    it("should require compare method to accept two strings and return Promise<boolean>", async () => {
      const hasher: IHasher = new BcryptHasher();

      // This is mostly a TypeScript compile-time test, but we can verify the shape
      expect(hasher.compare.length).toBe(2); // compare method takes 2 parameters
    });
  });
});
