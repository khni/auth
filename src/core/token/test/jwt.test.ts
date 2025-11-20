import { beforeAll, describe, expect, it } from "vitest";
import { Jwt } from "../Jwt.js";

type Payload = {
  userId: number;
  role: string;
};

describe("Jwt", () => {
  const SECRET_KEY = "MY_TEST_SECRET";
  let jwtInstance: Jwt<Payload>;

  beforeAll(() => {
    jwtInstance = new Jwt<Payload>("JWT_SECRET");
  });

  it("should sign and verify a token with correct payload type", () => {
    const payload: Payload = { userId: 123, role: "admin" };

    const token = jwtInstance.sign(payload, { expiresIn: "1h" });
    expect(token).toBeTypeOf("string");

    const decoded = jwtInstance.verify(token);
    expect(decoded.userId).toBe(123);
    expect(decoded.role).toBe("admin");
  });
  it("should throw an error if expiresIn is a number", () => {
    const payload: Payload = { userId: 456, role: "user" };

    expect(
      () => jwtInstance.sign(payload, { expiresIn: 10 as any }) // likely mistake: 10 seconds instead of 10 minutes
    ).toThrow("expiresIn should be a string like '10m' or '1h'");
  });

  it("should throw an error for an invalid token", () => {
    const invalidToken = "bad.token.value";
    expect(() => jwtInstance.verify(invalidToken)).toThrow();
  });
});
