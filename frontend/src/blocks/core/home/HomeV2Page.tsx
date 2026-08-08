import { NucleusGraph, dotGraph } from "../../../dot";

/** The official home: canon first, with each deliberate next step one move away. */
export default function HomeV2Page() {
  return <NucleusGraph root={dotGraph} />;
}