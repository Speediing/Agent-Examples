import catalogJson from "../../../../scripts/sdlc-catalog.json" with { type: "json" };

export type AgentStage =
  | "plan"
  | "develop"
  | "review"
  | "test"
  | "release"
  | "operate";

export type AgentPattern =
  | "CHAT"
  | "LT"
  | "PF"
  | "ATA"
  | "SFR"
  | "BE"
  | "IAG"
  | "Built-in";

export type AgentDefinition = {
  slug: string;
  title: string;
  description: string;
  stage: AgentStage;
  pattern: AgentPattern;
  writes: boolean;
  offline?: boolean;
};

type CatalogExample = {
  slug: string;
  title: string;
  description: string;
  stage: AgentStage;
  pattern: AgentPattern;
  writes: boolean;
};

type FoundationExample = {
  slug: string;
  title: string;
  description: string;
  stage: AgentStage;
  recommendedForm: string;
};

const OFFLINE_SLUGS = new Set(["bugbot", "security-reviewer"]);

function toDefinition(
  example: CatalogExample | FoundationExample,
  pattern: AgentPattern,
  writes: boolean
): AgentDefinition {
  return {
    slug: example.slug,
    title: example.title,
    description: example.description,
    stage: example.stage,
    pattern,
    writes,
    offline: OFFLINE_SLUGS.has(example.slug)
  };
}

export const AGENT_CATALOG: AgentDefinition[] = [
  ...catalogJson.examples.map((example) =>
    toDefinition(example as CatalogExample, example.pattern as AgentPattern, example.writes)
  ),
  ...catalogJson.foundationExamples.map((example) =>
    toDefinition(
      example as FoundationExample,
      example.recommendedForm === "Built-in" ? "Built-in" : "LT",
      false
    )
  )
].sort((left, right) => left.slug.localeCompare(right.slug));

export const AGENT_BY_SLUG = new Map(
  AGENT_CATALOG.map((agent) => [agent.slug, agent])
);

export function listAgentSlugs(): string[] {
  return AGENT_CATALOG.map((agent) => agent.slug);
}
