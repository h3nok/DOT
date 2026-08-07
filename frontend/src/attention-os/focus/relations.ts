/**
 * The relation vocabulary (doc 08 §4.2).
 *
 * Navigation is offered in these terms rather than as a menu, so every move a
 * member makes has a stated reason. Relations are meaning, never popularity.
 */

export type DotRelation =
  | "depends-on"
  | "leads-to"
  | "contrasts"
  | "defines"
  | "applies";

export const RELATION_PHRASE: Record<DotRelation, string> = {
  "depends-on": "this depends on",
  "leads-to": "this leads to",
  contrasts: "this contrasts with",
  defines: "this defines",
  applies: "this applies to",
};

export const RELATIONS: readonly DotRelation[] = Object.keys(
  RELATION_PHRASE,
) as DotRelation[];
