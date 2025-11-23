import axios from "axios";
import {
  FacebookAuthConfig,
  Provider,
  SocialAuthProvider,
  SocialTokensResult,
  SocialUserResult,
} from "../interfaces/ISocialAuthProvider.js";
import { ILogger } from "core/Ilogger.js";

/**
 * Facebook OAuth authentication strategy
 * @implements {SocialAuthProvider}
 * @public
 */
export class FacebookSocialAuthStrategy implements SocialAuthProvider {
  /**
   * Creates a new Facebook authentication strategy
   * @param facebookAuthConfig - Facebook OAuth configuration
   * @param logger - Optional logger instance
   */
  constructor(
    private facebookAuthConfig: FacebookAuthConfig,
    private logger?: ILogger
  ) {}

  /** @inheritdoc */
  provider: Provider = "facebook";

  /**
   * Exchange authorization code for Facebook OAuth tokens
   * @param code - Facebook authorization code
   * @returns Promise resolving to Facebook OAuth tokens
   * @throws Will throw an error if token exchange fails
   */
  async getTokens(code: string): Promise<SocialTokensResult> {
    this.logger?.debug("Exchanging code for Facebook OAuth tokens");

    const params = new URLSearchParams({
      client_id: this.facebookAuthConfig.appId,
      client_secret: this.facebookAuthConfig.appSecret,
      redirect_uri: this.facebookAuthConfig.redirectUri,
      code,
    });

    try {
      const res = await axios.get(
        "https://graph.facebook.com/v6.0/oauth/access_token",
        { params }
      );

      this.logger?.debug("Facebook tokens exchange completed", {
        tokenType: res.data.token_type,
        expiresIn: res.data.expires_in,
      });

      return res.data;
    } catch (error) {
      this.logger?.error("Facebook token exchange failed", error as Error, {
        appId: this.facebookAuthConfig.appId,
        redirectUri: this.facebookAuthConfig.redirectUri,
      });
      throw error;
    }
  }

  /**
   * Get user profile from Facebook using access tokens
   * @param tokens - Facebook OAuth tokens
   * @returns Promise resolving to Facebook user profile
   * @throws Will throw an error if user info fetch fails
   */
  async getUser(tokens: SocialTokensResult): Promise<SocialUserResult> {
    this.logger?.debug("Fetching user profile from Facebook");

    try {
      const res = await axios.get("https://graph.facebook.com/me", {
        params: {
          fields: "id,name,email,locale,picture",
          access_token: tokens.access_token,
        },
      });

      const user = res.data;

      this.logger?.debug("Facebook user profile retrieved", {
        userId: user.id,
        email: user.email,
        name: user.name,
        hasPicture: !!user.picture?.data?.url,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        pictureUrl: user.picture?.data?.url,
        locale: user.locale,
        verified_email: Boolean(user.email),
      };
    } catch (error) {
      this.logger?.error(
        "Failed to fetch Facebook user profile",
        error as Error,
        {
          hasAccessToken: !!tokens.access_token,
        }
      );
      throw error;
    }
  }
}
