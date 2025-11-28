export type Provider = "google" | "facebook";
export interface SocialUserResult {
  id: string;
  email?: string;
  verified_email: boolean;
  name: string;
  pictureUrl: string;
  locale?: string;
}
export interface SocialTokensResult {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

/**
 * Interface for social authentication providers
 * @public
 */
export interface SocialAuthProvider {
  /** The authentication provider name */
  provider: Provider;

  /**
   * Exchange authorization code for access tokens
   * @param code - The authorization code received from the provider
   * @returns Promise resolving to social tokens
   */
  getTokens(code: string): Promise<SocialTokensResult>;

  /**
   * Get user profile information using access tokens
   * @param tokens - The social tokens obtained from getTokens
   * @returns Promise resolving to user profile information
   */
  getUser(tokens: SocialTokensResult): Promise<SocialUserResult>;
}

/**
 * Configuration for Google authentication
 * @public
 */
export type GoogleAuthConfig = {
  /** Google OAuth client ID */
  clientId: string;
  /** Google OAuth client secret */
  clientSecret: string;
  /** Redirect URI registered with Google */
  redirectUri: string;
};

/**
 * Configuration for Facebook authentication
 * @public
 */
export type FacebookAuthConfig = {
  /** Facebook App ID */
  appId: string;
  /** Facebook App Secret */
  appSecret: string;
  /** Redirect URI registered with Facebook */
  redirectUri: string;
};

// Add more providers as needed
// e.g., Twitter, LinkedIn, GitHub, etc.
// Each provider will have its own config type
// and implementation of the SocialAuthProvider interface
