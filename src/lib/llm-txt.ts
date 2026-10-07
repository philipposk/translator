import { SITE_URL } from "@/lib/seo";

/** Both /llm.txt and the /llms.txt alias describe the same manifest. */
export function llmTxtHeaders(): Record<string, string> {
  const canonical = `${SITE_URL.replace(/\/$/, "")}/llm.txt`;
  return {
    "content-type": "text/plain; charset=utf-8",
    link: `<${canonical}>; rel="canonical"`,
  };
}
