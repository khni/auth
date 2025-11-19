import bcrypt from "bcrypt";

import { IHasher } from "./IHasher.js";

/**
 * BCrypt implementation of the cryptographic hashing service
 *
 * @remarks
 * Uses the bcrypt algorithm with 10 salt rounds for secure password hashing.
 * BCrypt automatically handles salt generation and incorporates it into the hash.
 *
 * @public
 */
export class BcryptHasher implements IHasher {
  /**
   * Generates a secure bcrypt hash from plain text
   *
   * @remarks
   * Uses 10 salt rounds which provides a good balance between security and performance.
   * The resulting hash includes:
   * - Algorithm identifier
   * - Cost factor
   * - 128-bit salt
   * - 184-bit hash
   *
   * @param text - Plain text password to hash
   * @returns Promise resolving to bcrypt hash string
   *
   * @throws {Error} When bcrypt hashing fails (invalid input, system resource issues)
   *
   * @example
   * ```typescript
   * const hasher = new BcryptHasher();
   * const hash = await hasher.hash('userPassword');
   * // Store hash in database: '$2b$10$X12aC9b6B9Uf9Z8Z9Y8Z9O...'
   * ```
   */
  async hash(text: string): Promise<string> {
    return bcrypt.hash(text, 10);
  }

  /**
   * Verifies plain text against a bcrypt hash
   *
   * @remarks
   * Securely compares the provided text with the stored hash by:
   * 1. Extracting salt and cost factor from the stored hash
   * 2. Hashing the input text with the same parameters
   * 3. Comparing the resulting hashes in constant time
   *
   * @param text - Plain text password to verify
   * @param hash - Previously generated bcrypt hash
   * @returns Promise resolving to true if text matches hash, false otherwise
   *
   * @throws {Error} When bcrypt comparison fails (invalid hash format, system issues)
   *
   * @example
   * ```typescript
   * const hasher = new BcryptHasher();
   * const isValid = await hasher.compare(
   *   'userInputPassword',
   *   '$2b$10$X12aC9b6B9Uf9Z8Z9Y8Z9O...'
   * );
   * if (isValid) {
   *   console.log('Password is correct');
   * }
   * ```
   */
  async compare(text: string, hash: string): Promise<boolean> {
    return bcrypt.compare(text, hash);
  }
}
