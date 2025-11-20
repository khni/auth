import { Jwt, CryptoTokenGenerator, ValidTimeString } from "@khni/core";
import { AccessTokenService } from "./AccessTokenService.js";
import {
  RefreshTokenService,
  FindUniqueUserById,
} from "./RefreshTokenService.js";
import { IRefreshTokenRepository } from "./interfaces/IRefreshTokenRepository.js";
import { generateExpiredDate } from "@khni/utils";
import { AuthTokensService } from "./AuthTokensService.js";

/* ============================================================================
 * TYPES
 * ==========================================================================*/

/**
 * @public
 * Configuration needed to create an {@link AccessTokenService}.
 */
export interface AccessTokenServiceConfig {
  /** JWT secret used to sign access tokens. */
  jwtSecret: string;

  /** Token expiration time (e.g., `"1h"`, `"30m"`). */
  accessTokenExpiresIn: ValidTimeString;
}

/**
 * @public
 * Configuration needed to create a {@link RefreshTokenService}.
 */
export interface RefreshTokenServiceConfig {
  /** Repository responsible for storing & retrieving refresh tokens. */
  refreshTokenRepository: IRefreshTokenRepository;

  /** Expiration time for refresh tokens. */
  refreshTokenExpiresIn: ValidTimeString;

  /** Function to find a user by ID (used to validate tokens). */
  findUniqueUserById: FindUniqueUserById;
}

/**
 * @public
 * Configuration used to initialize the entire Auth module.
 */
export type AuthModuleConfig = AccessTokenServiceConfig &
  RefreshTokenServiceConfig;

/**
 * @public
 * Bundled set of all authentication-related services.
 */
export interface AuthServices {
  /** Access token generation & validation logic. */
  accessTokenService: AccessTokenService;

  /** Refresh token creation, rotation, storage, and validation logic. */
  refreshTokenService: RefreshTokenService;

  /** Combined API for generating both access & refresh tokens. */
  authTokensService: AuthTokensService;
}

/* ============================================================================
 * INDIVIDUAL FACTORIES
 * ==========================================================================*/

/**
 * Creates a standalone {@link AccessTokenService}.
 *
 * @public
 * @remarks
 * Use this function if you only need access token functionality.
 *
 * @param config - Service configuration.
 * @returns A new {@link AccessTokenService} instance.
 */
export const getAccessTokenService = (
  config: AccessTokenServiceConfig
): AccessTokenService => {
  const jwt = new Jwt<{ userId: string }>(config.jwtSecret);
  return new AccessTokenService(jwt, config.accessTokenExpiresIn);
};

/**
 * Creates a standalone {@link RefreshTokenService}.
 *
 * @public
 * @remarks
 * Use this function if you only need refresh token handling functionality.
 *
 * @param config - Service configuration.
 * @returns A new {@link RefreshTokenService} instance.
 */
export const getRefreshTokenService = (
  config: RefreshTokenServiceConfig
): RefreshTokenService => {
  const crypto = new CryptoTokenGenerator();

  return new RefreshTokenService(
    config.refreshTokenRepository,
    crypto,
    generateExpiredDate,
    config.refreshTokenExpiresIn,
    config.findUniqueUserById
  );
};

/**
 * @public
 * Configuration used to initialize the authentication module.
 */

/**
 * Creates the full authentication service, returning ONLY the composed
 * {@link AuthTokensService} instance.
 *
 * @public
 * @remarks
 * This is the recommended best-practice for production systems.
 * It creates shared utilities (`Jwt`, `CryptoTokenGenerator`) **once**,
 * making it highly resource-efficient.
 *
 * Call this function once at server startup and reuse the returned instance.
 *
 * @example
 * ```ts
 * const authTokensService = createAuthTokenService({
 *   jwtSecret: process.env.JWT_SECRET!,
 *   accessTokenExpiresIn: "1h",
 *   refreshTokenExpiresIn: "7d",
 *   refreshTokenRepository,
 *   findUniqueUserById,
 * });
 *
 * const tokens = await authTokensService.createTokens(user);
 * ```
 *
 * @param config - Full module configuration.
 * @returns The fully composed {@link AuthTokensService}.
 */
export const createAuthTokenService = (
  config: AuthModuleConfig
): AuthTokensService => {
  // Shared utility instances
  const jwt = new Jwt<{ userId: string }>(config.jwtSecret);
  const crypto = new CryptoTokenGenerator();

  // Access token service
  const accessTokenService = new AccessTokenService(
    jwt,
    config.accessTokenExpiresIn
  );

  // Refresh token service
  const refreshTokenService = new RefreshTokenService(
    config.refreshTokenRepository,
    crypto,
    generateExpiredDate,
    config.refreshTokenExpiresIn,
    config.findUniqueUserById
  );

  // Compose both into the combined Auth Tokens Service
  return new AuthTokensService(refreshTokenService, accessTokenService);
};
