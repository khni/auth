/**
 * The supported user identifier types.
 * @public
 */
export type UserIdentifierType = "email" | "phone";

/**
 * Base fields required when creating any user.
 * @public
 */
export type BaseCreateUserData = {
  /** Raw password before hashing */
  password: string;

  /** Email or phone identifier */
  identifier: string;
};
