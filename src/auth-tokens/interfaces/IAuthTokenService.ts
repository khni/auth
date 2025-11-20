export interface IAuthTokensService {
  generate(
    userId: string
  ): Promise<{ refreshToken: string; accessToken: string }>;
  refresh(
    refreshToken: string
  ): Promise<{ refreshToken: string; accessToken: string }>;
  logout(refreshToken: string): Promise<void>;
}
