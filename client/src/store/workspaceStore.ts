import { create } from 'zustand';
import api from '@/lib/api';
import type { Workspace } from '@/lib/types';
import { useCollectionStore } from './collectionStore';
import { useEnvStore } from './envStore';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  fetchWorkspaces: () => Promise<void>;
  setActiveWorkspace: (workspace: Workspace) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspace: null,

  fetchWorkspaces: async () => {
    const { data } = await api.get<Workspace[]>('/workspaces');
    const savedId = localStorage.getItem('activeWorkspaceId');
    const active = data.find((w) => w.id === savedId) ?? data[0] ?? null;
    set({ workspaces: data, activeWorkspace: active });

    if (active) {
      useCollectionStore.getState().fetchCollections(active.id);
      useEnvStore.getState().fetchEnvironments(active.id);
    }
  },

  setActiveWorkspace: (workspace) => {
    localStorage.setItem('activeWorkspaceId', workspace.id);
    set({ activeWorkspace: workspace });

    useCollectionStore.getState().fetchCollections(workspace.id);
    useEnvStore.getState().fetchEnvironments(workspace.id);
  },
}));
