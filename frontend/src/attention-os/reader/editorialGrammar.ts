export type EditorialFormId =
  | "epistemic-key"
  | "claim-boundary"
  | "working-definition"
  | "distinction"
  | "model-statement"
  | "open-question"
  | "plain-language"
  | "cadence";

export interface EditorialFormDefinition {
  id: EditorialFormId;
  label: string;
  purpose: string;
}

export const EDITORIAL_FORMS: readonly EditorialFormDefinition[] = [
  {
    id: "working-definition",
    label: "Working definition",
    purpose: "Define a term without pretending the definition is final.",
  },
  {
    id: "distinction",
    label: "Keep this distinction",
    purpose: "Separate ideas a reader may otherwise collapse together.",
  },
  {
    id: "model-statement",
    label: "Model statement",
    purpose: "State one part of the framework in its cleanest form.",
  },
  {
    id: "claim-boundary",
    label: "Claim boundary",
    purpose: "Say precisely what the passage does and does not establish.",
  },
  {
    id: "open-question",
    label: "Open question",
    purpose: "Keep an unresolved question visible to the reader.",
  },
  {
    id: "plain-language",
    label: "In plain language",
    purpose: "Restate a dense idea in ordinary language.",
  },
  {
    id: "epistemic-key",
    label: "Epistemic key",
    purpose: "Orient the reader to several kinds of claims at once.",
  },
  {
    id: "cadence",
    label: "The model in one movement",
    purpose: "Give a sequence or synthesis deliberate visual rhythm.",
  },
] as const;

const editorialFormById = new Map(
  EDITORIAL_FORMS.map((definition) => [definition.id, definition]),
);

export type ClaimLevel =
  | "observation"
  | "model"
  | "hypothesis"
  | "speculation";

export interface ClaimLevelDefinition {
  id: ClaimLevel;
  label: string;
  purpose: string;
}

export const CLAIM_LEVELS: readonly ClaimLevelDefinition[] = [
  {
    id: "observation",
    label: "Observation",
    purpose: "A reported pattern in experience or evidence.",
  },
  {
    id: "model",
    label: "Model",
    purpose: "A practical explanatory structure.",
  },
  {
    id: "hypothesis",
    label: "Hypothesis",
    purpose: "A proposition that still requires testing.",
  },
  {
    id: "speculation",
    label: "Speculation",
    purpose: "An explicitly tentative extension of the theory.",
  },
] as const;

export function editorialFormFromText(
  text: string,
): EditorialFormId | undefined {
  const normalized = text.trim().toLocaleLowerCase();
  return EDITORIAL_FORMS.find((definition) =>
    normalized.startsWith(definition.label.toLocaleLowerCase()),
  )?.id;
}

export function editorialFormMarkdown(
  id: EditorialFormId,
  content = "",
): string {
  const definition = editorialFormById.get(id);
  if (!definition) return content;
  const quotedContent = content
    .trim()
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

  return [
    `> **${definition.label}**`,
    ">",
    quotedContent || "> ",
  ].join("\n");
}

export function claimStatementMarkdown(
  level: ClaimLevel,
  content = "",
): string {
  const definition = CLAIM_LEVELS.find((candidate) => candidate.id === level);
  if (!definition) return content;
  return `**${definition.label}:**${content.trim() ? ` ${content.trim()}` : " "}`;
}

export function claimLevelFromLabel(label: string | null): ClaimLevel | undefined {
  if (!label) return undefined;
  const normalized = label.replace(/:$/, "").trim().toLocaleLowerCase();
  return CLAIM_LEVELS.find(
    (definition) => definition.label.toLocaleLowerCase() === normalized,
  )?.id;
}
