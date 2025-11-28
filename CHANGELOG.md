# @khni/auth

## 1.2.0

### Minor Changes

🚀 Features

add BcryptjsHasher class

## 1.1.2

### Patch Changes

- Replace alias paths with relative paths after typescript compilation with tsc-alias

## 1.1.1

### Patch Changes

- fix exporting in index.ts

## 1.1.0

### Minor Changes

- - 🌐 **Social Authentication**: Google and Facebook OAuth 2.0 support
  - 🔧 **Multi-Provider System**: Extensible framework for additional social platforms
  - 📝 **Professional Logging**: Structured logging for production monitoring
  - �� **Comprehensive Documentation**: Complete social auth implementation guide

  - `SocialAuthContext` - Manage multiple social authentication providers
  - `SocialAuthLogin` - Complete social authentication flow with token generation
  - `GoogleSocialAuthStrategy` - Google OAuth 2.0 implementation
  - `FacebookSocialAuthStrategy` - Facebook OAuth implementation
  - Structured logging interface for audit and monitoring

  - Updated README with social authentication examples
  - Added JSDoc documentation for all new classes and interfaces
  - Improved error handling with contextual logging

  - Added `axios` and `qs` for social provider integration

  - ✅ **Backward Compatible**: All existing local authentication features unchanged
  - 🎯 **Production Ready**: Includes professional logging and error handling
  - 🔌 **Extensible**: Easy to add new social providers following the same pattern

## 1.0.0

### Major Changes

- - Add factory functions for lazy singleton service initialization (getAccessTokenService, getRefreshTokenService, getAuthTokensService)
  - Implement type-safe configuration management with createConfig
  - Add one-time logging mechanism for service initialization
  - Include module initialization function (initAuthTokensModule) for bootstrap
  - Provide test reset utility (\_\_resetAuthTokensModuleForTests) for testing
  - Export proper TypeScript interfaces (AccessTokenServiceConfig, RefreshTokenServiceConfig, AuthModuleConfig)

  The factory pattern ensures:

  - Services are initialized only on first access (lazy loading)
  - Singleton instances for all token services
  - Type-safe configuration with runtime validation
  - Optional logger integration with fallback to console
  - Proper separation of concerns between service creation and usage"

## 0.2.0

### Minor Changes

- implement hasher and token

## 0.1.0

### Minor Changes

- Implemented a comprehensive local authentication service with:

  - **User Management**: Create, verify, and manage users with local credentials
  - **Security**: Built-in password hashing and verification using bcrypt
  - **Flexibility**: Generic design supporting custom user types and services
  - **Validation**: Email and phone identifier validation with proper schema parsing
  - **Testing**: Complete test suite with Vitest and proper mocking
  - **Documentation**: Full JSDoc documentation for all public APIs

  - `createUser()` - Register new users with secure password hashing
  - `verifyPassword()` - Authenticate users with credential validation
  - `resetPassword()` - Update user passwords securely
  - `findUserByIdentifier()` - Look up users by email or phone

  This replaces any previous authentication implementation with a more robust, type-safe solution supporting both email and phone-based authentication.
