// Canvas image preprocessing for better Tesseract OCR on camera photos.

export function preprocessForOcr(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, width, height);

  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  // Grayscale + contrast stretch
  let min = 255;
  let max = 0;
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    gray[p] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const span = Math.max(1, max - min);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = Math.round(((gray[p] - min) / span) * 255);
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Heuristic: OCR output looks like garbage. */
export function looksLikeGibberish(text: string): boolean {
  const t = text.trim();
  if (t.length < 4) return true;
  const letters = (t.match(/[\p{L}]/gu) || []).length;
  const ratio = letters / t.length;
  return ratio < 0.4;
}
