import { authedFetch } from "./orchestratorHttp";

export interface PublicationSectionMeta {
  slug?: string;
  kind?: string;
  number?: number | null;
  subtitle?: string | null;
  part?: string;
  word_count?: number;
  reading_time_minutes?: number;
  related_concepts?: string[];
}

export interface PublicationProjectMeta {
  series_title?: string;
  subtitle?: string;
  author?: string;
  label?: string;
  source?: { format?: string; sha256?: string };
  extent?: {
    chapters?: number;
    words?: number;
    equations?: number;
    references?: number;
  };
  reader_contract?: {
    finite?: boolean;
    autoplay?: boolean;
    claim_levels?: string[];
  };
}

export interface PublicationReleaseManifestSection {
  id: string;
  parent_id: string | null;
  order: number;
  title: string;
  body_ref: string | null;
  status: string;
  meta?: PublicationSectionMeta | null;
}

export interface PublicationReleaseManifest {
  schema_version: "publication.release.v1";
  generated_at: string;
  project: {
    id: string;
    owner_id: string;
    type: string;
    title: string;
    slug: string;
    status: string;
    visibility: string;
    meta?: PublicationProjectMeta | null;
  };
  release: {
    id: string;
    project_id: string;
    version: number;
    slug: string;
    status: string;
    manifest_key: string;
    rendered_at: string | null;
    published_at: string | null;
    revoked_at: string | null;
  };
  sections: PublicationReleaseManifestSection[];
}

export interface PublicationProjectCreate {
  title: string;
  slug?: string;
  type?: string;
  visibility?: string;
}

export interface PublicationProjectUpdate {
  title?: string;
  status?: string;
  visibility?: string;
}

export interface PublicationProjectRead {
  id: string;
  owner_id: string;
  type: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string | null;
}

export interface PublicationSectionCreate {
  parent_id?: string;
  order?: number;
  title: string;
  body_ref?: string;
}

export interface PublicationSectionUpdate {
  title?: string;
  body_ref?: string;
  status?: string;
  order?: number;
}

export interface PublicationSectionRead {
  id: string;
  project_id: string;
  parent_id: string | null;
  section_order: number;
  title: string;
  body_ref: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

export interface PublicationRevisionCreate {
  body_ref: string;
  message?: string;
}

export interface PublicationRevisionRead {
  id: string;
  section_id: string;
  editor_id: string;
  body_ref: string;
  message: string | null;
  created_at: string;
}

export interface PublicationReleaseRead {
  id: string;
  project_id: string;
  version: number;
  slug: string;
  status: string;
  manifest_key: string;
  rendered_at: string | null;
  published_at: string | null;
  revoked_at: string | null;
}

export interface PublicationValidationRead {
  valid: boolean;
  errors: string[];
}

export interface OrchestratorReadiness {
  status: "ready" | "degraded" | string;
  service: string;
  version: string;
  checks: Record<string, string>;
}

export const ORCHESTRATOR_URL =
  import.meta.env.VITE_ORCHESTRATOR_URL || "http://127.0.0.1:8000";

export const PROFILE_DELIVERY_OWNER_ID =
  import.meta.env.VITE_PROFILE_DELIVERY_OWNER_ID || "henok";
export const PROFILE_DELIVERY_SLUG =
  import.meta.env.VITE_PROFILE_DELIVERY_SLUG || "henok-profile";
export const ORCHESTRATOR_OWNER_ID =
  import.meta.env.VITE_ORCHESTRATOR_OWNER_ID || PROFILE_DELIVERY_OWNER_ID;

const orchestratorUrl = (path: string) => {
  const baseUrl = ORCHESTRATOR_URL.replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const deliveryUrl = (ownerId: string, slug: string, version?: number) => {
  const url = new URL(
    orchestratorUrl(
      `/v1/publications/delivery/${encodeURIComponent(ownerId)}/${encodeURIComponent(slug)}/manifest`,
    ),
  );
  if (version) {
    url.searchParams.set("version", String(version));
  }
  return url.toString();
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      detail || `Orchestrator request failed: ${response.status}`,
    );
  }

  return (await response.json()) as T;
}

export async function fetchOrchestratorReadiness(
  signal?: AbortSignal,
): Promise<OrchestratorReadiness> {
  const response = await fetch(orchestratorUrl("/health/ready"), {
    cache: "no-store",
    signal,
  });

  return readJson<OrchestratorReadiness>(response);
}

export async function createPublicationProject(
  payload: PublicationProjectCreate,
  ownerId = ORCHESTRATOR_OWNER_ID,
  signal?: AbortSignal,
): Promise<PublicationProjectRead> {
  const response = await authedFetch(orchestratorUrl("/v1/publications/projects"), {
    method: "POST",
    ownerId,
    json: payload,
    signal,
  });

  return readJson<PublicationProjectRead>(response);
}

export async function fetchPublicationProjects(
  ownerId = ORCHESTRATOR_OWNER_ID,
  signal?: AbortSignal,
): Promise<PublicationProjectRead[]> {
  const response = await authedFetch(orchestratorUrl("/v1/publications/projects"), {
    ownerId,
    signal,
  });

  return readJson<PublicationProjectRead[]>(response);
}

export async function fetchPublicationProject(
  projectId: string,
  ownerId = ORCHESTRATOR_OWNER_ID,
  signal?: AbortSignal,
): Promise<PublicationProjectRead> {
  const response = await authedFetch(
    orchestratorUrl(
      `/v1/publications/projects/${encodeURIComponent(projectId)}`,
    ),
    {
      ownerId,
      signal,
    },
  );

  return readJson<PublicationProjectRead>(response);
}

