import { create } from 'zustand';
import api from '@/lib/api';
import type { Collection, SavedRequest } from '@/lib/types';

interface CollectionState {
  collections: Collection[];
  requestsByCollection: Record<string, SavedRequest[]>;
  expandedIds: Set<string>;
  activeRequestId: string | null;
  creating: boolean;
  loading: boolean;
  loadingRequestIds: Set<string>;

  fetchCollections: (workspaceId: string) => Promise<void>;
  createCollection: (workspaceId: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  toggleExpand: (id: string) => Promise<void>;
  addRequest: (collectionId: string, request: SavedRequest) => void;
  setActiveRequestId: (id: string) => void;
  setCreating: (val: boolean) => void;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  requestsByCollection: {},
  expandedIds: new Set(),
  activeRequestId: null,
  creating: false,
  loading: true,
  loadingRequestIds: new Set<string>(),

  fetchCollections: async (workspaceId) => {
    set({ loading: true });
    const { data } = await api.get<Collection[]>('/collections', {
      params: { workspace_id: workspaceId },
    });
    set({ collections: data, requestsByCollection: {}, expandedIds: new Set(), loading: false });
  },

  createCollection: async (workspaceId, name) => {
    const { data } = await api.post<Collection>('/collections', { workspace_id: workspaceId, name });
    set((s) => ({ collections: [...s.collections, data] }));
  },

  deleteCollection: async (id) => {
    await api.delete(`/collections/${id}`);
    set((s) => ({ collections: s.collections.filter((c) => c.id !== id) }));
  },

  toggleExpand: async (id) => {
    const { expandedIds, requestsByCollection } = get();
    const next = new Set(expandedIds);

    if (next.has(id)) {
      next.delete(id);
      set({ expandedIds: next });
      return;
    }

    next.add(id);
    if (requestsByCollection[id]) {
      set({ expandedIds: next });
    } else {
      set((s) => ({ expandedIds: next, loadingRequestIds: new Set(s.loadingRequestIds).add(id) }));
      const { data } = await api.get<SavedRequest[]>(`/collections/${id}/requests`);
      set((s) => {
        const loadingRequestIds = new Set(s.loadingRequestIds);
        loadingRequestIds.delete(id);
        return { requestsByCollection: { ...s.requestsByCollection, [id]: data }, loadingRequestIds };
      });
    }
  },

  addRequest: (collectionId, request) => set((s) => ({
    requestsByCollection: {
      ...s.requestsByCollection,
      [collectionId]: [...(s.requestsByCollection[collectionId] ?? []), request],
    },
    expandedIds: new Set(s.expandedIds).add(collectionId),
  })),
  setActiveRequestId: (id) => set({ activeRequestId: id }),
  setCreating: (val) => set({ creating: val }),
}));
