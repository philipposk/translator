export type ExportSegment = {
  start: number;
  end: number;
  text: string;
  translation?: string;
};

export type ExportField = "text" | "translation" | "bilingual";

function segmentText(seg: ExportSegment, field: ExportField): string {
  if (field === "bilingual") {
    const tr = (seg.translation || "").trim();
    const src = seg.text.trim();
    return tr ? `${src}\n${tr}` : src;
  }
  if (field === "translation") return (seg.translation || seg.text).trim();
  return seg.text.trim();
}

function padSrt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function padVtt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export function toSrt(segments: ExportSegment[], field: ExportField = "translation"): string {
  return segments
    .map((seg, i) => {
      const content = segmentText(seg, field);
      if (!content) return "";
      return `${i + 1}\n${padSrt(seg.start)} --> ${padSrt(seg.end)}\n${content}\n`;
    })
    .filter(Boolean)
    .join("\n");
}

export function toVtt(segments: ExportSegment[], field: ExportField = "translation"): string {
  const body = segments
    .map((seg) => {
      const content = segmentText(seg, field);
      if (!content) return "";
      return `${padVtt(seg.start)} --> ${padVtt(seg.end)}\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}

export function toTxt(segments: ExportSegment[], field: ExportField = "translation"): string {
  return segments
    .map((seg) => segmentText(seg, field))
    .filter(Boolean)
    .join("\n\n");
}

export function toPlainTxt(source: string, target?: string): string {
  const s = source.trim();
  const t = (target || "").trim();
  if (s && t) return `${s}\n\n${t}`;
  return t || s;
}

export function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
