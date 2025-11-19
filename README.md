# @khni/auth - Local Authentication Service

A robust, type-safe local authentication service for Node.js applications with support for email and phone-based authentication.

## 🚀 Features

- **🔐 Secure Authentication** - Password hashing with bcrypt and configurable hashers
- **📧 Multi-Identifier Support** - Email and phone number authentication
- **🛡️ Type-Safe** - Full TypeScript support with generic types
- **📖 Comprehensive API** - Complete authentication flow (register, login, reset)
- **🧪 Fully Tested** - 100% test coverage with Vitest
- **📚 Well Documented** - JSDoc documentation compatible with API Extractor
- **🎯 Error Handling** - Domain-specific and unexpected error handling

## 📦 Installation

```bash
npm install @khni/auth
pnpm add @khni/auth
yarn add @khni/auth
```

## 🏗️ Architecture

### LocalAuthService

The service follows a clean architecture pattern with clear separation of concerns:

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────┐
│ LocalAuthService│ ── │   IUserRepository   │ ── │ Your User DB │
└─────────────────┘    └──────────────────┘    └──────────────┘
         │
         │
┌────────▼────────┐    ┌─────────────────┐
│    IHasher      │ ── │ BcryptHasher    │
└─────────────────┘    └─────────────────┘
```

## 🔧 Quick Start

### 1. Define Your User Type

```typescript
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  identifierType: "email" | "phone";
}

interface CreateUserData {
  identifier: string;
  password: string;
  name: string;
}
```

### 2. Implement Your User Service

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

// with prisma

import { PrismaClient } from "@prisma/client";
import { IUserRepository } from "@khni/auth";
import { BaseCreateUserData } from "@khni/auth";

// Your User type matching Prisma model
export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  identifierType: "email" | "phone";
  createdAt: Date;
  updatedAt: Date;
}

// Create user data type
export interface CreateUserData extends BaseCreateUserData {
  name?: string;
}

/**
 * Prisma implementation of IUserRepository
 * @public
 */
export class UserRepository implements IUserRepository<User, CreateUserData> {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Find user by email (identifier)
   */
  async findByIdentifier({
    identifier,
  }: {
    identifier: string;
  }): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: identifier },
      });

      return user ? this.mapPrismaUserToUser(user) : null;
    } catch (error) {
      throw new Error(`Failed to find user by identifier: ${error.message}`);
    }
  }

  /**
   * Create new user with email and password
   */
  async create(data: CreateUserData): Promise<User> {
    try {
      // Since identifier is email in our case, we map it to email field
      const user = await this.prisma.user.create({
        data: {
          email: data.identifier, // Map identifier to email field
          password: data.password,
          name: data.name,
          identifierType: "email", // Set identifier type as email
        },
      });

      return this.mapPrismaUserToUser(user);
    } catch (error) {
      if (error.code === "P2002") {
        throw new Error("User with this email already exists");
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update user data
   */
  async update({
    data,
    identifier,
  }: {
    data: Partial<User>;
    identifier: string;
  }): Promise<User> {
    try {
      // Remove id and other non-updatable fields from data
      const { id, createdAt, ...updateData } = data;

      const user = await this.prisma.user.update({
        where: { email: identifier },
        data: updateData,
      });

      return this.mapPrismaUserToUser(user);
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("User not found");
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Map Prisma user to our User type
   */
  private mapPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password,
      name: prismaUser.name,
      identifierType: prismaUser.identifierType as "email" | "phone",
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }

  /**
   * Additional methods for user management
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      return user ? this.mapPrismaUserToUser(user) : null;
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  async deleteUser(identifier: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { email: identifier },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("User not found");
      }
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Clean up Prisma connection
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
```

### 3. Set Up Authentication Service

```typescript
import { LocalAuthService, BcryptHasher } from "@khni/auth";

const userRepository = new UserRepository();
const authService = new LocalAuthService<User, userRepository>(userRepository);
```

### 4. Use in Your Application

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

