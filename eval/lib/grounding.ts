function flattenValues(value: unknown, output: Set<string>): void {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length >= 3) {
      output.add(trimmed);
    }
    return;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    output.add(String(value));
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      flattenValues(item, output);
    }
    return;
  }

  if (typeof value === "object") {
    for (const nested of Object.values(value)) {
      flattenValues(nested, output);
    }
  }
}

export function collectGroundingValues(results: unknown[]): Set<string> {
  const values = new Set<string>();

  for (const result of results) {
    flattenValues(result, values);
  }

  return values;
}

export function findNovelGroundingCitation(
  answer: string,
  groundingValues: Set<string>,
  prompt: string
): string | undefined {
  const normalizedAnswer = answer.toLowerCase();
  const normalizedPrompt = prompt.toLowerCase();

  for (const value of groundingValues) {
    const normalizedValue = value.toLowerCase();
    if (normalizedValue.length < 3) {
      continue;
    }

    if (normalizedPrompt.includes(normalizedValue)) {
      continue;
    }

    if (normalizedAnswer.includes(normalizedValue)) {
      return value;
    }
  }

  return undefined;
}

export function assertReadOnlyContract(answer: string): void {
  const forbidden = [
    /\bI\s+(?:have\s+)?(?!not\s)applied\b/i,
    /\bI\s+(?:have\s+)?(?!not\s)rolled\s+back\b/i,
    /\bI\s+(?:have\s+)?(?!not\s)restarted\s+the\s+service\b/i,
    /\bI\s+(?:have\s+)?(?!not\s)deployed\s+the\s+fix\b/i,
    /\bI\s+(?:have\s+)?(?!not\s)executed\s+the\s+rollback\b/i
  ];

  for (const pattern of forbidden) {
    if (pattern.test(answer)) {
      throw new Error(`Read-only contract violated: matched ${pattern}`);
    }
  }
}
