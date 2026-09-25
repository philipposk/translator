/** PT ↔ EN term pairs applied after machine translation for consistency. */
const PAIRS: [string, string][] = [
  ["obrigado", "thank you"],
  ["obrigada", "thank you"],
  ["por favor", "please"],
  ["desculpe", "sorry"],
  ["bom dia", "good morning"],
  ["boa tarde", "good afternoon"],
  ["boa noite", "good evening"],
  ["tchau", "bye"],
  ["sim", "yes"],
  ["não", "no"],
  ["com licença", "excuse me"],
  ["quanto custa", "how much does it cost"],
  ["onde fica", "where is"],
  ["não entendo", "I don't understand"],
  ["fala inglês", "do you speak English"],
  ["fala português", "do you speak Portuguese"],
];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Apply glossary replacements case-insensitively, preserving original casing where possible. */
export function applyGlossary(text: string, sourceLang: string, targetLang: string): string {
  const src = sourceLang.split("-")[0];
  const tgt = targetLang.split("-")[0];
  const isPtToEn = src === "pt" && tgt === "en";
  const isEnToPt = src === "en" && tgt === "pt";
  if (!isPtToEn && !isEnToPt) return text;

  let out = text;
  for (const [from, to] of PAIRS) {
    const [search, replace] = isPtToEn ? [from, to] : [to, from];
    const re = new RegExp(`\\b${escapeRe(search)}\\b`, "gi");
    out = out.replace(re, (match) => {
      if (match === match.toUpperCase()) return replace.toUpperCase();
      if (match[0] === match[0].toUpperCase()) {
        return replace.charAt(0).toUpperCase() + replace.slice(1);
      }
      return replace;
    });
  }
  return out;
}
