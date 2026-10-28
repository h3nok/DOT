import type { AgentLens } from "../../../dot/agent";

export type HeroAskRequest = {
  query: string;
  lens: AgentLens;
};
