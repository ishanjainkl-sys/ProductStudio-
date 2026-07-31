import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { randomUUID } from "node:crypto";

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  typ: "access";
  jti: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  typ: "refresh";
  jti: string;
}

export interface TokenConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtlMinutes: number;
  refreshTtlDays: number;
}

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  claims: { userId: string; email: string; role: string },
  config: TokenConfig,
): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + config.accessTtlMinutes * 60_000);
  const token = await new SignJWT({
    email: claims.email,
    role: claims.role,
    typ: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey(config.accessSecret));
  return { token, jti, expiresAt };
}

export async function signRefreshToken(
  claims: { userId: string },
  config: TokenConfig,
): Promise<{ token: string; jti: string; expiresAt: Date }> {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + config.refreshTtlDays * 24 * 60 * 60_000);
  const token = await new SignJWT({ typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey(config.refreshSecret));
  return { token, jti, expiresAt };
}

export async function verifyAccessToken(
  token: string,
  config: TokenConfig,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey(config.accessSecret));
  if (payload.typ !== "access" || !payload.sub || !payload.jti) {
    throw new Error("Invalid access token");
  }
  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(
  token: string,
  config: TokenConfig,
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey(config.refreshSecret));
  if (payload.typ !== "refresh" || !payload.sub || !payload.jti) {
    throw new Error("Invalid refresh token");
  }
  return payload as RefreshTokenPayload;
}
