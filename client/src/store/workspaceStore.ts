import { create } from 'zustand';
import api from '@/lib/api';
import type { PaginatedResponse, Workspace } from '@/lib/types';
import { useCollectionStore } from './collectionStore';
import { useDocumentStore } from './documentStore';
import { useEnvStore } from './envStore';
import { useRequestStore } from './requestStore';
import { useTabStore } from './tabStore';

function resetWorkspaceScopedState() {
  useCollectionStore.setState({
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
  });
  useDocumentStore.setState({
    documents: [],
    documentsById: {},
    selectedDocumentId: null,
    loading: true,
    loadingMore: false,
    loadingDocumentId: null,
    regeneratingDocumentId: null,
    error: null,
    hasMore: false,
    limit: 20,
  });
  useEnvStore.setState({
    environments: [],
    variablesByEnv: {},
    loading: true,
    loadingMore: false,
    hasMore: false,
    limit: 20,
  });
  useRequestStore.setState({
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
  });

  const newTabId = crypto.randomUUID();
  useTabStore.setState({
    tabs: [{ id: newTabId, name: 'New Request', method: 'GET', response: null }],
    activeTabId: newTabId,
  });
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  setActiveWorkspace: (workspace: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspace: null,

  fetchWorkspaces: async () => {
    const { data } = await api.get<PaginatedResponse<Workspace>>('/workspaces');
    const workspaces = data.items;
    const savedId = localStorage.getItem('activeWorkspaceId');
    const active = workspaces.find((w) => w.id === savedId) ?? workspaces[0] ?? null;
    set({ workspaces, activeWorkspace: active });

    if (active) {
      resetWorkspaceScopedState();
      useDocumentStore.getState().fetchDocuments(active.id);
      useCollectionStore.getState().fetchCollections(active.id);
      useEnvStore.getState().fetchEnvironments(active.id);
    }
  },

  setActiveWorkspace: (workspace) => {
    localStorage.setItem('activeWorkspaceId', workspace.id);
    set({ activeWorkspace: workspace });

    resetWorkspaceScopedState();
    useDocumentStore.getState().fetchDocuments(workspace.id);
    useCollectionStore.getState().fetchCollections(workspace.id);
    useEnvStore.getState().fetchEnvironments(workspace.id);
  },

  createWorkspace: async (name) => {
    const { data } = await api.post<Workspace>('/workspaces', { name });
    set((state) => ({ workspaces: [...state.workspaces, data] }));
  },

}));
