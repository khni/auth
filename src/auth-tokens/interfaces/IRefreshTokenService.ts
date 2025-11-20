import { RefreshTokenModel } from "./IRefreshTokenRepository.js";

export type RefreshTokenVerifyInput = {
  token: string;
};

export interface IRefreshTokenService {
  create(userId: string, tx?: unknown): Promise<RefreshTokenModel>;
  verify(data: RefreshTokenVerifyInput): Promise<{
    userId: string;
  }>;
  revoke({ token }: { token: string }): Promise<{
    token: string;
    id: string;
    revokedAt: Date | null;
  }>;
}
