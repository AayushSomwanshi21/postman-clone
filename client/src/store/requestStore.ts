import { create } from 'zustand';

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
}

export const useRequestStore = create<RequestState>((set) => ({
  method: 'GET',
  url: '',
  params: [{ key: '', value: '', enabled: true }],
  headers: [{ key: '', value: '', enabled: true }],
  body: '',
  response: null,
  loading: false,
  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setParams: (params) => set({ params }),
  setHeaders: (headers) => set({ headers }),
  setBody: (body) => set({ body }),
  setResponse: (response) => set({ response }),
  setLoading: (loading) => set({ loading }),
}));
