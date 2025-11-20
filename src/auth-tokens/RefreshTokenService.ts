import { ICrypto, ValidTimeString } from "@khni/core";
import {
  IRefreshTokenService,
  RefreshTokenVerifyInput,
} from "./interfaces/IRefreshTokenService.js";
import {
  AuthDomainError,
  AuthUnexpectedError,
  AuthUnexpectedErrorCodesType,
} from "@khni/auth-errors";
import { IRefreshTokenRepository } from "./interfaces/IRefreshTokenRepository.js";
export type FindUniqueUserById = (params: {
  where: { id: string };
}) => Promise<any>;
export class RefreshTokenService implements IRefreshTokenService {
  private expiresAt: Date;
  constructor(
    private refreshTokenRepository: IRefreshTokenRepository,
    private crypto: ICrypto,
    private generateExpiredDate: (timeString: ValidTimeString) => Date,
    private refreshTokenExpiresIn: ValidTimeString,
    private findUniqueUserById: FindUniqueUserById
  ) {
    this.expiresAt = this.generateExpiredDate(this.refreshTokenExpiresIn);
  }
  verify = async ({ token }: RefreshTokenVerifyInput) => {
    try {
      const refreshToken = await this.refreshTokenRepository.findUnique({
        where: { token },
      });

      if (
        !refreshToken ||
        refreshToken.expiresAt < new Date() ||
        refreshToken.revokedAt
      ) {
        throw new AuthDomainError(
          "REFRESH_TOKEN_INVALID",
          "refreshToken is not exist or expired"
        );
      }

      const user = await this.findUniqueUserById({
        where: { id: refreshToken.userId },
      });
      if (!user) {
        throw new AuthDomainError(
          "REFRESH_TOKEN_INVALID",
          `User is not exist while verifying RefreshToken | userId: ${refreshToken.userId}`
        );
      }

      return { userId: refreshToken.userId };
    } catch (error) {
      this.handleAuthError(error, "REFRESHTOKEN_VERIFY_FAILED");
    }
  };

  revoke = async ({ token }: { token: string }) => {
    try {
      console.log("revoking token", token);
      return await this.refreshTokenRepository.update({
        where: { token },
        data: { revokedAt: new Date() },
      });
    } catch (error) {
      throw new AuthUnexpectedError("REFRESHTOKEN_REVOKE_FAILED", error);
    }
  };

  create = async (userId: string, tx?: unknown) => {
    try {
      const refreshtoken = await this.refreshTokenRepository.create({
        data: {
          token: this.crypto.generateBase64UrlToken(40),
          expiresAt: this.expiresAt,
          userId,
        },
        tx,
      });

      return refreshtoken;
    } catch (error) {
      throw new AuthUnexpectedError("REFRESHTOKEN_CREATE_FAILED", error);
    }
  };

  private handleAuthError(
    error: unknown,
    code: AuthUnexpectedErrorCodesType
  ): never {
    if (error instanceof AuthDomainError) {
      throw error;
    }

    throw new AuthUnexpectedError(code, error);
  }
}
