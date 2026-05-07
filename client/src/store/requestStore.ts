import { create } from 'zustand';
import api from '@/lib/api';
import type { SavedRequest } from '@/lib/types';
import { useCollectionStore } from '@/store/collectionStore';
import { useTabStore } from '@/store/tabStore';

export interface KeyValueRow {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Response {
  status_code: number;
  headers: Record<string, string>;
  body: string;
  elapsed_ms: number;
}

interface RequestState {
  name: string | null;
  method: string;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  body: string;
  response: Response | null;
  loading: boolean;
  setMethod: (method: string) => void;
  setUrl: (url: string) => void;
  setParams: (params: KeyValueRow[]) => void;
  setHeaders: (headers: KeyValueRow[]) => void;
  setBody: (body: string) => void;
  setResponse: (response: Response | null) => void;
  setLoading: (loading: boolean) => void;
  loadRequest: (request: SavedRequest) => void;
  createRequest: (collectionId: string, name: string) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set) => ({
  name: null,
  method: 'GET',
  url: '',
  params: [{ key: '', value: '', enabled: true }],
  headers: [{ key: '', value: '', enabled: true }],
  body: '',
  response: null,
  loading: false,
  setMethod: (method) => { set({ method }); useTabStore.getState().updateActiveTab({ method }); },
  setUrl: (url) => set({ url }),
  setParams: (params) => set({ params }),
  setHeaders: (headers) => set({ headers }),
  setBody: (body) => set({ body }),
  setResponse: (response) => set({ response }),
  setLoading: (loading) => set({ loading }),
  loadRequest: (request) => {
    useCollectionStore.getState().setActiveRequestId(request.id);
    useTabStore.getState().updateActiveTab({ name: request.name, method: request.method });
    set({
      name: request.name,
      method: request.method,
      url: request.url,
      body: request.body?.content ?? '',
      headers: [
        ...Object.entries(request.headers ?? {}).map(([key, value]) => ({ key, value, enabled: true })),
        { key: '', value: '', enabled: true },
      ],
      params: [
        ...Object.entries(request.params ?? {}).map(([key, value]) => ({ key, value, enabled: true })),
        { key: '', value: '', enabled: true },
      ],
    });
  },
  createRequest: async (collectionId, name) => {
    const payload = { name, method: 'GET', url: '', headers: {}, params: {}, body: {}, auth: {}, description: '', position: 0 };

    const { data } = await api.post<SavedRequest>(`/collections/${collectionId}/requests`, payload);
    useCollectionStore.getState().addRequest(collectionId, data);
    useTabStore.getState().openTab({ id: data.id, name: data.name, method: data.method });
    useRequestStore.getState().loadRequest(data);
  },
}));
