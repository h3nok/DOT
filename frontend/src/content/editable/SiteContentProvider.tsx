/**
 * Editable public copy, released-by-default (ADR-0021).
 *
 * Two rules shape this provider:
 *
 * 1. The compiled-in wording is the source of truth until an override is
 *    *published*. Every failure — no orchestrator, network down, empty table —
 *    resolves to the released copy, so the public surfaces cannot go blank.
 * 2. Editing is opt-in. The steward is a reader first; blocks only become
 *    editable after they deliberately turn edit mode on, so the reading surface
 *    is never cluttered by controls nobody asked for.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "../../dot/useAuth";
import {
  fetchDrafts,
  fetchPublishedContent,
  revertBlock,
  saveBlock,
  siteContentAvailable,
  type SiteContentBlocks,
  type SiteContentDraft,
} from "../../services/SiteContentService";

interface SiteContentContextValue {
  /** Resolve a block to its live value, falling back to the released wording. */
  resolve: (key: string, released: string) => string;
  /** True when the steward has an unpublished draft for this block. */
  hasDraft: (key: string) => boolean;
  draftValue: (key: string) => string | null;
  canEdit: boolean;
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  save: (key: string, value: string, options?: { publish?: boolean }) => Promise<void>;
  revert: (key: string) => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const { isOwner } = useAuth();
  const [published, setPublished] = useState<SiteContentBlocks>({});
  const [drafts, setDrafts] = useState<Record<string, SiteContentDraft>>({});
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    void fetchPublishedContent(abort.signal).then(setPublished);
    return () => abort.abort();
  }, []);

  const loadDrafts = useCallback(async () => {
    if (!isOwner) return;
    const rows = await fetchDrafts();
    setDrafts(Object.fromEntries(rows.map((row) => [row.key, row])));
  }, [isOwner]);

  useEffect(() => {
    if (!isOwner) {
      // Signing out must also drop edit mode, or the next reader on this
      // machine inherits a surface covered in controls they cannot use.
      setDrafts({});
      setEditMode(false);
      return;
    }
    void loadDrafts();
  }, [isOwner, loadDrafts]);

  const resolve = useCallback(
    (key: string, released: string): string => {
      // In edit mode the steward sees their own draft, so what they are editing
      // is what they last typed rather than what the public currently reads.
      if (editMode) {
        const draft = drafts[key]?.draft_value;
        if (typeof draft === "string" && draft.length > 0) return draft;
      }
      const live = published[key];
      return typeof live === "string" && live.length > 0 ? live : released;
    },
    [drafts, editMode, published],
  );

  const hasDraft = useCallback(
    (key: string): boolean => {
      const row = drafts[key];
      if (!row) return false;
      return row.draft_value !== null && row.draft_value !== row.published_value;
    },
    [drafts],
  );

  const draftValue = useCallback(
    (key: string): string | null => drafts[key]?.draft_value ?? null,
    [drafts],
  );

  const save = useCallback(
    async (key: string, value: string, options: { publish?: boolean } = {}) => {
      await saveBlock(key, value, options);
      if (options.publish) {
        const trimmed = value.trim();
        setPublished((current) => {
          const next = { ...current };
          if (trimmed) next[key] = trimmed;
          else delete next[key];
          return next;
        });
      }
      await loadDrafts();
    },
    [loadDrafts],
  );

  const revert = useCallback(
    async (key: string) => {
      await revertBlock(key);
      setPublished((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setDrafts((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const value = useMemo<SiteContentContextValue>(
    () => ({
      resolve,
      hasDraft,
      draftValue,
      canEdit: isOwner && siteContentAvailable(),
      editMode,
      setEditMode,
      save,
      revert,
    }),
    [resolve, hasDraft, draftValue, isOwner, editMode, save, revert],
  );

  return (
    <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
  );
}

/**
 * Usable outside the provider on purpose: a surface rendered in isolation (a
 * test, a storybook, a lazily-mounted route) still shows its released copy.
 */
export function useSiteContent(): SiteContentContextValue {
  const context = useContext(SiteContentContext);
  if (context) return context;

  return {
    resolve: (_key, released) => released,
    hasDraft: () => false,
    draftValue: () => null,
    canEdit: false,
    editMode: false,
    setEditMode: () => undefined,
    save: async () => undefined,
    revert: async () => undefined,
  };
}
