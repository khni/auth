import { z } from "zod";

export const parseIdentifier = (identifier: string) => {
  return z
    .union([
      z.e164().transform((val) => ({ type: "phone" as const, value: val })),
      z.email().transform((val) => ({ type: "email" as const, value: val })),
    ])
    .parse(identifier);
};
