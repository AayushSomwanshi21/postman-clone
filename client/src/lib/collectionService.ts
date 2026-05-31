import api from '@/lib/api';
import type { Collection } from '@/lib/types';

export async function searchCollections(
    workspaceId: string,
    query: string
) {
    const { data } = await api.get<Collection[]>(`/collections/search`, {
        params: {
            workspace_id: workspaceId,
            query: query,
        }
    });

    return data;

}
