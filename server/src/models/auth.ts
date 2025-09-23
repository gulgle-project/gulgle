import { ObjectId, UUID } from "bson";
import z from "zod";

export const OIDCProviderValues = ["github"] as const;

export const OIDCStageValues = ["redirect", "response"] as const;

export type OIDCProvider = (typeof OIDCProviderValues)[number];
export type OIDCStage = (typeof OIDCStageValues)[number];

export const AuthEntitySchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  provider: z.enum(OIDCProviderValues),
  code_verifier: z.string(),
  expectedNonce: z.string(),
  auth_code: z.string().default(() => new UUID().toString()),
});

export type AuthEntity = z.infer<typeof AuthEntitySchema>;
