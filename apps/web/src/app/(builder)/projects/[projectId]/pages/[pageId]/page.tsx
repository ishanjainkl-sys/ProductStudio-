import { BuilderShell } from "@/features/builder/BuilderShell";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ projectId: string; pageId: string }>;
}) {
  const { projectId, pageId } = await params;
  return <BuilderShell projectId={projectId} pageId={pageId} />;
}
