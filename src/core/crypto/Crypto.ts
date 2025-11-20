import crypto from "crypto";

import { ICrypto } from "./ICrypto.js";

/**
 * A cryptographic token generator that implements the ICrypto interface.
 * Provides methods for generating secure random tokens in various formats.
 *
 * @public
 */
export class CryptoTokenGenerator implements ICrypto {
  /**
   * Generates a cryptographically secure random token in hexadecimal format.
   *
   * @param byteLength - The number of random bytes to generate (before hex encoding)
   * @returns A hexadecimal string representing the random bytes
   *
   * @example
   * ```typescript
   * const token = generator.generateHexToken(16); // 32-character hex string
   * ```
   *
   * @public
   */
  generateHexToken(byteLength: number): string {
    return crypto.randomBytes(byteLength).toString("hex");
  }

  /**
   * Generates a cryptographically secure random token in Base64 URL-safe format.
   *
   * @param byteLength - The number of random bytes to generate (before encoding)
   * @returns A Base64 URL-safe encoded string representing the random bytes
   *
   * @example
   * ```typescript
   * const token = generator.generateBase64UrlToken(16); // URL-safe base64 string
   * ```
   *
   * @public
   */
  generateBase64UrlToken(byteLength: number): string {
    return crypto.randomBytes(byteLength).toString("base64url");
  }

  /**
   * Generates a cryptographically secure random UUID (Universally Unique Identifier).
   *
   * @returns A UUID string in the format 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
   *
   * @example
   * ```typescript
   * const uuid = generator.generateUUID(); // 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
   * ```
   *
   * @public
   */
  generateUUID(): string {
    return crypto.randomUUID();
  }
}
