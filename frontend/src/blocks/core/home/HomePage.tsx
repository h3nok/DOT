import { NucleusGraph, profileGraph } from "../../../dot";

/**
 * Home — the profile as a Dot.
 *
 * The whole page is one living graph: you at the centre, your attributes
 * radiating around you, on the organism background. Everything else (the book,
 * the work, the doctrine) is reached by drilling into a node, which becomes a
 * surface of its own. Edit the graph in `src/dot/profileGraph.ts`.
 */
export default function HomePage() {
  return <NucleusGraph root={profileGraph} />;
}
