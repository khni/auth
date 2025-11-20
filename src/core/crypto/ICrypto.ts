/**
 * Interface for cryptographic token generation operations.
 *
 * @public
 */
export interface ICrypto {
  /**
   * Generates a cryptographically secure random token in hexadecimal format.
   *
   * @param byteLength - The number of random bytes to generate (before hex encoding)
   * @returns A hexadecimal string representing the random bytes
   *
   * @public
   */
  generateHexToken(byteLength: number): string;

  /**
   * Generates a cryptographically secure random token in Base64 URL-safe format.
   *
   * @param byteLength - The number of random bytes to generate (before encoding)
   * @returns A Base64 URL-safe encoded string representing the random bytes
   *
   * @public
   */
  generateBase64UrlToken(byteLength: number): string;

  /**
   * Generates a cryptographically secure random UUID (Universally Unique Identifier).
   *
   * @returns A UUID string in the standard format
   *
   * @public
   */
  generateUUID(): string;
}
