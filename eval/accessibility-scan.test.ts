import { describe, expect, it } from "vitest";
import {
  defaultFixtureUrl,
  scanAccessibility
} from "../examples/accessibility-agent/ts/src/scan.js";

const REQUIRED_RULE_IDS = [
  "button-name",
  "html-has-lang",
  "image-alt",
  "landmark-one-main",
  "page-has-heading-one",
  "region"
];

describe("accessibility fixture scan", () => {
  it("reports the stable rule-id set for the committed fixture", async () => {
    const result = await scanAccessibility(defaultFixtureUrl());
    const ruleIds = new Set(result.violations.map((violation) => violation.id));

    for (const ruleId of REQUIRED_RULE_IDS) {
      expect(ruleIds.has(ruleId)).toBe(true);
    }

    expect(result.violationCount).toBeGreaterThanOrEqual(REQUIRED_RULE_IDS.length);
  });
});
