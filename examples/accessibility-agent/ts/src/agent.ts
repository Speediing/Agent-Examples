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
    "If the target is a local HTML file in this repository, edit that file to fix violations you can address with markup changes, then call scan_accessibility again to verify the count dropped.",
    "For remote URLs, summarize findings by impact level, mention rule IDs, and list concrete fixes for a developer to apply.",
    "If there are no violations, say the page passed the automated scan.",
    "Return a short summary of what you found, what you changed (if anything), and the latest scan result.",
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
