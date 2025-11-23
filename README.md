# @khni/auth - Authentication Service

A robust, type-safe authentication service for Node.js applications with support for local (email/phone) and social authentication providers.

## 🚀 Features

- **🔐 Secure Authentication** - Password hashing with bcrypt and configurable hashers
- **📧 Multi-Identifier Support** - Email and phone number authentication
- **🌐 Social Auth** - Google, Facebook, and extensible provider system
- **🛡️ Type-Safe** - Full TypeScript support with generic types
- **📖 Comprehensive API** - Complete authentication flow (register, login, reset, social)
- **🧪 Fully Tested** - 100% test coverage with Vitest
- **📚 Well Documented** - JSDoc documentation compatible with API Extractor
- **🎯 Error Handling** - Domain-specific and unexpected error handling
- **📝 Professional Logging** - Structured logging for production environments

## 📦 Installation

```bash
npm install @khni/auth
pnpm add @khni/auth
yarn add @khni/auth
```

## 🏗️ Architecture

### Authentication Services

The service follows a clean architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Layer                     │
├─────────────────┐ ┌──────────────────┐ ┌───────────────────┤
│ LocalAuthService│ │ SocialAuthContext│ │ SocialAuthLogin   │
└─────────────────┘ └──────────────────┘ └───────────────────┘
         │                         │                  │
         │                         │                  │
┌────────▼────────┐    ┌───────────▼──────────┐       │
│  IUserRepository│    │ SocialAuthProvider   │       │
└─────────────────┘    └──────────────────────┘       │
         │                         │                  │
┌────────▼────────┐    ┌───────────▼──────────┐ ┌─────▼──────┐
│   Your User DB  │    │ Google  │ Facebook   │ │AuthTokens  │
└─────────────────┘    └──────────────────────┘ └────────────┘
```

## 🔧 Quick Start

### 1. Define Your User Type

```typescript
interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  identifierType: "email" | "phone" | "social";
  socialProvider?: "google" | "facebook";
  socialId?: string;
}

interface CreateUserData {
  identifier: string;
  password?: string;
  name: string;
  identifierType: "email" | "phone" | "social";
}
```

### 2. Local Authentication Setup

#### Implement Your User Repository

```typescript
import { IUserRepository, BaseCreateUserData } from "@khni/auth";

class UserRepository implements IUserRepository<User, CreateUserData> {
  async findByIdentifier({
    identifier,
  }: {
    identifier: string;
  }): Promise<User | null> {
    // Your database lookup logic
    return await db.users.findByEmail(identifier);
  }

  async create(data: CreateUserData): Promise<User> {
    // Your user creation logic
    return await db.users.create(data);
  }

  async update({
    data,
    identifier,
  }: {
    data: Partial<User>;
    identifier: string;
  }): Promise<User> {
    // Your user update logic
    return await db.users.update(identifier, data);
  }
}
```

#### Set Up Local Authentication Service

```typescript
import { LocalAuthService, BcryptHasher } from "@khni/auth";

const userRepository = new UserRepository();
const authService = new LocalAuthService<User, userRepository>(userRepository);
```

### 3. Social Authentication Setup

#### Configure Social Providers

```typescript
import {
  GoogleSocialAuthStrategy,
  FacebookSocialAuthStrategy,
  SocialAuthContext,
  SocialAuthLogin,
} from "@khni/auth";