export async function fetchPublicationSections(
  projectId: string,
  ownerId = ORCHESTRATOR_OWNER_ID,
  signal?: AbortSignal,
): Promise<PublicationSectionRead[]> {
  const response = await authedFetch(
    orchestratorUrl(
      `/v1/publications/projects/${encodeURIComponent(projectId)}/sections`,
    ),
    {
      ownerId,
      signal,
    },
  );

  return readJson<PublicationSectionRead[]>(response);
}

export async function updatePublicationProject(
  projectId: string,
  payload: PublicationProjectUpdate,
  ownerId = ORCHESTRATOR_OWNER_ID,
  signal?: AbortSignal,
): Promise<PublicationProjectRead> {
  const response = await authedFetch(
    orchestratorUrl(
      `/v1/publications/projects/${encodeURIComponent(projectId)}`,
    ),
    {
      method: "PATCH",
      ownerId,
      json: payload,
      signal,
    },
  );

  return readJson<PublicationProjectRead>(response);
}

export async function createPublicationSection(
  projectId: string,
  payload: PublicationSectionCreate,
  ownerId = ORCHESTRATOR_OWNER_ID,
  signal?: AbortSignal,
): Promise<PublicationSectionRead> {
  const response = await authedFetch(
    orchestratorUrl(
      `/v1/publications/projects/${encodeURIComponent(projectId)}/sections`,
    ),
    {
      method: "POST",
      ownerId,
      json: payload,
      signal,
    },
  );

  return readJson<PublicationSectionRead>(response);
}

export async function updatePublicationSection(
  sectionId: string,
  payload: PublicationSectionUpdate,
  ownerId = ORCHESTRATOR_OWNER_ID,
  signal?: AbortSignal,
): Promise<PublicationSectionRead> {
  const response = await authedFetch(
    orchestratorUrl(
      `/v1/publications/sections/${encodeURIComponent(sectionId)}`,
    ),
    {
      method: "PATCH",
      ownerId,
      json: payload,
      signal,
    },
  );

  return readJson<PublicationSectionRead>(response);
}

export async function createPublicationRevision(
  sectionId: string,
  payload: PublicationRevisionCreate,
  ownerId = ORCHESTRATOR_OWNER_ID,
  signal?: AbortSignal,
): Promise<PublicationRevisionRead> {
  const response = await authedFetch(
    orchestratorUrl(
      `/v1/publications/sections/${encodeURIComponent(sectionId)}/revisions`,
    ),
    {
      method: "POST",
      ownerId,
      json: payload,
      signal,
    },
  );

  return readJson<PublicationRevisionRead>(response);
}

export async function fetchPublicationReleases(
  projectId: string,
  ownerId = ORCHESTRATOR_OWNER_ID,
  signal?: AbortSignal,
): Promise<PublicationReleaseRead[]> {
  const response = await authedFetch(
    orchestratorUrl(
      `/v1/publications/projects/${encodeURIComponent(projectId)}/releases`,
    ),
    {
      ownerId,
      signal,
    },
  );

  return readJson<PublicationReleaseRead[]>(response);
}

export async function validatePublicationProject(
  projectId: string,
  ownerId = ORCHESTRATOR_OWNER_ID,
  signal?: AbortSignal,
): Promise<PublicationValidationRead> {
  const response = await authedFetch(
    orchestratorUrl(
      `/v1/publications/projects/${encodeURIComponent(projectId)}/validate`,
    ),
    {
      method: "POST",
      ownerId,
      signal,
    },
  );

  return readJson<PublicationValidationRead>(response);
}

export async function createPublicationRelease(
  projectId: string,
  options: { idempotencyKey: string; slug?: string; ownerId?: string },
): Promise<PublicationReleaseRead> {
  const response = await authedFetch(
    orchestratorUrl(
      `/v1/publications/projects/${encodeURIComponent(projectId)}/releases`,
    ),
    {
      method: "POST",
      ownerId: options.ownerId,
      idempotencyKey: options.idempotencyKey,
      json: { slug: options.slug },
    },
  );

  return readJson<PublicationReleaseRead>(response);
}

export async function fetchPublicDeliveryManifest(
  ownerId: string,
  slug: string,
  options: { version?: number; signal?: AbortSignal } = {},
): Promise<PublicationReleaseManifest | null> {
  const response = await fetch(deliveryUrl(ownerId, slug, options.version), {
    cache: "no-store",
    signal: options.signal,
  });

  if (response.status === 404) {
    return null;
  }

  return readJson<PublicationReleaseManifest>(response);
}

export async function fetchProfileDeliveryManifest(
  signal?: AbortSignal,
): Promise<PublicationReleaseManifest | null> {
  return fetchPublicDeliveryManifest(
    PROFILE_DELIVERY_OWNER_ID,
    PROFILE_DELIVERY_SLUG,
    { signal },
  );
}

/** Fetch the plain-text body for a section whose body_ref is a storage key. */
export async function fetchSectionBody(
  bodyRef: string,
): Promise<string | null> {
  const response = await fetch(
    orchestratorUrl(
      `/v1/publications/delivery/body/${encodeURIComponent(bodyRef)}`,
    ),
    { cache: "force-cache" },
  );
  if (!response.ok) return null;
  return response.text();
}
