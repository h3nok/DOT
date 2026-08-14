export interface ReaderReference {
  number: number;
  markdown: string;
}

export interface ReaderConceptDefinition {
  id: string;
  title: string;
  aliases: readonly string[];
  definition: string;
  context: string;
  boundary: string;
  claimLevel: string;
  sourceHref: string;
  mapHref: string;
}
