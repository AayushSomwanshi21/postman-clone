import api from '@/lib/api';
import type { Document, DocumentListItem, GenerateDocsRequest } from '@/lib/types';

export async function generateDocs(collectionId: string, payload?: GenerateDocsRequest) {
    const { data } = await api.post<Document>(`/documents/generate-docs/${collectionId}`, payload);
    return data;
}

export async function listDocuments(workspaceId: string) {
    const { data } = await api.get<DocumentListItem[]>('/documents', {
        params: { workspace_id: workspaceId },
    });
    return data;
}

export async function getDocument(documentId: string) {
    const { data } = await api.get<Document>(`/documents/${documentId}`);
    return data;
}

export async function updateDocument(documentId: string, payload: Partial<Pick<Document, 'name' | 'content' | 'is_stale'>>) {
    const { data } = await api.put<Document>(`/documents/${documentId}`, payload);
    return data;
}

export async function deleteDocument(documentId: string) {
    await api.delete(`/documents/${documentId}`);
}

export async function exportDocument(documentId: string) {
    const response = await api.post(`/documents/${documentId}/export`, null,
        { responseType: 'blob' }
    );

    const disposition = response.headers['content-disposition'];
    const filename = disposition?.match(/filename="(.+?)"/)?.[1] ?? 'api-docs.pdf';

    return {
        blob: response.data,
        filename
    };
}