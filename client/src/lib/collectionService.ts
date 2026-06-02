import api from '@/lib/api';
import type { Collection, PaginatedResponse } from '@/lib/types';

export async function searchCollections(
    workspaceId: string,
    query: string
) {
    const { data } = await api.get<PaginatedResponse<Collection>>(`/collections/search`, {
        params: {
            workspace_id: workspaceId,
            query: query,
        }
    });

    return data.items;

}
