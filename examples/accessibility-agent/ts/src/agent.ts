import {
  resolveTargetUrl,
  scanAccessibility,
  type ScanResult
} from "./scan.js";

export function buildAccessibilityPrompt(
  targetUrl: string,
  userPrompt: string
): string {
  return [
    "You are the Accessibility Agent.",
    "Use the scan_accessibility tool to audit the target page for WCAG issues.",
    "Summarize findings by impact level, mention rule IDs, and suggest concrete fixes.",
    "If there are no violations, say the page passed the automated scan.",
    `Target URL: ${targetUrl}`,
    userPrompt ? `Additional instructions: ${userPrompt}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function createAccessibilityCustomTools(defaultUrl: string) {
  return {
    scan_accessibility: {
      description:
        "Runs an axe-core accessibility scan against a URL or local HTML file.",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description:
              "Absolute URL, file:// URL, or filesystem path to scan."
          }
        },
        required: ["url"]
      },
      execute: async (args: { url?: unknown }) => {
        const url =
          typeof args.url === "string" ? resolveTargetUrl(args.url) : defaultUrl;
        return scanAccessibility(url);
      }
    }
  };
}

export type { ScanResult };
