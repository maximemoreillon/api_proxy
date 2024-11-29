// From https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce/add-login-using-the-authorization-code-flow-with-pkce
import { randomBytes, createHash } from "crypto"

export const base64URLEncode = (buf: Buffer) =>
  buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

const createVerifier = () => base64URLEncode(randomBytes(32))
const createChallenge = (verifier: string) =>
  base64URLEncode(createHash("sha256").update(verifier).digest())

export const createCodVerifierAndChallenge = () => {
  const verifier = createVerifier()
  const challenge = createChallenge(verifier)
  return { verifier, challenge }
}
