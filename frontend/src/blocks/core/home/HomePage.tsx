import { NucleusGraph, dotGraph } from "../../../dot";

/** Home is the movement graph: canon first, with each limb one deliberate move away. */
export default function HomePage() {
  return <NucleusGraph root={dotGraph} />;
}
