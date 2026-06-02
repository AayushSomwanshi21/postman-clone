import api from '@/lib/api';
import type { Environment, PaginatedResponse } from '@/lib/types';

export async function searchEnvironments(
    workspaceId: string,
    query: string
) {
    const { data } = await api.get<PaginatedResponse<Environment>>(`/environments/search`, {
        params: {
            workspace_id: workspaceId,
            query: query,
        }
    });

    return data.items;
}
