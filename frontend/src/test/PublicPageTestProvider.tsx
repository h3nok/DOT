import type { ReactNode } from "react";
import { OrganismProvider } from "../organism/OrganismContext";
import { ThemeProvider } from "../shared/contexts/SimpleThemeContext";

/** Shared headers use the same appearance context as the application's entry. */
export function PublicPageTestProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider><OrganismProvider>{children}</OrganismProvider></ThemeProvider>;
}
