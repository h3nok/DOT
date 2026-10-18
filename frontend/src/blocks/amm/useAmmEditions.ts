import { useEffect, useState } from "react";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { essayRoute, fetchEssayIndex } from "../../content/essays/essays";
import { fetchReleasedWriting } from "../../services/OrchestratorWritingService";
import { publicationRoute, replacesEssay } from "../publication/writing/publicationBridge";

export type AmmEdition = { id: string; slug: string; title: string; summary: string; date: string; href: string; cover?: string; minutes?: number; sections?: { id: string; title: string }[] };

/** Every released AMM edition, newest first: Markdown essays plus Studio releases that do not replace one. */
export function useAmmEditions() {
  const AMM = useAmmContent();
  const [editions, setEditions] = useState<AmmEdition[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setFailed(false);
    void Promise.allSettled([fetchEssayIndex(abort.signal), fetchReleasedWriting(abort.signal, true)]).then(([essays, writing]) => {
      if (abort.signal.aborted) return;
      const posts: AmmEdition[] = [];
      const native = writing.status === "fulfilled" ? writing.value : [];
      if (essays.status === "fulfilled") posts.push(...essays.value.filter(item => item.series === AMM.series && !native.some(entry => replacesEssay(entry, item.slug))).map(item => ({ id: `essay:${item.slug}`, slug: item.slug, title: item.title, summary: AMM.money.companions.find(note => note.id === item.slug)?.summary ?? item.summary, date: item.published, href: essayRoute(item.slug), cover: item.cover?.src, minutes: item.readingMinutes, sections: item.sections })));
      posts.push(...native.filter(item => !item.withdrawn_at && item.presentation?.series === AMM.series).map(item => ({ id: `writing:${item.work_id}`, slug: item.work_slug, title: item.title, summary: item.summary ?? "", date: item.released_at.slice(0, 10), href: publicationRoute(item), cover: item.cover?.src })));
      setEditions(posts.sort((a, b) => b.date.localeCompare(a.date)));
      setFailed(essays.status === "rejected" || writing.status === "rejected");
    });
    return () => abort.abort();
  }, [attempt, AMM.series, AMM.money.companions]);
  return { editions, failed, retry: () => setAttempt(value => value + 1) };
}
