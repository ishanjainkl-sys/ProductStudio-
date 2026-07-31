import { themeTokensSchema } from "@productstudio/shared-schemas";
import type { ThemeTokens } from "@productstudio/shared-types";
import { prisma } from "../../db/prisma.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import { requireProjectAccess } from "../projects/projects.service.js";

export async function getTheme(projectId: string, userId: string) {
  await requireProjectAccess(projectId, userId);
  const theme = await prisma.theme.findUnique({ where: { projectId } });
  if (!theme) throw new NotFoundError("Theme not found");
  return { id: theme.id, projectId, tokens: theme.tokensJson as ThemeTokens };
}

export async function updateTheme(projectId: string, userId: string, tokens: unknown) {
  await requireProjectAccess(projectId, userId);
  const parsed = themeTokensSchema.safeParse(tokens);
  if (!parsed.success) {
    throw new ValidationError("Invalid theme tokens", parsed.error.flatten() as never);
  }
  // Typography scale must be strictly increasing
  const scale = parsed.data.typography.scale;
  const order = [scale.xs, scale.sm, scale.base, scale.lg, scale.xl, scale["2xl"], scale["3xl"]];
  for (let i = 1; i < order.length; i++) {
    if (order[i]! <= order[i - 1]!) {
      throw new ValidationError("Typography scale must be strictly increasing");
    }
  }

  const theme = await prisma.theme.update({
    where: { projectId },
    data: { tokensJson: parsed.data },
  });
  return { id: theme.id, projectId, tokens: theme.tokensJson as ThemeTokens };
}

export async function getSettings(projectId: string, userId: string) {
  const project = await requireProjectAccess(projectId, userId);
  return {
    projectId,
    name: project.name,
    description: project.description,
    exportDefaults: { format: "html" as const },
  };
}

export async function updateSettings(
  projectId: string,
  userId: string,
  input: { name?: string; description?: string | null },
) {
  await requireProjectAccess(projectId, userId);
  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });
  return {
    projectId,
    name: project.name,
    description: project.description,
    exportDefaults: { format: "html" as const },
  };
}
