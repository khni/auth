import { ILogger } from "core/Ilogger.js";
import {
  Provider,
  SocialAuthProvider,
  SocialTokensResult,
  SocialUserResult,
} from "../interfaces/ISocialAuthProvider.js";
/**
 * Context for handling social authentication with multiple providers
 * @remarks
 * This class implements the strategy pattern to support multiple social auth providers
 * @public
 */
export class SocialAuthContext {
  /**
   * Creates a new SocialAuthContext
   * @param socialAuthProviders - Array of social authentication provider implementations
   * @param logger - Optional logger instance
   */
  constructor(
    private socialAuthProviders: SocialAuthProvider[],
    private logger?: ILogger
  ) {}

  private getStrategy = (provider: Provider) => {
    const strategy = this.socialAuthProviders.find(
      (socialAuthProvider) => socialAuthProvider.provider === provider
    );
    if (strategy) {
      return strategy;
    } else {
      const error = new Error("No strategy found for this provider type");
      this.logger?.error("Strategy not found", error, { provider });
      throw error;
    }
  };

  /**
   * Authenticate a user using a social provider
   * @param code - Authorization code from the social provider
   * @param provider - The social provider to use for authentication
   * @returns Promise resolving to tokens and user profile
   * @throws Will throw an error if the provider is not supported or authentication fails
   */
  async authenticate(
    code: string,
    provider: Provider
  ): Promise<{ tokens: SocialTokensResult; user: SocialUserResult }> {
    this.logger?.info("Starting social authentication", { provider });

    const strategy = this.getStrategy(provider);
    const tokens = await strategy.getTokens(code);

    this.logger?.debug("Tokens received from provider", {
      provider,
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
    });

    const user = await strategy.getUser(tokens);

    this.logger?.info("Social authentication completed successfully", {
      provider,
      userId: user.id,
      userEmail: user.email,
    });

    return { tokens, user };
  }
}
