import {
  ORCHESTRATOR_OWNER_ID,
  ORCHESTRATOR_URL,
} from "./OrchestratorPublicationService";

export interface FootprintAccountRead {
  id: string;
  owner_id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  profile_url: string | null;
  external_id: string | null;
  auth_mode: string;
  status: string;
  sync_cursor: Record<string, unknown> | null;
  last_synced_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface FootprintNodeRead {
  id: string;
  owner_id: string;
  kind: string;
  label: string;
  platform: string | null;
  external_id: string | null;
  source_ref: Record<string, unknown> | null;
  properties: Record<string, unknown> | null;
  visibility: string;
  confidence: number;
  first_seen_at: string;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface FootprintEdgeRead {
  id: string;
  owner_id: string;
  source_node_id: string;
  target_node_id: string;
  relation: string;
  platform: string | null;
  weight: number;
  confidence: number;
  evidence_ref: Record<string, unknown> | null;
  first_seen_at: string;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface FootprintGraphSnapshot {
  owner_id: string;
  accounts: FootprintAccountRead[];
  nodes: FootprintNodeRead[];
  edges: FootprintEdgeRead[];
}

export interface FootprintAccountCreate {
  platform: string;
  handle: string;
  display_name?: string;
  profile_url?: string;
  external_id?: string;
  auth_mode?: string;
  status?: string;
  sync_cursor?: Record<string, unknown>;
}

export interface FootprintImportCreate {
  connector: string;
  import_mode?: string;
  account_id?: string;
  source_ref?: Record<string, unknown>;
}

export interface FootprintImportRead {
  id: string;
  owner_id: string;
  account_id: string | null;
  run_id: string | null;
  connector: string;
  import_mode: string;
  status: string;
  requested_by: string | null;
  source_ref: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

const orchestratorUrl = (path: string) => {
  const baseUrl = ORCHESTRATOR_URL.replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const ownerHeaders = (ownerId = ORCHESTRATOR_OWNER_ID) => ({
  "X-Owner-Id": ownerId,
});

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Orchestrator graph request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchFootprintGraphSnapshot(
  options: {
    ownerId?: string;
    platform?: string;
    kind?: string;
    relation?: string;
    signal?: AbortSignal;
  } = {},
): Promise<FootprintGraphSnapshot> {
  const url = new URL(orchestratorUrl("/v1/graph/snapshot"));
  if (options.platform) url.searchParams.set("platform", options.platform);
  if (options.kind) url.searchParams.set("kind", options.kind);
  if (options.relation) url.searchParams.set("relation", options.relation);

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: ownerHeaders(options.ownerId),
    signal: options.signal,
  });

  return readJson<FootprintGraphSnapshot>(response);
}

export async function createFootprintAccount(
  payload: FootprintAccountCreate,
  ownerId = ORCHESTRATOR_OWNER_ID,
): Promise<FootprintAccountRead> {
  const response = await fetch(orchestratorUrl("/v1/graph/accounts"), {
    method: "POST",
    cache: "no-store",
    headers: {
      ...ownerHeaders(ownerId),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readJson<FootprintAccountRead>(response);
}

export async function fetchFootprintImports(
  options: {
    ownerId?: string;
    connector?: string;
    status?: string;
    limit?: number;
    signal?: AbortSignal;
  } = {},
): Promise<FootprintImportRead[]> {
  const url = new URL(orchestratorUrl("/v1/graph/imports"));
  if (options.connector) url.searchParams.set("connector", options.connector);
  if (options.status) url.searchParams.set("status", options.status);
  if (options.limit) url.searchParams.set("limit", String(options.limit));

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: ownerHeaders(options.ownerId),
    signal: options.signal,
  });

  return readJson<FootprintImportRead[]>(response);
}

export async function createFootprintImport(
  payload: FootprintImportCreate,
  options: { ownerId?: string; idempotencyKey: string },
): Promise<FootprintImportRead> {
  const response = await fetch(orchestratorUrl("/v1/graph/imports"), {
    method: "POST",
    cache: "no-store",
    headers: {
      ...ownerHeaders(options.ownerId),
      "Content-Type": "application/json",
      "Idempotency-Key": options.idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  return readJson<FootprintImportRead>(response);
}

export async function processFootprintImport(
  importId: string,
  options: { ownerId?: string; feedXml?: string } = {},
): Promise<FootprintImportRead> {
  const response = await fetch(
    orchestratorUrl(`/v1/graph/imports/${encodeURIComponent(importId)}/process`),
    {
      method: "POST",
      cache: "no-store",
      headers: {
        ...ownerHeaders(options.ownerId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ feed_xml: options.feedXml }),
    },
  );

  return readJson<FootprintImportRead>(response);
}

export async function createAndProcessRssImport(
  payload: {
    platform?: string;
    handle: string;
    feedUrl: string;
    displayName?: string;
    ownerId?: string;
  },
): Promise<FootprintImportRead> {
  const account = await createFootprintAccount(
    {
      platform: payload.platform || "substack",
      handle: payload.handle,
      display_name: payload.displayName,
      profile_url: payload.feedUrl.replace(/\/feed\/?$/, ""),
      auth_mode: "rss",
    },
    payload.ownerId,
  );
  const footprintImport = await createFootprintImport(
    {
      connector: payload.platform || "substack",
      import_mode: "rss",
      account_id: account.id,
      source_ref: { feed_url: payload.feedUrl },
    },
    {
      ownerId: payload.ownerId,
      idempotencyKey: `rss:${payload.feedUrl}`,
    },
  );

  return processFootprintImport(footprintImport.id, { ownerId: payload.ownerId });
}
