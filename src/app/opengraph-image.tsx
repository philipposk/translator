import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Translator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #07070a 0%, #0a1f14 100%)",
          color: "#ededed",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#34d399", fontWeight: 700, marginBottom: 16 }}>6x7</div>
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1 }}>Translator</div>
        <div style={{ fontSize: 32, color: "#999", marginTop: 24, maxWidth: 800 }}>
          Live voice, text, file and camera translation
        </div>
      </div>
    ),
    { ...size },
  );
}
