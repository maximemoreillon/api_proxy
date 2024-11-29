// import * as client from "openid-client"
import createJwksClient, { JwksClient } from "jwks-rsa"
import jwt from "jsonwebtoken"
import { NextFunction, Request, Response } from "express"
import { createCodVerifierAndChallenge } from "./pkce"

export const {
  OIDC_AUTHORITY = "",
  OIDC_CLIENT_ID = "",
  OIDC_AUDIENCE = "",
} = process.env

const callbackPath = "/oauth/callback"
let oidcConfig: any
let jwksClient: JwksClient

async function getOidcConfig() {
  const openIdConfigUrl = `${OIDC_AUTHORITY}/.well-known/openid-configuration`
  const response = await fetch(openIdConfigUrl)
  return await response.json()
}
export async function oidcInit() {
  oidcConfig = await getOidcConfig()

  const { jwks_uri } = oidcConfig

  if (jwks_uri) {
    jwksClient = createJwksClient({
      jwksUri: jwks_uri,
      cache: true,
      rateLimit: true,
    })
  }
}

function redirectToAuthUrl(req: Request, res: Response) {
  if (!oidcConfig) throw new Error("OIDC config not available")

  const { origin } = new URL(`${req.protocol}://${req.get("Host")}`)
  const redirectUrl = new URL(`${origin}${callbackPath}`)
  const href = `${origin}${req.originalUrl}`
  redirectUrl.searchParams.append("href", href)

  const scope = "openid email profile"

  const { verifier, challenge } = createCodVerifierAndChallenge()

  const authUrl = new URL(oidcConfig.authorization_endpoint)

  authUrl.searchParams.append("response_type", "code")
  authUrl.searchParams.append("client_id", OIDC_CLIENT_ID)
  authUrl.searchParams.append("scope", scope)
  authUrl.searchParams.append("code_challenge_method", "S256")
  authUrl.searchParams.append("code_challenge", challenge)
  authUrl.searchParams.append("redirect_uri", redirectUrl.toString())

  // Used for redirection after login
  res.cookie("code_verifier", verifier)
  res.redirect(authUrl.toString())
}

async function getUserFromToken(token: string) {
  const decoded = jwt.decode(token, { complete: true })
  if (!decoded) throw new Error(`Decoded token is null`)
  const kid = decoded.header?.kid
  if (!kid) throw new Error("Missing token kid")
  const key = await jwksClient.getSigningKey(kid)
  try {
    return jwt.verify(token, key.getPublicKey())
  } catch (error) {
    return null
  }
}

async function oAuthCallback(req: Request, res: Response) {
  const { code, href } = req.query as { code: string; href: string }
  if (!code) throw new Error("Code not available")
  const { code_verifier } = req.cookies
  if (!code_verifier) throw new Error("Verifier not available")

  const { origin } = new URL(`${req.protocol}://${req.get("Host")}`)
  const redirectUrl = new URL(`${origin}${callbackPath}`)
  redirectUrl.searchParams.append("href", href)

  const tokenUrl = new URL(oidcConfig.token_endpoint)
  const body = new URLSearchParams({
    code,
    code_verifier,
    redirect_uri: redirectUrl.toString(),
    client_id: OIDC_CLIENT_ID,
    grant_type: "authorization_code",
  })

  const options: RequestInit = {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  }

  const response = await fetch(tokenUrl.toString(), options)

  const { access_token, refresh_token } = await response.json()
  res.clearCookie("code_verifier")
  res.cookie("access_token", access_token)
  res.cookie("refresh_token", refresh_token)
  res.redirect(href)
}

export const createOidcMiddleware =
  () => async (req: Request, res: Response, next: NextFunction) => {
    const { path, cookies } = req

    const { access_token } = cookies

    if (access_token) {
      const user = await getUserFromToken(access_token)
      if (!user) return redirectToAuthUrl(req, res)
      return next()
    } else if (path === callbackPath) {
      console.log("path is callback")
      return await oAuthCallback(req, res)
    }

    return redirectToAuthUrl(req, res)
  }
