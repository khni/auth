import { BaseCreateUserData } from "../types.js";

/**
 * A service responsible for local-password authentication.
 *
 * @typeParam UserType - The returned user type.
 * @typeParam CreateDataType - The accepted structure when creating a user.
 *
 * @public
 */
export interface ILocalAuthService<
  UserType,
  CreateDataType extends BaseCreateUserData = BaseCreateUserData
> {
  /**
   * Create a new user (handles hashing, validation).
   *
   * @param params - Wrapper containing the data used to create a user.
   * @returns The created user.
   * @public
   */
  createUser(params: { data: CreateDataType }): Promise<UserType>;

  /**
   * Verify that a given password matches the user's stored hash.
   *
   * @param data - Contains the identifier and plaintext password.
   * @returns The authenticated user.
   * @public
   */
  verifyPassword: (params: {
    data: {
      password: string;
      identifier: string;
    };
  }) => Promise<UserType>;

  /**
   * Reset a user's password.
   *
   * @param data - Includes the identifier and the new plaintext password.
   * @returns The updated user.
   * @public
   */
  resetPassword(params: {
    data: {
      newPassword: string;
      identifier: string;
    };
  }): Promise<UserType>;

  /**
   * Locate a user by identifier.
   *
   * @param identifier - Email or phone.
   * @returns A user or null.
   * @public
   */
  findUserByIdentifier: (identifier: string) => Promise<UserType | null>;
}
