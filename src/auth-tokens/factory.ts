/**
 * AuthTokensModule (Fully Lazy-Loaded)
 * ------------------------------------
 * A modular authentication token system that provides lazy-loaded singleton services
 * for access tokens, refresh tokens, and combined authentication operations.
 *
 * Features:
 * - Services are initialized only on first access
 * - Type-safe configuration management
 * - Singleton pattern for all services
 * - Lazy logging (logs only once per service initialization)
 * - Test-friendly with reset capability
 *
 * @example
 * ```typescript
 * // Initialize module once at application startup
 * initAuthTokensModule({
 *   jwtSecret: process.env.JWT_SECRET!,
 *   accessTokenExpiresIn: "15m",
 *   refreshTokenExpiresIn: "7d",
 *   refreshTokenRepository: new RedisRefreshTokenRepository(),
 *   findUniqueUserById: userService.findById.bind(userService),
 *   logger: console
 * });
 *
 * // Use services (they'll be initialized on first access)
 * const authService = getAuthTokensService();
 * const tokens = await authService.generateTokens("user-123");
 * ```
 *
 * @public
 */

import { Jwt, CryptoTokenGenerator, ValidTimeString } from "@khni/core";
import { AccessTokenService } from "./AccessTokenService.js";
import {
  RefreshTokenService,
  FindUniqueUserById,
} from "./RefreshTokenService.js";
import { IRefreshTokenRepository } from "./interfaces/IRefreshTokenRepository.js";
import { createConfig, generateExpiredDate } from "@khni/utils";
import { AuthTokensService } from "./AuthTokensService.js";

/* ============================================================================
 * TYPES
 * ==========================================================================*/

/**
 * Configuration options for the AccessTokenService.
 *
 * @public
 */
export interface AccessTokenServiceConfig {
  /** Secret key used for JWT signing and verification */
  jwtSecret: string;

  /** Expiration time for access tokens (e.g., "15m", "1h", "7d") */
  accessTokenExpiresIn: ValidTimeString;

  /** Optional logger for service initialization and operations */
  logger?: { info: (msg: string) => void };
}

/**
 * Configuration options for the RefreshTokenService.
 *
 * @public
 */
export interface RefreshTokenServiceConfig {
  /** Repository for refresh token persistence operations */
  refreshTokenRepository: IRefreshTokenRepository;

  /** Expiration time for refresh tokens (e.g., "7d", "30d") */
  refreshTokenExpiresIn: ValidTimeString;

  /** Function to find users by ID for token validation */
  findUniqueUserById: FindUniqueUserById;

  /** Optional logger for service initialization and operations */
  logger?: { info: (msg: string) => void };
}

/**
 * Combined configuration for the entire AuthTokensModule.
 * Merges both access token and refresh token service configurations.
 *
 * @public
 */
export type AuthModuleConfig = AccessTokenServiceConfig &
  RefreshTokenServiceConfig;

/* ============================================================================
 * CONFIG STORAGE
 * ==========================================================================*/

/**
 * Configuration manager for the AuthTokensModule.
 * Provides type-safe configuration storage and retrieval.
 *
 * @public
 */
export const authTokensConfig =
  createConfig<AuthModuleConfig>("AuthTokensModule");

/* ============================================================================
 * SINGLETON SERVICES
 * ==========================================================================*/

let _accessTokenService: AccessTokenService | null = null;
let _refreshTokenService: RefreshTokenService | null = null;
let _authTokensService: AuthTokensService | null = null;

/* ============================================================================
 * LOGGER GUARD
 * ==========================================================================*/

const _loggedServices: Record<string, boolean> = {};

/**
 * Logs service initialization only once per service lifetime.
 *
 * @param serviceName - The name of the service being initialized
 * @param config - Optional configuration containing logger
 *
 * @internal
 */
function logOnce(
  serviceName: string,
  config?: { logger?: { info: (msg: string) => void } }
) {
  if (!_loggedServices[serviceName]) {
    const message = `[AuthTokensModule] ${serviceName} initialized`;
    if (config?.logger) config.logger.info(message);
    else console.log(message);
    _loggedServices[serviceName] = true;
  }
}

