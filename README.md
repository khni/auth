# @khni/auth - Complete Authentication System

A robust, type-safe local authentication service for Node.js applications with complete token management, including access tokens, refresh tokens, and secure authentication flows.

## 🚀 Features

- **🔐 Secure Authentication** - Password hashing with bcrypt and configurable hashers
- **📧 Multi-Identifier Support** - Email and phone number authentication
- **🔄 Token Management** - Complete JWT access token and refresh token system
- **🛡️ Type-Safe** - Full TypeScript support with generic types
- **📖 Comprehensive API** - Complete authentication flow (register, login, refresh, logout)
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

### Complete Authentication System

The service provides a complete authentication system combining local authentication with token management:

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────┐
│ LocalAuthService│ ── │   IUserRepository   │ ── │ Your User DB │
└─────────────────┘    └──────────────────┘    └──────────────┘
         │                       │
         │                       │
┌────────▼────────┐    ┌─────────▼────────┐    ┌─────────────────┐
│ AuthTokensModule│ ── │ RefreshTokenRepo │ ── │  Token Storage  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
┌────────▼────────┐
│   JWT Tokens    │
└─────────────────┘
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

### 2. Implement Your User Repository

```typescript
import { IUserRepository, BaseCreateUserData } from "@khni/auth";
import { PrismaClient } from "@prisma/client";

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  identifierType: "email" | "phone";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData extends BaseCreateUserData {
  name?: string;
}

export class UserRepository implements IUserRepository<User, CreateUserData> {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  async findByIdentifier({
    identifier,
  }: {
    identifier: string;
  }): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: identifier },
    });
    return user ? this.mapPrismaUserToUser(user) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.identifier,
        password: data.password,
        name: data.name,
        identifierType: "email",
      },
    });
    return this.mapPrismaUserToUser(user);
  }

  async update({
    data,
    identifier,
  }: {
    data: Partial<User>;
    identifier: string;
  }): Promise<User> {
    const { id, createdAt, ...updateData } = data;
    const user = await this.prisma.user.update({
      where: { email: identifier },
      data: updateData,
    });
    return this.mapPrismaUserToUser(user);
  }

  private mapPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password,
      name: prismaUser.name,
      identifierType: prismaUser.identifierType,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
```

### 3. Implement Refresh Token Repository

```typescript
import { IRefreshTokenRepository } from "@khni/auth-tokens";
import { PrismaClient } from "@prisma/client";

export class RefreshTokenRepository implements IRefreshTokenRepository {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  async create(token: {
    id: string;
    userId: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        expiresAt: token.expiresAt,
      },
    });
  }

  async findById(
    id: string
  ): Promise<{ id: string; userId: string; expiresAt: Date } | null> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { id },
    });
    return token || null;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
```

### 4. Set Up Complete Authentication System

```typescript
import { LocalAuthService, BcryptHasher } from "@khni/auth";
import {
  initAuthTokensModule,
  getAuthTokensService,
  type AuthModuleConfig,
} from "@khni/auth-tokens";

// Setup repositories
const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();

// Initialize authentication service
const authService = new LocalAuthService(userRepository);

// Initialize token module
const authConfig: AuthModuleConfig = {
  jwtSecret: process.env.JWT_SECRET!,
  accessTokenExpiresIn: "15m",
  refreshTokenExpiresIn: "7d",
  refreshTokenRepository,
  findUniqueUserById: async (userId: string) => {
    return await userRepository.findByIdentifier({ identifier: userId });
  },
  logger: console, // optional
};

initAuthTokensModule(authConfig);
const tokensService = getAuthTokensService();
```

## 🔐 Complete Authentication Flow

### User Registration

```typescript
async function registerUser(email: string, password: string, name: string) {
  try {
    // 1. Create user in database with hashed password
    const user = await authService.createUser({
      data: {
        identifier: email,
        password: password,
        name: name,
      },
    });

    // 2. Generate access and refresh tokens
    const tokens = await tokensService.generate(user.id);

    // 3. Return user and tokens (exclude password from response)
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      tokens,
    };
  } catch (error) {
    if (error.code === "AUTH_USED_IDENTIFIER") {
      throw new Error("User with this email already exists");
    }
    throw new Error("Registration failed");
  }
}

// Usage
const result = await registerUser(
  "user@example.com",
  "securePassword123",
  "John Doe"
);
console.log(result);
// {
//   user: { id: "123", email: "user@example.com", name: "John Doe", ... },
//   tokens: { accessToken: "eyJ...", refreshToken: "abc123..." }
// }
```

### User Login

```typescript
async function loginUser(email: string, password: string) {
  try {
    // 1. Verify user credentials
    const user = await authService.verifyPassword({
      data: {
        identifier: email,
        password: password,
      },
    });

    // 2. Generate new tokens
    const tokens = await tokensService.generate(user.id);

    // 3. Return user and tokens (exclude password from response)
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      tokens,
    };
  } catch (error) {
    if (error.code === "INCORRECT_CREDENTIALS") {
      throw new Error("Invalid email or password");
    }
    throw new Error("Login failed");
  }
}

// Usage
const result = await loginUser("user@example.com", "securePassword123");
```

