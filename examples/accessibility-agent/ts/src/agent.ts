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
    "If local.cwd contains the source that rendered the target page — including a Vercel preview URL or http://localhost — map axe selectors to files such as .tsx, .jsx, .html, or .css under local.cwd, edit them, then re-scan the same URL until the violation count drops or no more safe fixes remain.",
    "If the page was not built from files under local.cwd, summarize findings by impact level, mention rule IDs, and list concrete fixes for a developer to apply.",
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
        "Runs an axe-core accessibility scan against any URL Playwright can load (http(s), file://, or filesystem path).",
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
