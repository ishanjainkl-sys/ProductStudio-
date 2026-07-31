import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
  generateId,
} from "@productstudio/auth";
import type { UserRole } from "@productstudio/shared-types";
import { prisma } from "../../db/prisma.js";
import { UnauthenticatedError, ValidationError } from "../../lib/errors.js";
import { toApiRole, toPrismaRole } from "../../lib/roles.js";
import { tokenConfig } from "../../middleware/requireAuth.js";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Constant-ish generic failure (FR-AUTH-03)
  const invalid = new UnauthenticatedError("Invalid email or password");
  if (!user) {
    await verifyPassword(
      "$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      password,
    ).catch(() => false);
    throw invalid;
  }
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw invalid;

  const config = tokenConfig();
  const access = await signAccessToken(
    { userId: user.id, email: user.email, role: toApiRole(user.role) },
    config,
  );
  const refresh = await signRefreshToken({ userId: user.id }, config);

  return {
    user: { id: user.id, email: user.email, role: toApiRole(user.role) },
    access,
    refresh,
  };
}

export async function logout(accessJti: string | undefined, refreshJti: string | undefined) {
  const now = new Date();
  const ops = [];
  if (accessJti) {
    ops.push(
      prisma.revokedToken.upsert({
        where: { tokenId: accessJti },
        create: {
          id: generateId("rtk"),
          tokenId: accessJti,
          expiresAt: new Date(now.getTime() + 15 * 60_000),
        },
        update: {},
      }),
    );
  }
  if (refreshJti) {
    ops.push(
      prisma.revokedToken.upsert({
        where: { tokenId: refreshJti },
        create: {
          id: generateId("rtk"),
          tokenId: refreshJti,
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60_000),
        },
        update: {},
      }),
    );
  }
  await Promise.all(ops);
}

export async function refreshSession(refreshToken: string) {
  const config = tokenConfig();
  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken, config);
  } catch {
    throw new UnauthenticatedError("Invalid refresh token");
  }

  const revoked = await prisma.revokedToken.findUnique({ where: { tokenId: payload.jti } });
  if (revoked) throw new UnauthenticatedError("Session revoked");

  // Rotate: revoke old refresh
  await prisma.revokedToken.create({
    data: {
      id: generateId("rtk"),
      tokenId: payload.jti,
      expiresAt: new Date(payload.exp! * 1000),
    },
  });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new UnauthenticatedError();

  const access = await signAccessToken(
    { userId: user.id, email: user.email, role: toApiRole(user.role) },
    config,
  );
  const refresh = await signRefreshToken({ userId: user.id }, config);
  return {
    user: { id: user.id, email: user.email, role: toApiRole(user.role) },
    access,
    refresh,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthenticatedError();
  return { id: user.id, email: user.email, role: toApiRole(user.role) };
}

export async function createUser(input: {
  email: string;
  password: string;
  role: UserRole;
}) {
  if (input.password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }
  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      id: generateId("usr"),
      email: input.email.toLowerCase(),
      passwordHash,
      role: toPrismaRole(input.role),
    },
  });
}
