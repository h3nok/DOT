import { createContext, useContext } from "react";
import type { ArchitecturePartId } from "./heroData";

export interface ArchitectureFocus {
  /** The part the current concept explains; the diagram brings it forward. */
  focus: ArchitecturePartId | null;
  setFocus: (part: ArchitecturePartId | null) => void;
  /** A part chosen in the diagram; the slideshow turns to its concept. */
  requested: { part: ArchitecturePartId; at: number } | null;
  request: (part: ArchitecturePartId) => void;
}

export const ArchitectureFocusContext = createContext<ArchitectureFocus>({
  focus: null,
  setFocus: () => {},
  requested: null,
  request: () => {},
});

export const useArchitectureFocus = () => useContext(ArchitectureFocusContext);
