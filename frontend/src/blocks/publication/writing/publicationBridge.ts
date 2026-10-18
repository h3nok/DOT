import library from "../../../content/amm-library.json";
import { essayRoute } from "../../../content/essays/essays";
import { writingRoute, type ReleasedWriting } from "../../../services/OrchestratorWritingService";

export const managedEssay = (slug: string) => library.find(item => item.slug === slug);
export const replacesEssay = (entry: ReleasedWriting, slug: string) => !!managedEssay(slug) && entry.work_slug === slug;
export const publicationRoute = (entry: ReleasedWriting) => replacesEssay(entry, entry.work_slug) ? essayRoute(entry.work_slug) : writingRoute(entry.work_id);
