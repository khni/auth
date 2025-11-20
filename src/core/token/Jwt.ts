import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";

const { TokenExpiredError } = jwt; // Workaround for jsonwebtoken export issue

import { IToken, SignTokenOptions } from "./IToken.js";

/**
 * Safe signing options that prevent accidental use of numeric expiresIn values.
 * Extends jsonwebtoken's SignOptions but restricts expiresIn to string format.
 *
 * @public
 */
export type SafeSignOptions = Omit<SignOptions, "expiresIn"> & {
  expiresIn?: `${number}${"s" | "m" | "h" | "d"}`;
};

/**
 * JSON Web Token implementation that provides type-safe token operations.
 * This class handles signing and verification of JWT tokens with proper
 * expiration handling and payload typing.
 *
 * @typeParam T - The type of the payload object, must extend object
 *
 * @example
 * ```typescript
 * interface UserPayload { userId: string; role: string; }
 * const jwt = new Jwt<UserPayload>("secret-key");
 *
 * // Sign a token
 * const token = jwt.sign({ userId: "123", role: "admin" }, { expiresIn: "1h" });
 *
 * // Verify a token
 * const payload = jwt.verify(token);
 * ```
 *
 * @public
 */
export class Jwt<T extends object> implements IToken<T> {
  /**
   * Creates a new JWT instance with the specified secret.
   *
   * @param jwtSecret - The secret key used for signing and verifying tokens
   *
   * @public
   */
  constructor(private jwtSecret: string) {}

  /**
   * Signs a payload to create a JWT token with specified expiration.
   * Automatically removes any existing 'exp' or 'iat' claims from the payload
   * when expiresIn is provided to avoid conflicts.
   *
   * @param payload - The data to be encoded in the token
   * @param options - Configuration options including expiration time
   * @returns The signed JWT token string
   * @throws {Error} If expiresIn is provided as a number instead of string
   *
   * @example
   * ```typescript
   * const token = jwt.sign(
   *   { userId: "123", name: "John" },
   *   { expiresIn: "2h" }
   * );
   * ```
   *
   * @public
   */
  sign(payload: T, options: SignTokenOptions): string {
    if (options?.expiresIn && typeof options.expiresIn === "number") {
      throw new Error(
        `expiresIn should be a string like '10m' or '1h'. Passing a number means seconds, which may not be what you intended.`
      );
    }

    // If expiresIn is provided, remove existing exp and iat to avoid conflicts
    let cleanPayload = { ...payload };
    if (options?.expiresIn) {
      const { exp, iat, ...rest } = cleanPayload as any;
      cleanPayload = rest as T;
    }

    return jwt.sign(cleanPayload, this.jwtSecret, options);
  }

  /**
   * Verifies and decodes a JWT token, returning the original payload.
   * Throws an error if the token is expired, invalid, or malformed.
   *
   * @param token - The JWT token string to verify
   * @param options - Additional verification options from jsonwebtoken
   * @returns The decoded payload of type T
   * @throws {TokenExpiredError} If the token has expired
   * @throws {JsonWebTokenError} If the token is invalid
   * @throws {Error} For other verification failures
   *
   * @example
   * ```typescript
   * try {
   *   const payload = jwt.verify(token);
   *   console.log(payload.userId); // Type-safe access
   * } catch (error) {
   *   if (error instanceof TokenExpiredError) {
   *     // Handle expired token
   *   }
   * }
   * ```
   *
   * @public
   */
  verify(token: string, options?: VerifyOptions): T {
    try {
      return jwt.verify(token, this.jwtSecret, options) as T;
    } catch (error) {
      throw error;
    }
  }
}

// Re-export TokenExpiredError for consumer convenience
export { TokenExpiredError };
