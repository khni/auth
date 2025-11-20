# @khni/auth

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
