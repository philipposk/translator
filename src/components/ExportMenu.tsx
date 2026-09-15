"use client";

import {
  downloadText,
  toPlainTxt,
  toSrt,
  toTxt,
  toVtt,
  type ExportField,
  type ExportSegment,
} from "@/lib/export";

type Props = {
  segments?: ExportSegment[] | null;
  sourceText?: string;
  targetText?: string;
  baseName?: string;
};

export function ExportMenu({ segments, sourceText, targetText, baseName = "translation" }: Props) {
  const hasSegments = !!segments?.length;

  function exportAs(ext: "srt" | "vtt" | "txt", field: ExportField) {
    const stamp = new Date().toISOString().slice(0, 10);
    const name = `${baseName}-${stamp}.${ext}`;

    if (hasSegments && segments) {
      if (ext === "srt") return downloadText(name, toSrt(segments, field), "application/x-subrip;charset=utf-8");
      if (ext === "vtt") return downloadText(name, toVtt(segments, field), "text/vtt;charset=utf-8");
      return downloadText(name, toTxt(segments, field));
    }

    const plain = toPlainTxt(sourceText || "", field === "translation" ? targetText : undefined);
    downloadText(`${baseName}-${stamp}.txt`, plain);
  }

  if (!hasSegments && !sourceText?.trim() && !targetText?.trim()) return null;

  return (
    <div className="tr-export-menu">
      <span className="tr-export-label">Export</span>
      {hasSegments ? (
        <>
          <button type="button" className="btn btn-ghost tr-export-btn" onClick={() => exportAs("srt", "translation")}>
            SRT
          </button>
          <button type="button" className="btn btn-ghost tr-export-btn" onClick={() => exportAs("vtt", "translation")}>
            VTT
          </button>
          <button type="button" className="btn btn-ghost tr-export-btn" onClick={() => exportAs("txt", "bilingual")}>
            TXT
          </button>
        </>
      ) : (
        <button type="button" className="btn btn-ghost tr-export-btn" onClick={() => exportAs("txt", "translation")}>
          TXT
        </button>
      )}
    </div>
  );
}
