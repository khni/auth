/**
 * Supported time units for token expiration.
 *
 * @public
 */
export type TimeUnit = "ms" | "s" | "m" | "h" | "d";

/**
 * A valid time string in the format: number followed by time unit.
 * Examples: "10m", "1h", "7d", "30s"
 *
 * @public
 */
export type ValidTimeString = `${number}${TimeUnit}`;

/**
 * Options for signing tokens with expiration time.
 *
 * @public
 */
export type SignTokenOptions = { expiresIn: ValidTimeString };

/**
 * Interface for token signing and verification operations.
 *
 * @typeParam Payload - The type of the payload to be encoded in the token
 *
 * @public
 */
export interface IToken<Payload> {
  /**
   * Signs a payload to create a token with specified expiration.
   *
   * @param payload - The data to be encoded in the token
   * @param options - Configuration options including expiration time
   * @returns The signed token string
   *
   * @public
   */
  sign(payload: Payload, options: SignTokenOptions): string;

  /**
   * Verifies and decodes a token, returning the original payload.
   *
   * @param token - The token string to verify
   * @returns The decoded payload
   * @throws {Error} If the token is invalid, expired, or malformed
   *
   * @public
   */
  verify(token: string): Payload;
}
