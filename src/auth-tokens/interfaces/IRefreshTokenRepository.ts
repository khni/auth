import { IBaseRepository } from "@khni/core";

export type RefreshTokenModel = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};
export type RefreshTokenCreateInput = Partial<RefreshTokenModel> & {
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt?: Date | null;
};

export type RefreshTokenUpdateInput = Partial<RefreshTokenModel>;

export type RefreshTokenWhereUniqueInput = { token: string } | { id: string };
export interface IRefreshTokenRepository
  extends IBaseRepository<
    RefreshTokenModel,
    RefreshTokenWhereUniqueInput,
    RefreshTokenCreateInput
  > {}
