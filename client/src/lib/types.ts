export interface Response {
  status_code: number;
  headers: Record<string, string>;
  body: string;
  elapsed_ms: number;
}

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface Collection {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SavedRequest {
  id: string;
  collection_id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: { type: string; content: string };
  auth: Record<string, string>;
  description: string;
  position: number;
  created_at: string;
  updated_at: string;
}
