import type { PrismaClient } from "@prisma/client";
import { generateId, type PageDocument } from "@productstudio/shared-types";
import { collectAssetIds } from "@productstudio/renderer";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function syncAssetReferences(
  db: Tx | PrismaClient,
  pageId: string,
  doc: PageDocument,
): Promise<void> {
  const assetIds = collectAssetIds(doc.root);
  await db.assetReference.deleteMany({ where: { pageId } });
  if (!assetIds.length) return;

  // One reference row per asset on the page (nodeId = page root for aggregate usage)
  await db.assetReference.createMany({
    data: assetIds.map((assetId) => ({
      id: generateId("ref"),
      assetId,
      pageId,
      nodeId: doc.root.id,
    })),
    skipDuplicates: true,
  });
}
