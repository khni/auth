/**
 * Cryptographic hashing service contract
 *
 * @remarks
 * Provides secure password hashing and verification capabilities.
 * This interface abstracts the underlying hashing algorithm, allowing
 * for easy implementation swaps (bcrypt, argon2, etc.).
 *
 * @public
 */
export interface IHasher {
  /**
   * Hashes plain text into a secure cryptographic hash
   *
   * @param text - Plain text to hash (typically a password)
   * @returns Promise resolving to the generated hash string
   *
   * @throws {Error} When hashing operation fails
   *
   * @example
   * ```typescript
   * const hasher = new BcryptHasher();
   * const hash = await hasher.hash('myPassword123');
   * // Output: '$2b$10$X12aC9b6B9Uf9Z8Z9Y8Z9O...'
   * ```
   */
  hash(text: string): Promise<string>;

  /**
   * Compares plain text against a cryptographic hash
   *
   * @param text - Plain text to verify (typically a password)
   * @param hash - Previously generated hash to compare against
   * @returns Promise resolving to boolean indicating match status
   *
   * @throws {Error} When comparison operation fails
   *
   * @example
   * ```typescript
   * const isValid = await hasher.compare('myPassword123', storedHash);
   * if (isValid) {
   *   // Password is correct
   * }
   * ```
   */
  compare(text: string, hash: string): Promise<boolean>;
}
