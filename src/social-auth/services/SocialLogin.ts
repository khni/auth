import { ILogger } from "@khni/core";
import { AuthTokensService } from "@khni/auth-tokens";
import {
  Provider,
  SocialUserResult,
} from "../interfaces/ISocialAuthProvider.js";
import { SocialAuthContext } from "./SocialAuthContext.js";

/**
 * Result of a social authentication login operation
 * @public
 */
export interface SocialAuthLoginResult<User> {
  /** JWT access token for API authentication */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Social user profile information */
  user: SocialUserResult;
  /** Application user entity */
  appUser: User;
}

/**
 * Service for handling social authentication login flow
 * @remarks
 * This class orchestrates the social authentication process including:
 * - Authenticating with the social provider
 * - Converting social user profiles to application users
 * - Generating application-specific authentication tokens
 * @typeParam User - The application's user entity type
 * @public
 */
export class SocialAuthLogin<User extends { id: string }> {
  /**
   * Creates a new SocialAuthLogin service
   * @param socialAuthContext - Context for social authentication strategies
   * @param authTokenService - Service for generating authentication tokens
   * @param handleSocialUser - Callback function to handle social user conversion
   * @param logger - Optional logger instance for tracking authentication flow
   */
  constructor(
    private socialAuthContext: SocialAuthContext,
    private authTokenService: AuthTokensService,
    private handleSocialUser: (
      user: SocialUserResult,
      provider: Provider
    ) => Promise<User>,
    private logger?: ILogger
  ) {}

  /**
   * Execute the social authentication login flow
   * @param code - Authorization code from the social provider
   * @param provider - Social provider to authenticate with
   * @returns Promise resolving to authentication tokens and user information
   * @throws Will throw an error if authentication fails at any step
   * @example
   * ```typescript
   * const result = await socialAuthLogin.execute(authCode, 'google');
   * console.log(result.accessToken); // JWT token for API calls
   * ```
   */
  async execute(
    code: string,
    provider: Provider
  ): Promise<SocialAuthLoginResult<User>> {
    this.logger?.info("Starting social authentication login flow", {
      provider,
      codeLength: code.length,
    });

    try {
      // Step 1: Authenticate with social provider
      this.logger?.debug("Authenticating with social provider", { provider });
      const { user: socialUser } = await this.socialAuthContext.authenticate(
        code,
        provider
      );

      this.logger?.debug("Social authentication successful", {
        provider,
        socialUserId: socialUser.id,
        socialUserEmail: socialUser.email,
      });

      // Step 2: Convert social user to application user
      this.logger?.debug("Converting social user to application user", {
        provider,
        socialUserId: socialUser.id,
      });

      const appUser = await this.handleSocialUser(socialUser, provider);

      this.logger?.debug("Social user conversion completed", {
        provider,
        socialUserId: socialUser.id,
        appUserId: appUser.id,
      });

      // Step 3: Generate application tokens
      this.logger?.debug("Generating authentication tokens", {
        appUserId: appUser.id,
      });

      const { accessToken, refreshToken } =
        await this.authTokenService.generate(appUser.id);

      this.logger?.info("Social authentication login completed successfully", {
        provider,
        appUserId: appUser.id,
        socialUserId: socialUser.id,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });

      return {
        accessToken,
        refreshToken,
        user: socialUser,
        appUser,
      };
    } catch (error) {
      this.logger?.error("Social authentication login failed", error as Error, {
        provider,
        codeLength: code?.length,
      });
      throw error;
    }
  }
}
