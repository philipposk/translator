import { Workspace } from "@/components/translate/Workspace";
import { isWorkspaceMode, modeMeta } from "@/lib/modes";
import type { WorkspaceMode } from "@/lib/settings";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [{ mode: "live" }, { mode: "text" }, { mode: "file" }, { mode: "camera" }];
}

export async function generateMetadata({ params }: { params: Promise<{ mode: string }> }): Promise<Metadata> {
  const { mode } = await params;
  if (!isWorkspaceMode(mode)) return {};
  const meta = modeMeta(mode);
  return { title: `${meta.title} | Translator` };
}

export default async function ModePage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!isWorkspaceMode(mode)) notFound();
  return <Workspace mode={mode as WorkspaceMode} />;
}
