export interface IAccessTokenService {
  generate: (userId: string) => string;
  verify: (token: string) => {
    userId: string;
  } | null;
}
