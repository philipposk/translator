import type { WorkspaceMode } from "./settings";

export type ModeMeta = {
  id: WorkspaceMode;
  href: string;
  label: string;
  title: string;
  description: string;
};

export const WORKSPACE_MODES: ModeMeta[] = [
  {
    id: "live",
    href: "/app/live",
    label: "Live",
    title: "Live translation",
    description: "Real-time captions and two-way conversation across the table.",
  },
  {
    id: "text",
    href: "/app/text",
    label: "Text",
    title: "Text translation",
    description: "Paste or type text. Translated as you write.",
  },
  {
    id: "file",
    href: "/app/file",
    label: "Upload",
    title: "File transcription",
    description: "Upload audio or video and get a translated transcript.",
  },
  {
    id: "camera",
    href: "/app/camera",
    label: "Camera",
    title: "Camera translation",
    description: "Point your camera at signs, menus, or documents.",
  },
];

export function isWorkspaceMode(value: string): value is WorkspaceMode {
  return WORKSPACE_MODES.some((m) => m.id === value);
}

export function modeMeta(id: WorkspaceMode): ModeMeta {
  return WORKSPACE_MODES.find((m) => m.id === id) ?? WORKSPACE_MODES[1];
}
