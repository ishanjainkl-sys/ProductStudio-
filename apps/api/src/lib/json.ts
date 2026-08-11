import type { Prisma } from "@prisma/client";

/** Cast domain objects to Prisma JSON input types. */
export function toInputJson<T>(value: T): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
