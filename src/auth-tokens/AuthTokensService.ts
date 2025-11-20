import { AuthDomainError } from "@khni/auth-errors";
import { IAccessTokenService } from "./interfaces/IAccessTokenService.js";
import { IAuthTokensService } from "./interfaces/IAuthTokenService.js";
import { IRefreshTokenService } from "./interfaces/IRefreshTokenService.js";

export class AuthTokensService implements IAuthTokensService {
  constructor(
    private refreshTokenService: IRefreshTokenService,
    private accessTokenService: IAccessTokenService
  ) {}
  generate = async (userId: string) => {
    const refreshToken = await this.refreshTokenService.create(userId);
    const accessToken = this.accessTokenService.generate(userId);
    return { refreshToken: refreshToken.token, accessToken };
  };
  refresh = async (token: string) => {
    if (!token) {
      throw new AuthDomainError("REFRESH_TOKEN_INVALID");
    }
    const { userId } = await this.refreshTokenService.verify({
      token,
    });

    if (!userId) {
      throw new AuthDomainError("REFRESH_TOKEN_INVALID");
    }

    return await this.generate(userId);
  };
  logout = async (token: string) => {
    await this.refreshTokenService.revoke({ token });
  };
}
