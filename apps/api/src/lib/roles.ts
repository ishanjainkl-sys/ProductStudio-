import type { UserRole as PrismaRole } from "@prisma/client";
import type { UserRole } from "@productstudio/shared-types";

const TO_API: Record<PrismaRole, UserRole> = {
  ADMIN: "admin",
  DEVELOPER: "developer",
  DESIGNER: "designer",
  CONTENT: "content",
  PM: "pm",
};

const TO_PRISMA: Record<UserRole, PrismaRole> = {
  admin: "ADMIN",
  developer: "DEVELOPER",
  designer: "DESIGNER",
  content: "CONTENT",
  pm: "PM",
};

export function toApiRole(role: PrismaRole): UserRole {
  return TO_API[role];
}

export function toPrismaRole(role: UserRole): PrismaRole {
  return TO_PRISMA[role];
}
