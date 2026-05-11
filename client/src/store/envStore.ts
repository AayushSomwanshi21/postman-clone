import { create } from 'zustand';
import api from '@/lib/api';
import type { Environment, EnvVariable } from '@/lib/types';

interface EnvState {
    environments: Environment[];
    activeEnvironmentId: string | null;
    variables: EnvVariable[];
    loading: boolean;

    fetchEnvironments: (workspaceId: string) => Promise<void>;
    createEnvironment: (workspaceId: string, name: string) => Promise<void>;
    updateEnvironment: (id: string, name: string) => Promise<void>;
    deleteEnvironment: (id: string) => Promise<void>;
    activateEnvironment: (id: string) => Promise<void>;

    fetchVariables: (envId: string) => Promise<void>;
    createVariable: (envId: string, key: string, value: string) => Promise<void>;
    updateVariable: (envId: string, varId: string, payload: Partial<Pick<EnvVariable, 'key' | 'value' | 'is_secret'>>) => Promise<void>;
    deleteVariable: (envId: string, varId: string) => Promise<void>;

    getActiveVariablesMap: () => Record<string, string>;
}

export const useEnvStore = create<EnvState>((set, get) => ({
    environments: [],
    activeEnvironmentId: null,
    variables: [],
    loading: false,

    fetchEnvironments: async (workspaceId) => {
        set({ loading: true });
        const { data } = await api.get<Environment[]>('/environments', { params: { workspace_id: workspaceId } });
        const active = data.find((e) => e.is_active) ?? null;
        set({ environments: data, activeEnvironmentId: active?.id ?? null, loading: false });
        if (active) await get().fetchVariables(active.id);
    },

    createEnvironment: async (workspaceId, name) => {
        const { data } = await api.post<Environment>('/environments', { workspace_id: workspaceId, name });
        set((s) => ({ environments: [...s.environments, data] }));
    },

    updateEnvironment: async (id, name) => {
        const { data } = await api.put<Environment>(`/environments/${id}`, { name });
        set((s) => ({
            environments: s.environments.map((e) => (e.id === id ? data : e)),
        }));
    },

    deleteEnvironment: async (id) => {
        await api.delete(`/environments/${id}`);
        set((s) => ({
            environments: s.environments.filter((e) => e.id !== id),
            activeEnvironmentId: s.activeEnvironmentId === id ? null : s.activeEnvironmentId,
            variables: s.activeEnvironmentId === id ? [] : s.variables,
        }));
    },

    activateEnvironment: async (id) => {
        const { data } = await api.post<Environment>(`/environments/${id}/activate`);
        set((s) => ({
            environments: s.environments.map((e) =>
                e.id === id ? data : { ...e, is_active: false }
            ),
            activeEnvironmentId: id,
        }));
        await get().fetchVariables(id);
    },

    fetchVariables: async (envId) => {
        const { data } = await api.get<EnvVariable[]>(`/environments/${envId}/variables`);
        set({ variables: data });
    },

    createVariable: async (envId, key, value) => {
        const { data } = await api.post<EnvVariable>(`/environments/${envId}/variables`, { key, value });
        set((s) => ({ variables: [...s.variables, data] }));
    },

    updateVariable: async (envId, varId, payload) => {
        const { data } = await api.put<EnvVariable>(`/environments/${envId}/variables/${varId}`, payload);
        set((s) => ({
            variables: s.variables.map((v) => (v.id === varId ? data : v)),
        }));
    },

    deleteVariable: async (envId, varId) => {
        await api.delete(`/environments/${envId}/variables/${varId}`);
        set((s) => ({ variables: s.variables.filter((v) => v.id !== varId) }));
    },

    getActiveVariablesMap: () => {
        return Object.fromEntries(get().variables.map((v) => [v.key, v.value]));
    },
}));
