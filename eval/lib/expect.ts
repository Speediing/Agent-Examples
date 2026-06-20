import type { GraderResult } from "./types.js";

export type ExpectMatcher = {
  name: string;
  check: (value: string) => GraderResult;
};

export function includes(substring: string): ExpectMatcher {
  return {
    name: `includes:${substring}`,
    check: (value) => ({
      grader: `includes:${substring}`,
      pass: value.includes(substring),
      message: value.includes(substring)
        ? undefined
        : `Expected reply to include ${JSON.stringify(substring)}`
    })
  };
}

export function matches(pattern: RegExp): ExpectMatcher {
  return {
    name: `matches:${pattern}`,
    check: (value) => ({
      grader: `matches:${pattern}`,
      pass: pattern.test(value),
      message: pattern.test(value)
        ? undefined
        : `Expected reply to match ${pattern}`
    })
  };
}
