import { BaseCreateUserData } from "../types.js";

/**
 * Interface for interacting with the User storage layer.
 *
 * @typeParam UserType - The shape of the resulting user object.
 * @typeParam CreateDataType - The input structure allowed when creating a user.
 *
 * @public
 */
export interface IUserRepository<
  UserType extends BaseCreateUserData,
  CreateDataType extends BaseCreateUserData = BaseCreateUserData
> {
  /**
   * Find a user by email or phone.
   *
   * @param params - Object containing the identifier string.
   * @returns A user if found, otherwise null.
   * @public
   */
  findByIdentifier(params: { identifier: string }): Promise<UserType | null>;

  /**
   * Create a new user in the persistence layer.
   *
   * @param params - Validated data including hashed password and identifier type.
   * @returns The created user.
   * @public
   */
  create(params: CreateDataType): Promise<UserType>;

  /**
   * Update a user partially.
   *
   * @param params - Object including partial data and identifier.
   * @returns The updated user.
   * @public
   */
  update(params: {
    data: Partial<UserType>;
    identifier: string;
  }): Promise<UserType>;
}