// Find user
const foundUser = await authService.findUserByIdentifier("user@example.com");
```

## 📖 API Reference

### LocalAuthService

#### Constructor

```typescript
new LocalAuthService<UserType, UserRepositoryType>(
  UserRepository: UserRepositoryType,
  hasher?: IHasher // defaults to BcryptHasher
)
```

#### Methods

##### `createUser`

Creates a new user with validated identifier and hashed password.

```typescript
createUser({ data }: { data: CreateDataType }): Promise<UserType>
```

**Example:**

```typescript
const user = await authService.createUser({
  data: {
    identifier: "user@example.com",
    password: "password123",
    name: "John Doe",
  },
});
```

**Errors:**

- `AUTH_USED_IDENTIFIER` - Identifier already exists
- `AUTH_USER_CREATION_FAILED` - Unexpected creation error

##### `verifyPassword`

Verifies user credentials against stored hash.

```typescript
verifyPassword({ data }: {
  data: { password: string; identifier: string }
}): Promise<UserType>
```

**Example:**

```typescript
try {
  const user = await authService.verifyPassword({
    data: {
      identifier: "user@example.com",
      password: "password123",
    },
  });
  // User authenticated
} catch (error) {
  // Handle authentication failure
}
```

**Errors:**

- `INCORRECT_CREDENTIALS` - Invalid identifier or password
- `USER_NOT_LOCAL` - User exists but no local password

##### `resetPassword`

Resets user password with new secure hash.

```typescript
resetPassword({ data }: {
  data: { newPassword: string; identifier: string }
}): Promise<UserType>
```

##### `findUserByIdentifier`

Finds user by their identifier (email/phone).

```typescript
findUserByIdentifier(identifier: string): Promise<UserType | null>
```

### Interfaces

#### IUserRepository

```typescript
interface IUserRepository<UserType, CreateDataType> {
  findByIdentifier(params: { identifier: string }): Promise<UserType | null>;
  create(params: CreateDataType): Promise<UserType>;
  update(params: {
    data: Partial<UserType>;
    identifier: string;
  }): Promise<UserType>;
}
```

#### IHasher

```typescript
interface IHasher {
  hash(text: string): Promise<string>;
  compare(text: string, hash: string): Promise<boolean>;
}
```

## 🛡️ Error Handling

The service uses two main error types:

### AuthDomainError

Business logic errors (expected scenarios):

```typescript
throw new AuthDomainError("AUTH_USED_IDENTIFIER", "Email already registered");
```

### AuthUnexpectedError

System errors (unexpected failures):

```typescript
throw new AuthUnexpectedError(
  "LOGIN_FAILED",
  error,
  "Authentication process failed"
);
```

**Common Error Codes:**

- `AUTH_USED_IDENTIFIER` - Identifier already in use
- `INCORRECT_CREDENTIALS` - Invalid login credentials
- `USER_NOT_LOCAL` - User doesn't have local authentication
- `LOGIN_FAILED` - Unexpected login error
- `PASSWORD_RESET_FAILED` - Password reset error

## 🧪 Testing

Run the test suite:

```bash
npm test
npm run test:coverage
```

### Example Test Setup

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalAuthService } from "@khni/auth";

const mockUserRepository = {
  findByIdentifier: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockHasher = {
  hash: vi.fn(),
  compare: vi.fn(),
};

describe("LocalAuthService", () => {
  let authService: LocalAuthService<any, any>;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new LocalAuthService(mockUserRepository, mockHasher);
  });

  it("should create user successfully", async () => {
    // Test implementation
  });
});
```

## 🔧 Configuration

### Custom Hasher

Implement the `IHasher` interface to use different hashing algorithms:

```typescript
class Argon2Hasher implements IHasher {
  async hash(text: string): Promise<string> {
    // Your argon2 implementation
  }

  async compare(text: string, hash: string): Promise<boolean> {
    // Your argon2 comparison
  }
}
```

### Identifier Validation

The service uses `identifierSchema` for validating email/phone formats. Customize the schema to match your requirements.

## 📈 Migration Guide

### From Previous Versions

This service replaces any previous authentication implementation with a more robust, type-safe solution:

1. **Replace custom auth logic** with `LocalAuthService` methods
2. **Implement `IUserRepository`** for your user data layer
3. **Update error handling** to use `AuthDomainError` and `AuthUnexpectedError`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

Built with ❤️ by KHNI Team
