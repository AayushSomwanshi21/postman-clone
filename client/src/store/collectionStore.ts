import { create } from 'zustand';
import api from '@/lib/api';
import type { Collection, PaginatedResponse, SavedRequest } from '@/lib/types';
import { useDocumentStore } from './documentStore';

interface CollectionState {
  collections: Collection[];
  requestsByCollection: Record<string, SavedRequest[]>;
  requestsHasMoreByCollection: Record<string, boolean>;
  expandedIds: Set<string>;
  activeRequestId: string | null;
  creating: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  limit: number;
  loadingRequestIds: Set<string>;
  loadingMoreRequestIds: Set<string>;

  fetchCollections: (workspaceId: string) => Promise<void>;
  fetchMoreCollections: (workspaceId: string) => Promise<void>;
  createCollection: (workspaceId: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  updateCollection: (id: string, name: string) => Promise<void>;
  toggleExpand: (id: string) => Promise<void>;
  fetchMoreRequests: (collectionId: string) => Promise<void>;
  addRequest: (collectionId: string, request: SavedRequest) => void;
  updateRequest: (collectionId: string, request: SavedRequest) => void;
  removeRequest: (collectionId: string, requestId: string) => void;
  setActiveRequestId: (id: string) => void;
  setCreating: (val: boolean) => void;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  requestsByCollection: {},
  requestsHasMoreByCollection: {},
  expandedIds: new Set(),
  activeRequestId: null,
  creating: false,
  loading: true,
  loadingMore: false,
  hasMore: false,
  limit: 20,
  loadingRequestIds: new Set<string>(),
  loadingMoreRequestIds: new Set<string>(),

  fetchCollections: async (workspaceId) => {
    set({ loading: true });
    const { data } = await api.get<PaginatedResponse<Collection>>('/collections', {
      params: { workspace_id: workspaceId, offset: 0, limit: get().limit },
    });
    set({
      collections: data.items,
      requestsByCollection: {},
      requestsHasMoreByCollection: {},
      expandedIds: new Set(),
      loading: false,
      loadingMore: false,
      hasMore: data.has_more,
    });
  },

  fetchMoreCollections: async (workspaceId) => {
    const { loading, loadingMore, hasMore, collections, limit } = get();
    if (loading || loadingMore || !hasMore) {
      return;
    }

    set({ loadingMore: true });
    try {
      const { data } = await api.get<PaginatedResponse<Collection>>('/collections', {
        params: { workspace_id: workspaceId, offset: collections.length, limit },
      });
      set((state) => ({
        collections: [...state.collections, ...data.items],
        loadingMore: false,
        hasMore: data.has_more,
      }));
    } catch (error) {
      set({ loadingMore: false });
      throw error;
    }
  },

  createCollection: async (workspaceId, name) => {
    const { data } = await api.post<Collection>('/collections', { workspace_id: workspaceId, name });
    set((s) => ({ collections: [...s.collections, data] }));
  },

  deleteCollection: async (id) => {
    await api.delete(`/collections/${id}`);
    set((s) => ({ collections: s.collections.filter((c) => c.id !== id) }));
    useDocumentStore.getState().removeDocumentByCollection(id);
  },

  updateCollection: async (id, name) => {
    const { data } = await api.put<Collection>(`/collections/${id}`, { name });
    set((s) => ({ collections: s.collections.map((c) => c.id === id ? data : c) }));
    useDocumentStore.getState().markCollectionDocumentStale(id);
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
      try {
        const { data } = await api.get<PaginatedResponse<SavedRequest>>(`/collections/${id}/requests`, {
          params: { offset: 0, limit: get().limit },
        });
        set((s) => {
          const loadingRequestIds = new Set(s.loadingRequestIds);
          loadingRequestIds.delete(id);
          return {
            requestsByCollection: { ...s.requestsByCollection, [id]: data.items },
            requestsHasMoreByCollection: { ...s.requestsHasMoreByCollection, [id]: data.has_more },
            loadingRequestIds,
          };
        });
      } catch (error) {
        set((s) => {
          const loadingRequestIds = new Set(s.loadingRequestIds);
          loadingRequestIds.delete(id);
          return { loadingRequestIds };
        });
        throw error;
      }
    }
  },

  fetchMoreRequests: async (collectionId) => {
    const { loadingRequestIds, loadingMoreRequestIds, requestsByCollection, requestsHasMoreByCollection, limit } = get();
    if (
      loadingRequestIds.has(collectionId) ||
      loadingMoreRequestIds.has(collectionId) ||
      !requestsHasMoreByCollection[collectionId]
    ) {
      return;
    }

    set((s) => ({ loadingMoreRequestIds: new Set(s.loadingMoreRequestIds).add(collectionId) }));
    try {
      const { data } = await api.get<PaginatedResponse<SavedRequest>>(`/collections/${collectionId}/requests`, {
        params: { offset: (requestsByCollection[collectionId] ?? []).length, limit },
      });
      set((s) => {
        const nextLoadingMore = new Set(s.loadingMoreRequestIds);
        nextLoadingMore.delete(collectionId);
        return {
          requestsByCollection: {
            ...s.requestsByCollection,
            [collectionId]: [...(s.requestsByCollection[collectionId] ?? []), ...data.items],
          },
          requestsHasMoreByCollection: {
            ...s.requestsHasMoreByCollection,
            [collectionId]: data.has_more,
          },
          loadingMoreRequestIds: nextLoadingMore,
        };
      });
    } catch (error) {
      set((s) => {
        const nextLoadingMore = new Set(s.loadingMoreRequestIds);
        nextLoadingMore.delete(collectionId);
        return { loadingMoreRequestIds: nextLoadingMore };
      });
      throw error;
    }
  },

  updateRequest: (collectionId, request) => set((s) => ({
    requestsByCollection: {
      ...s.requestsByCollection,
      [collectionId]: (s.requestsByCollection[collectionId] ?? []).map((r) => r.id === request.id ? request : r),
    },
  })),
  removeRequest: (collectionId, requestId) => set((s) => ({
    requestsByCollection: {
      ...s.requestsByCollection,
      [collectionId]: (s.requestsByCollection[collectionId] ?? []).filter((r) => r.id !== requestId),
    },
  })),
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
