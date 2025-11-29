import { AuthDomainError } from "@khni/auth-errors";
import { AuthUnexpectedError } from "@khni/auth-errors";
import { AuthUnexpectedErrorCodesType } from "@khni/auth-errors";

import { ILocalAuthService } from "./interfaces/ILocalAuthService.js";
import { IUserRepository } from "./interfaces/IUserRepository.js";
import { BaseCreateUserData } from "./types.js";
import { IHasher } from "../core/hasher/IHasher.js";
import { parseIdentifier } from "./utils.js";

/**
 * Local authentication service that:
 * - Validates identifiers
 * - Hashes passwords
 * - Verifies passwords
 * - Delegates user creation/update to a user service
 *
 * @typeParam UserType - Returned user type.
 * @typeParam S - A concrete UserRepository implementing IUserRepository.
 *
 * @public
 */
export class LocalAuthService<
  UserType,
  S extends IUserRepository<any, BaseCreateUserData>
> implements ILocalAuthService<UserType, Parameters<S["create"]>[0]>
{
  /**
   * Creates a new LocalAuthService instance.
   *
   * @param UserRepository - Implementation of IUserRepository.
   * @param hasher - Hashing adapter (bcrypt, argon2, etc).
   * @public
   */
  constructor(private UserRepository: S, private hasher: IHasher) {}

  /**
   * Wraps and transforms thrown errors into domain or unexpected errors.
   *
   * @param error - The caught error.
   * @param code - Error code for unexpected errors.
   * @param msg - Optional message.
   * @param meta - Optional metadata.
   *
   * @internal
   */
  private handleAuthError(
    error: unknown,
    code: AuthUnexpectedErrorCodesType,
    msg?: string,
    meta?: {}
  ): never {
    if (error instanceof AuthDomainError) throw error;
    throw new AuthUnexpectedError(code, error, msg, meta);
  }

  /**
   * Create a new local user after:
   * - Validating the identifier
   * - Checking uniqueness
   * - Hashing the password
   *
   * @param data - User creation input
   * @returns The created user
   * @public
   */
  createUser = async ({
    data,
  }: {
    data: Parameters<S["create"]>[0];
  }): Promise<Awaited<ReturnType<S["create"]>>> => {
    try {
      const { value: identifier, type: identifierType } = parseIdentifier(
        data.identifier
      );

      let user = await this.UserRepository.findByIdentifier({ identifier });

      if (user) {
        throw new AuthDomainError("AUTH_USED_IDENTIFIER", `${data.identifier}`);
      }

      const hashedPassword = await this.hasher.hash(data.password);

      return await this.UserRepository.create({
        ...data,
        identifier,
        identifierType,
        password: hashedPassword,
      });
    } catch (error) {
      this.handleAuthError(error, "AUTH_USER_CREATION_FAILED");
    }
  };

  /**
   * Verify a user's password by:
   * - Finding user
   * - Ensuring they are local-auth enabled
   * - Comparing hashes
   *
   * @param data - Identifier and plaintext password.
   * @returns The authenticated user.
   * @public
   */
  verifyPassword = async ({
    data,
  }: {
    data: {
      password: string;
      identifier: string;
    };
  }): Promise<UserType> => {
    try {
      const user = await this.UserRepository.findByIdentifier({
        identifier: data.identifier,
      });

      if (!user) {
        throw new AuthDomainError(
          "INCORRECT_CREDENTIALS",
          `identifier is not exist`
        );
      }

      if (!user.password) {
        throw new AuthDomainError(
          "USER_NOT_LOCAL",
          `identifier is not local registered`
        );
      }

      const isValidPassword = await this.hasher.compare(
        data.password,
        user.password
      );

      if (!isValidPassword) {
        throw new AuthDomainError(
          "INCORRECT_CREDENTIALS",
          `password for identifier ${data.identifier} is not Match`
        );
      }

      return user;
    } catch (error) {
      this.handleAuthError(error, "LOGIN_FAILED");
    }
  };

  /**
   * Reset a user's password.
   *
   * @param data - Identifier and new plaintext password.
   * @returns Updated user with new hashed password.
   * @public
   */
  resetPassword = async ({
    data,
  }: {
    data: {
      newPassword: string;
      identifier: string;
    };
  }): Promise<Awaited<ReturnType<S["update"]>>> => {
    try {
      const hashedPassword = await this.hasher.hash(data.newPassword);

      return await this.UserRepository.update({
        data: { password: hashedPassword },
        identifier: data.identifier,
      });
    } catch (error) {
      this.handleAuthError(error, "PASSWORD_RESET_FAILED");
    }
  };

  /**
   * Find a user by identifier.
   *
   * @param identifier - Email or phone.
   * @returns The found user or null.
   * @public
   */
  findUserByIdentifier = async (
    identifier: string
  ): Promise<Awaited<ReturnType<S["findByIdentifier"]>>> => {
    try {
      return await this.UserRepository.findByIdentifier({ identifier });
    } catch (error) {
      this.handleAuthError(error, "FINDING_USER_FAILED", "", { identifier });
    }
  };
}
