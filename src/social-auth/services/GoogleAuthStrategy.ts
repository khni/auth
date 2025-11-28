import qs from "qs";
import {
  GoogleAuthConfig,
  Provider,
  SocialAuthProvider,
  SocialTokensResult,
  SocialUserResult,
} from "../interfaces/ISocialAuthProvider.js";
import { ILogger } from "core/Ilogger.js";

/**
 * Google OAuth 2.0 authentication strategy
 * @implements {SocialAuthProvider}
 * @public
 */
export class GoogleSocialAuthStrategy implements SocialAuthProvider {
  /**
   * Creates a new Google authentication strategy
   * @param googleAuthConfig - Google OAuth configuration
   * @param logger - Optional logger instance
   */
  constructor(
    private googleAuthConfig: GoogleAuthConfig,
    private logger?: ILogger
  ) {}

  /** @inheritdoc */
  provider: Provider = "google";

  /**
   * Exchange authorization code for Google OAuth tokens
   * @param code - Google authorization code
   * @returns Promise resolving to Google OAuth tokens
   * @throws Will throw an error if token exchange fails
   */
  async getTokens(code: string): Promise<SocialTokensResult> {
    this.logger?.debug("Exchanging code for Google OAuth tokens");

    const url = "https://oauth2.googleapis.com/token";
    const values = {
      code,
      client_id: this.googleAuthConfig.clientId,
      client_secret: this.googleAuthConfig.clientSecret,
      redirect_uri: this.googleAuthConfig.redirectUri,
      grant_type: "authorization_code",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: qs.stringify(values),
    });

    if (!res.ok) {
      const errorData = await res.json();
      const error = new Error(
        errorData.error || "Failed to fetch Google tokens"
      );
      this.logger?.error("Google token exchange failed", error, {
        status: res.status,
        statusText: res.statusText,
        errorDetails: errorData,
      });
      throw error;
    }

    const tokens = await res.json();
    this.logger?.debug("Google tokens exchange completed", {
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
    });

    return tokens;
  }

  /**
   * Get user profile from Google using access tokens
   * @param tokens - Google OAuth tokens
   * @returns Promise resolving to Google user profile
   * @throws Will throw an error if user info fetch fails
   */
  async getUser(tokens: SocialTokensResult): Promise<SocialUserResult> {
    this.logger?.debug("Fetching user profile from Google");

    const url = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokens.id_token}` },
    });

    if (!res.ok) {
      const errorData = await res.json();
      const error = new Error(
        errorData.error?.message || "Failed to fetch Google user"
      );
      this.logger?.error("Failed to fetch Google user profile", error, {
        status: res.status,
        statusText: res.statusText,
        errorDetails: errorData,
      });
      throw error;
    }

    const user = await res.json();

    this.logger?.debug("Google user profile retrieved", {
      userId: user.sub,
      email: user.email,
      name: user.name,
      emailVerified: user.verified_email,
    });

    return {
      id: user.sub,
      email: user.email,
      name: user.name,
      pictureUrl: user.picture,
      locale: user.locale,
      verified_email: user.verified_email,
    };
  }
}
