import { create } from 'zustand';
import api from '@/lib/api';
import type { SavedRequest, Response, KeyValueRow } from '@/lib/types';
import { useCollectionStore } from '@/store/collectionStore';
import { useDocumentStore } from '@/store/documentStore';
import { useTabStore } from '@/store/tabStore';

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export interface AuthData {
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  value?: string;
  in?: 'header' | 'query';
}

interface RequestState {
  name: string | null;
  method: string;
  url: string;
  params: KeyValueRow[];
  pathVars: KeyValueRow[];
  headers: KeyValueRow[];
  body: string;
  authType: AuthType;
  authData: AuthData;
  response: Response | null;
  loading: boolean;
  setMethod: (method: string) => void;
  setUrl: (url: string) => void;
  setParams: (params: KeyValueRow[]) => void;
  setPathVars: (pathVars: KeyValueRow[]) => void;
  setHeaders: (headers: KeyValueRow[]) => void;
  setBody: (body: string) => void;
  setAuthType: (type: AuthType) => void;
  setAuthData: (data: Partial<AuthData>) => void;
  setResponse: (response: Response | null) => void;
  setLoading: (loading: boolean) => void;
  loadRequest: (request: SavedRequest) => void;
  createRequest: (collectionId: string, name: string) => Promise<void>;
  updateRequest: (collectionId: string, requestId: string) => Promise<void>;
  deleteRequest: (collectionId: string, requestId: string) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set) => ({
  name: null,
  method: 'GET',
  url: '',
  params: [{ key: '', value: '', enabled: true }],
  pathVars: [],
  headers: [{ key: '', value: '', enabled: true }],
  body: '',
  authType: 'none',
  authData: {},
  response: null,
  loading: false,
  setMethod: (method) => { set({ method }); useTabStore.getState().updateActiveTab({ method }); },
  setUrl: (url) => {
    const pathVarKeys = [...url.matchAll(/(?<=\/):(\w+)|(?<!\{)\{(\w+)\}(?!\})/g)].map((m) => m[1] ?? m[2]);
    set((s) => {
      const existing = Object.fromEntries(s.pathVars.filter((r) => r.key).map((r) => [r.key, r.value]));
      const pathVars = pathVarKeys.map((key) => ({ key, value: existing[key] ?? '', enabled: true }));
      return { url, pathVars };
    });
  },
  setParams: (params) => set({ params }),
  setPathVars: (pathVars) => set({ pathVars }),
  setHeaders: (headers) => set({ headers }),
  setBody: (body) => set({ body }),
  setAuthType: (authType) => set({ authType }),
  setAuthData: (data) => set((s) => ({ authData: { ...s.authData, ...data } })),
  setResponse: (response) => {
    set({ response });
    const { activeTabId } = useTabStore.getState();
    useTabStore.getState().saveTabResponse(activeTabId, response);
  },
  setLoading: (loading) => set({ loading }),
  loadRequest: (request) => {
    useCollectionStore.getState().setActiveRequestId(request.id);
    useTabStore.getState().updateActiveTab({ name: request.name, method: request.method });
    const savedResponse = useTabStore.getState().tabs.find((t) => t.id === request.id)?.response ?? null;
    const auth = request.auth ?? {};
    set({
      name: request.name,
      method: request.method,
      url: request.url,
      body: request.body?.content ?? '',
      authType: (auth.type as AuthType) ?? 'none',
      authData: {
        token: auth.token,
        username: auth.username,
        password: auth.password,
        key: auth.key,
        value: auth.value,
        in: auth.in as 'header' | 'query' | undefined,
      },
      response: savedResponse,
      headers: [
        ...Object.entries(request.headers ?? {}).map(([key, value]) => ({ key, value, enabled: true })),
        { key: '', value: '', enabled: true },
      ],
      params: [
        ...Object.entries(request.params ?? {}).map(([key, value]) => ({ key, value, enabled: true })),
        { key: '', value: '', enabled: true },
      ],
      pathVars: Object.entries(request.path_vars ?? {}).map(([key, value]) => ({ key, value, enabled: true })),
    });
  },
  createRequest: async (collectionId, name) => {
    const payload = { name, method: 'GET', url: '', headers: {}, params: {}, body: {}, auth: {}, description: '', position: 0 };

    const { data } = await api.post<SavedRequest>(`/collections/${collectionId}/requests`, payload);
    useCollectionStore.getState().addRequest(collectionId, data);
    useDocumentStore.getState().markCollectionDocumentStale(collectionId);
    useTabStore.getState().openTab({ id: data.id, name: data.name, method: data.method });
    useRequestStore.getState().loadRequest(data);
  },
  updateRequest: async (collectionId, requestId) => {
    const { method, url, params, pathVars, headers, body, authType, authData } = useRequestStore.getState();
    const toRecord = (rows: KeyValueRow[]) =>
      Object.fromEntries(rows.filter((r) => r.enabled && r.key).map((r) => [r.key, r.value]));

    const payload = {
      method, url,
      params: toRecord(params),
      path_vars: toRecord(pathVars),
      headers: toRecord(headers),
      body: { content: body },
      auth: authType === 'none' ? {} : { type: authType, ...authData },
    };
    const { data } = await api.put<SavedRequest>(`/collections/${collectionId}/requests/${requestId}`, payload);
    useCollectionStore.getState().updateRequest(collectionId, data);
    useDocumentStore.getState().markCollectionDocumentStale(collectionId);
  },
  deleteRequest: async (collectionId, requestId) => {
    await api.delete(`/collections/${collectionId}/requests/${requestId}`);
    useCollectionStore.getState().removeRequest(collectionId, requestId);
    useDocumentStore.getState().markCollectionDocumentStale(collectionId);
    useTabStore.getState().closeTab(requestId);
  },
}));