/* ============================================================================
 * LAZY SINGLETON GETTERS
 * ==========================================================================*/

/**
 * Returns singleton AccessTokenService (lazy-loaded).
 * The service is created on first access and reused thereafter.
 *
 * @returns The singleton AccessTokenService instance
 * @throws {Error} If the AuthTokensModule has not been initialized
 *
 * @example
 * ```typescript
 * const accessTokenService = getAccessTokenService();
 * const token = accessTokenService.generateAccessToken("user-123");
 * ```
 *
 * @public
 */
export function getAccessTokenService(): AccessTokenService {
  if (!_accessTokenService) {
    const config = authTokensConfig.get();
    const jwt = new Jwt<{ userId: string }>(config.jwtSecret);
    _accessTokenService = new AccessTokenService(
      jwt,
      config.accessTokenExpiresIn
    );
    logOnce("AccessTokenService", config);
  }
  return _accessTokenService;
}

/**
 * Returns singleton RefreshTokenService (lazy-loaded).
 * The service is created on first access and reused thereafter.
 *
 * @returns The singleton RefreshTokenService instance
 * @throws {Error} If the AuthTokensModule has not been initialized
 *
 * @example
 * ```typescript
 * const refreshTokenService = getRefreshTokenService();
 * const refreshToken = await refreshTokenService.generateRefreshToken("user-123");
 * ```
 *
 * @public
 */
export function getRefreshTokenService(): RefreshTokenService {
  if (!_refreshTokenService) {
    const config = authTokensConfig.get();
    const crypto = new CryptoTokenGenerator();
    _refreshTokenService = new RefreshTokenService(
      config.refreshTokenRepository,
      crypto,
      generateExpiredDate,
      config.refreshTokenExpiresIn,
      config.findUniqueUserById
    );
    logOnce("RefreshTokenService", config);
  }
  return _refreshTokenService;
}

/**
 * Returns singleton AuthTokensService (lazy-loaded).
 * The service is created on first access and reused thereafter.
 * This service provides combined operations for both access and refresh tokens.
 *
 * @returns The singleton AuthTokensService instance
 * @throws {Error} If the AuthTokensModule has not been initialized
 *
 * @example
 * ```typescript
 * const authService = getAuthTokensService();
 * const tokens = await authService.generateTokens("user-123");
 * const result = await authService.refreshTokens(oldRefreshToken);
 * ```
 *
 * @public
 */
export function getAuthTokensService(): AuthTokensService {
  if (!_authTokensService) {
    const access = getAccessTokenService(); // ensures singleton & lazy
    const refresh = getRefreshTokenService(); // ensures singleton & lazy
    _authTokensService = new AuthTokensService(refresh, access);
    logOnce("AuthTokensService", authTokensConfig.get());
  }
  return _authTokensService;
}

/* ============================================================================
 * CONVENIENCE INITIALIZER
 * ==========================================================================*/

/**
 * Initialize the AuthTokensModule configuration.
 * This must be called once before accessing any services.
 * Does NOT create any services until they are first accessed.
 *
 * @param config - The complete authentication module configuration
 *
 * @example
 * ```typescript
 * initAuthTokensModule({
 *   jwtSecret: "your-secret-key",
 *   accessTokenExpiresIn: "15m",
 *   refreshTokenExpiresIn: "7d",
 *   refreshTokenRepository: new MyRefreshTokenRepository(),
 *   findUniqueUserById: async (id) => await userModel.findById(id),
 *   logger: console
 * });
 * ```
 *
 * @public
 */
export function initAuthTokensModule(config: AuthModuleConfig) {
  authTokensConfig.set(config);
}

/* ============================================================================
 * TEST RESET
 * ==========================================================================*/

/**
 * Resets all singleton services and logged state for testing purposes.
 * This function should only be used in test environments.
 *
 * @example
 * ```typescript
 * // In your test setup
 * afterEach(() => {
 *   __resetAuthTokensModuleForTests();
 * });
 * ```
 *
 * @internal
 */
export function __resetAuthTokensModuleForTests() {
  _accessTokenService = null;
  _refreshTokenService = null;
  _authTokensService = null;
  Object.keys(_loggedServices).forEach((k) => delete _loggedServices[k]);
}