// Configure Google
const googleStrategy = new GoogleSocialAuthStrategy({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

// Configure Facebook
const facebookStrategy = new FacebookSocialAuthStrategy({
  appId: process.env.FACEBOOK_APP_ID,
  appSecret: process.env.FACEBOOK_APP_SECRET,
  redirectUri: process.env.FACEBOOK_REDIRECT_URI,
});

// Create social auth context
const socialAuthContext = new SocialAuthContext([
  googleStrategy,
  facebookStrategy,
  // Add more providers as needed
]);
```

#### Set Up Social Authentication Service

```typescript
import { AuthTokensService } from "@khni/auth";

const authTokenService = new AuthTokensService({
  secret: process.env.JWT_SECRET,
  expiresIn: "1h",
});

const socialAuthLogin = new SocialAuthLogin(
  socialAuthContext,
  authTokenService,
  async (socialUser, provider) => {
    // Handle social user conversion to your app user
    let user = await userRepository.findByIdentifier({
      identifier: socialUser.email,
    });

    if (!user) {
      // Create new user from social profile
      user = await userRepository.create({
        identifier: socialUser.email,
        name: socialUser.name,
        identifierType: "social",
        socialProvider: provider,
        socialId: socialUser.id,
      });
    }

    return user;
  }
);
```

### 4. Use in Your Application

#### Local Authentication

```typescript
// Register a new user
const user = await authService.createUser({
  data: {
    identifier: "user@example.com",
    password: "securePassword123",
    name: "John Doe",
  },
});

// Authenticate user for login
const authenticatedUser = await authService.verifyPassword({
  data: {
    identifier: "user@example.com",
    password: "securePassword123",
  },
});

// Reset password
await authService.resetPassword({
  data: {
    identifier: "user@example.com",
    newPassword: "newSecurePassword456",
  },
});
```

#### Social Authentication

```typescript
// Handle social authentication callback
app.get("/auth/:provider/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { provider } = req.params;

    const result = await socialAuthLogin.execute(
      code as string,
      provider as Provider
    );

    // Return tokens and user info to client
    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.appUser,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Example: Google OAuth flow initiation
app.get("/auth/google", (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
    {
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "email profile",
      access_type: "offline",
      prompt: "consent",
    }
  )}`;

  res.redirect(authUrl);
});
```

## 🌐 Social Authentication Providers

### Supported Providers

- **Google** - OAuth 2.0 with profile and email scope
- **Facebook** - OAuth with user profile data
- **Extensible** - Easy to add new providers (Twitter, GitHub, LinkedIn, etc.)

### Provider Configuration

#### Google OAuth

```typescript
const googleConfig = {
  clientId: "your-google-client-id",
  clientSecret: "your-google-client-secret",
  redirectUri: "https://yourapp.com/auth/google/callback",
};
```

#### Facebook OAuth

```typescript
const facebookConfig = {
  appId: "your-facebook-app-id",
  appSecret: "your-facebook-app-secret",
  redirectUri: "https://yourapp.com/auth/facebook/callback",
};
```

### Adding Custom Providers

Implement the `SocialAuthProvider` interface:

```typescript
class CustomSocialAuthStrategy implements SocialAuthProvider {
  provider: Provider = "custom";

  constructor(private config: CustomAuthConfig) {}

  async getTokens(code: string): Promise<SocialTokensResult> {
    // Exchange code for tokens
  }

  async getUser(tokens: SocialTokensResult): Promise<SocialUserResult> {
    // Fetch user profile with access token
  }
}
```

## 📖 API Reference

### LocalAuthService

[Previous LocalAuthService documentation remains the same...]

### SocialAuthContext

#### Constructor

```typescript
new SocialAuthContext(
  socialAuthProviders: SocialAuthProvider[],
  logger?: SocialAuthLogger
)
```

#### Methods

##### `authenticate`

Authenticates a user using a social provider's authorization code.

```typescript
authenticate(
  code: string,
  provider: Provider
): Promise<{ tokens: SocialTokensResult; user: SocialUserResult }>
```

### SocialAuthLogin

#### Constructor

```typescript
new SocialAuthLogin<User>(
  socialAuthContext: SocialAuthContext,
  authTokenService: AuthTokensService,
  handleSocialUser: (user: SocialUserResult, provider: Provider) => Promise<User>,
  logger?: SocialAuthLogger
)
```

#### Methods

##### `execute`

Executes the complete social authentication login flow.

```typescript
execute(
  code: string,
  provider: Provider
): Promise<SocialAuthLoginResult<User>>
```

**Returns:**

```typescript
{
  accessToken: string; // JWT access token
  refreshToken: string; // Refresh token
  user: SocialUserResult; // Social provider user data
  appUser: User; // Your application user
}
```

### Interfaces

#### SocialAuthProvider

```typescript
interface SocialAuthProvider {
  provider: Provider;
  getTokens(code: string): Promise<SocialTokensResult>;
  getUser(tokens: SocialTokensResult): Promise<SocialUserResult>;
}
```

#### SocialUserResult

```typescript
interface SocialUserResult {
  id: string;
  email: string;
  name: string;
  pictureUrl?: string;
  locale?: string;
  verified_email: boolean;
}
```

## 🔧 Advanced Features

### Professional Logging

The service includes structured logging for production environments:

```typescript
interface SocialAuthLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

// Example with Winston
const logger: SocialAuthLogger = {
  debug: (message, meta) => winston.debug(message, meta),
  info: (message, meta) => winston.info(message, meta),
  warn: (message, meta) => winston.warn(message, meta),
  error: (message, error, meta) => winston.error(message, { error, ...meta }),
};
```

### Error Handling

Social authentication includes comprehensive error handling:

```typescript
try {
  const result = await socialAuthLogin.execute(code, provider);
} catch (error) {
  if (error instanceof AuthDomainError) {
    // Handle business logic errors
  } else if (error instanceof AuthUnexpectedError) {
    // Handle system errors
  } else {
    // Handle unknown errors
  }
}
```

## 🛡️ Security Considerations

### Social Authentication

- **Token Validation** - All OAuth tokens are properly validated
- **User Verification** - Email verification status is checked where available
- **Secure Redirect URIs** - Proper redirect URI validation
- **No Token Logging** - Sensitive tokens are never logged

### Environment Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://yourapp.com/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=https://yourapp.com/auth/facebook/callback

# JWT Tokens
JWT_SECRET=your_jwt_secret
```

## 🧪 Testing Social Auth

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SocialAuthLogin, SocialAuthContext } from "@khni/auth";

describe("SocialAuthLogin", () => {
  let socialAuthLogin: SocialAuthLogin<any>;
  let mockSocialAuthContext: SocialAuthContext;
  let mockAuthTokenService: AuthTokensService;

  beforeEach(() => {
    // Setup mocks
    socialAuthLogin = new SocialAuthLogin(
      mockSocialAuthContext,
      mockAuthTokenService,
      async (user, provider) => ({ id: "user-123", ...user }),
      mockLogger
    );
  });

  it("should handle social authentication successfully", async () => {
    // Test social auth flow
  });
});
```

## 🔄 Migration Guide

### Adding Social Authentication to Existing App

1. **Install Dependencies** - Ensure you have the latest version
2. **Update User Schema** - Add social authentication fields
3. **Configure Providers** - Set up Google, Facebook, etc.
4. **Add Routes** - Create OAuth initiation and callback routes
5. **Update UI** - Add social login buttons to your frontend

### From Local-Only to Hybrid

```typescript
// Before: Local only
const authService = new LocalAuthService(userRepository);

// After: Hybrid (local + social)
const authService = new LocalAuthService(userRepository);
const socialAuthLogin = new SocialAuthLogin(
  socialAuthContext,
  authTokenService,
  handleSocialUser
);
```

## 🤝 Contributing

[Previous contributing section remains the same...]

## 📄 License

MIT License - see LICENSE file for details