### Token Refresh

```typescript
async function refreshTokens(refreshToken: string) {
  try {
    // 1. Verify refresh token and generate new tokens
    const tokens = await tokensService.refresh(refreshToken);

    return {
      tokens,
    };
  } catch (error) {
    if (error.code === "REFRESH_TOKEN_INVALID") {
      throw new Error("Invalid or expired refresh token");
    }
    throw new Error("Token refresh failed");
  }
}

// Usage when access token expires
const newTokens = await refreshTokens(oldRefreshToken);
```

### User Logout

```typescript
async function logoutUser(refreshToken: string) {
  try {
    // 1. Revoke the refresh token
    await tokensService.logout(refreshToken);

    return { success: true };
  } catch (error) {
    throw new Error("Logout failed");
  }
}

// Usage
await logoutUser(refreshToken);
```

### Complete Express.js Example

```typescript
import express from "express";
import { LocalAuthService, BcryptHasher } from "@khni/auth";
import { initAuthTokensModule, getAuthTokensService } from "@khni/auth-tokens";
import { UserRepository } from "./repositories/UserRepository";
import { RefreshTokenRepository } from "./repositories/RefreshTokenRepository";

const app = express();
app.use(express.json());

// Setup
const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const authService = new LocalAuthService(userRepository);

initAuthTokensModule({
  jwtSecret: process.env.JWT_SECRET!,
  accessTokenExpiresIn: "15m",
  refreshTokenExpiresIn: "7d",
  refreshTokenRepository,
  findUniqueUserById: async (userId) =>
    await userRepository.findByIdentifier({ identifier: userId }),
});

const tokensService = getAuthTokensService();

// Auth middleware
const authenticateToken = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const accessTokenService = getAccessTokenService();
    const payload = accessTokenService.verify(token);
    req.user = payload; // { userId: "123" }
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Routes
app.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const user = await authService.createUser({
      data: { identifier: email, password, name },
    });

    const tokens = await tokensService.generate(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      tokens,
    });
  } catch (error) {
    if (error.code === "AUTH_USED_IDENTIFIER") {
      return res.status(409).json({ error: "User already exists" });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.verifyPassword({
      data: { identifier: email, password },
    });

    const tokens = await tokensService.generate(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      tokens,
    });
  } catch (error) {
    if (error.code === "INCORRECT_CREDENTIALS") {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await tokensService.refresh(refreshToken);
    res.json({ tokens });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

app.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await tokensService.logout(refreshToken);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
});

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await userRepository.findByIdentifier({
      identifier: req.user.userId,
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## 🔄 Token Management

### Access Tokens

- **Short-lived** (15 minutes by default)
- **JWT-based** with user payload
- **Stateless** - verified using secret key
- **Used for API authentication**

### Refresh Tokens

- **Long-lived** (7 days by default)
- **Stored in database** for revocation
- **Used to obtain new access tokens**
- **Automatically revoked on logout**

## 🛡️ Security Features

### Password Security

- **Bcrypt hashing** with configurable rounds
- **Automatic salt generation**
- **Timing-attack resistant comparison**

### Token Security

- **JWT secret key** for signing
- **Short expiration times** for access tokens
- **Database-backed refresh tokens** for revocation
- **Secure token generation** using crypto module

### Best Practices

- **Never store passwords in plain text**
- **Use HTTPS in production**
- **Implement rate limiting** on auth endpoints
- **Store refresh tokens securely** (httpOnly cookies recommended)
- **Implement token blacklisting** for immediate revocation

## 📖 API Reference

### LocalAuthService Methods

#### `createUser`

Creates a new user with hashed password.

#### `verifyPassword`

Verifies user credentials for login.

#### `resetPassword`

Updates user password with new hash.

#### `findUserByIdentifier`

Finds user by email/phone identifier.

### AuthTokensService Methods

#### `generate`

Generates new access and refresh tokens for a user.

#### `refresh`

Verifies refresh token and generates new tokens.

#### `logout`

Revokes a refresh token.

## 🧪 Testing Your Implementation

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { LocalAuthService } from "@khni/auth";
import { initAuthTokensModule, getAuthTokensService } from "@khni/auth-tokens";

describe("Authentication Flow", () => {
  beforeEach(() => {
    // Reset modules and clear database
  });

  it("should complete full authentication flow", async () => {
    // 1. Register user
    // 2. Login with credentials
    // 3. Access protected route with token
    // 4. Refresh tokens
    // 5. Logout
  });
});
```

## 🔧 Configuration

### Environment Variables

```bash
JWT_SECRET=your-super-secure-jwt-secret-key
DATABASE_URL=your-database-connection-string
```

### Token Expiration Settings

```typescript
const authConfig = {
  accessTokenExpiresIn: "15m", // 15 minutes
  refreshTokenExpiresIn: "7d", // 7 days
  // Supported units: ms, s, m, h, d
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
