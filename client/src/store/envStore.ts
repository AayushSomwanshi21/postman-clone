import { create } from 'zustand';
import api from '@/lib/api';
import type { Environment, EnvVariable, PaginatedResponse } from '@/lib/types';

interface EnvState {
    environments: Environment[];
    variablesByEnv: Record<string, EnvVariable[]>;
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    limit: number;

    fetchEnvironments: (workspaceId: string) => Promise<void>;
    fetchMoreEnvironments: (workspaceId: string) => Promise<void>;
    createEnvironment: (workspaceId: string, name: string) => Promise<void>;
    updateEnvironment: (id: string, name: string) => Promise<void>;
    deleteEnvironment: (id: string) => Promise<void>;
    activateEnvironment: (id: string) => void;
    deactivateAll: () => void;

    fetchVariables: (envId: string) => Promise<void>;
    createVariable: (envId: string, key: string, value: string) => Promise<void>;
    updateVariable: (envId: string, varId: string, payload: Partial<Pick<EnvVariable, 'key' | 'value' | 'is_secret'>>) => Promise<void>;
    deleteVariable: (envId: string, varId: string) => Promise<void>;

    getActiveVariablesMap: () => Record<string, string>;
}

export const useEnvStore = create<EnvState>((set, get) => ({
    environments: [],
    variablesByEnv: {},
    loading: false,
    loadingMore: false,
    hasMore: false,
    limit: 20,

    fetchEnvironments: async (workspaceId) => {
        set({ loading: true });
        const { data } = await api.get<PaginatedResponse<Environment>>('/environments', {
            params: { workspace_id: workspaceId, offset: 0, limit: get().limit },
        });
        const environments = data.items;
        set({ environments, loading: false, loadingMore: false, hasMore: data.has_more });
        const active = environments.find((e) => e.is_active);
        if (active) get().fetchVariables(active.id);
        environments.forEach((e) => { if (!e.is_active) get().fetchVariables(e.id); });
    },

    fetchMoreEnvironments: async (workspaceId) => {
        const { loading, loadingMore, hasMore, environments, limit } = get();
        if (loading || loadingMore || !hasMore) {
            return;
        }

        set({ loadingMore: true });
        try {
            const { data } = await api.get<PaginatedResponse<Environment>>('/environments', {
                params: { workspace_id: workspaceId, offset: environments.length, limit },
            });
            set((s) => ({
                environments: [...s.environments, ...data.items],
                loadingMore: false,
                hasMore: data.has_more,
            }));
            data.items.forEach((env) => { get().fetchVariables(env.id); });
        } catch (error) {
            set({ loadingMore: false });
            throw error;
        }
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
        set((s) => {
            const { [id]: _, ...rest } = s.variablesByEnv;
            return {
                environments: s.environments.filter((e) => e.id !== id),
                variablesByEnv: rest,
            };
        });
    },

    activateEnvironment: (id) => {
        set((s) => ({
            environments: s.environments.map((e) => ({ ...e, is_active: e.id === id })),
        }));
        get().fetchVariables(id);
        api.post(`/environments/${id}/activate`);
    },

    deactivateAll: () => {
        set((s) => ({
            environments: s.environments.map((e) => ({ ...e, is_active: false })),
        }));
    },

    fetchVariables: async (envId) => {
        if (get().variablesByEnv[envId]) return;
        const { data } = await api.get<PaginatedResponse<EnvVariable>>(`/environments/${envId}/variables`);
        set((s) => ({ variablesByEnv: { ...s.variablesByEnv, [envId]: data.items } }));
    },

    createVariable: async (envId, key, value) => {
        const { data } = await api.post<EnvVariable>(`/environments/${envId}/variables`, { key, value });
        set((s) => ({
            variablesByEnv: {
                ...s.variablesByEnv,
                [envId]: [...(s.variablesByEnv[envId] ?? []), data],
            },
        }));
    },

    updateVariable: async (envId, varId, payload) => {
        const { data } = await api.put<EnvVariable>(`/environments/${envId}/variables/${varId}`, payload);
        set((s) => ({
            variablesByEnv: {
                ...s.variablesByEnv,
                [envId]: (s.variablesByEnv[envId] ?? []).map((v) => (v.id === varId ? data : v)),
            },
        }));
    },

    deleteVariable: async (envId, varId) => {
        await api.delete(`/environments/${envId}/variables/${varId}`);
        set((s) => ({
            variablesByEnv: {
                ...s.variablesByEnv,
                [envId]: (s.variablesByEnv[envId] ?? []).filter((v) => v.id !== varId),
            },
        }));
    },

    getActiveVariablesMap: () => {
        const { environments, variablesByEnv } = get();
        const activeId = environments.find((e) => e.is_active)?.id;
        if (!activeId) return {};
        return Object.fromEntries((variablesByEnv[activeId] ?? []).map((v) => [v.key, v.value]));
    },
}));
