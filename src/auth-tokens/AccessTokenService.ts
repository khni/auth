import { AuthDomainError } from "@khni/auth-errors";
import jwt from "jsonwebtoken";
import { IToken, ValidTimeString } from "@khni/core";

const { TokenExpiredError } = jwt; //to fix 'jsonwebtoken' does not provide an export named 'TokenExpiredError'

export class AccessTokenService {
  constructor(
    private tokenService: IToken<{ userId: string }>,
    private accessTokenExpiresIn: ValidTimeString = "10m"
  ) {}

  generate = (userId: string) => {
    return this.tokenService.sign(
      { userId },
      { expiresIn: this.accessTokenExpiresIn }
    );
  };

  verify = (token?: string | null) => {
    if (!token) {
      throw new AuthDomainError("MISSING_ACCESS_TOKEN");
    }
    try {
      return this.tokenService.verify(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new AuthDomainError("EXPIRED_ACCESS_TOKEN");
      }
      throw error;
    }
  };
}
