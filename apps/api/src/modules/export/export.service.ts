import fs from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";
import { createWriteStream } from "node:fs";
import { getExportTarget } from "@productstudio/export-engine";
import type { PageDocument, ThemeTokens } from "@productstudio/shared-types";
import { migratePageDocument } from "@productstudio/json-engine";
import { loadEnv } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { NotFoundError } from "../../lib/errors.js";
import { readAssetBuffer } from "../assets/assets.service.js";

export async function exportPage(
  pageId: string,
  userId: string,
  format: "html" | "react",
) {
  const page = await prisma.page.findFirst({
    where: { id: pageId, deletedAt: null },
    include: { project: { include: { theme: true } } },
  });
  if (!page || page.project.deletedAt || page.project.ownerId !== userId) {
    throw new NotFoundError("Page not found");
  }

  const doc = migratePageDocument(page.contentJson as unknown as PageDocument);
  const theme = (page.project.theme?.tokensJson ?? undefined) as ThemeTokens | undefined;
  const target = getExportTarget(format);

  // Resolve asset URLs for markup; collect binary for zip
  const assets = await prisma.asset.findMany({
    where: { projectId: page.projectId, deletedAt: null },
  });
  const urlById = new Map(assets.map((a) => [a.id, a.url]));
  const assetContents: Record<string, Buffer> = {};
  for (const a of assets) {
    const buf = await readAssetBuffer(a.id);
    if (buf) assetContents[a.id] = buf;
  }

  const bundle = await target.generate(doc, {
    theme,
    resolveAssetUrl: (id) => urlById.get(id) ?? null,
    assetContents,
  });

  const env = loadEnv();
  await fs.mkdir(env.EXPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `${pageId}_${format}_${stamp}.zip`;
  const zipPath = path.join(env.EXPORT_DIR, filename);

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve());
    archive.on("error", reject);
    archive.pipe(output);
    for (const file of bundle.files) {
      archive.append(file.content, { name: file.path });
    }
    void archive.finalize();
  });

  return {
    downloadUrl: `/exports/${filename}`,
    expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
  };
}
