import { create } from 'zustand';
import {
  deleteDocument as deleteDocumentRequest,
  generateDocs,
  getDocument,
  listDocuments,
  updateDocument as updateDocumentRequest,
} from '@/lib/documentService';
import type { Document, DocumentListItem } from '@/lib/types';

interface DocumentStoreState {
  documents: DocumentListItem[];
  documentsById: Record<string, Document>;
  selectedDocumentId: string | null;
  loading: boolean;
  loadingDocumentId: string | null;
  error: string | null;

  fetchDocuments: (workspaceId: string) => Promise<void>;
  fetchDocumentById: (documentId: string) => Promise<Document>;
  generateDocument: (collectionId: string, name?: string) => Promise<Document>;
  updateDocument: (documentId: string, payload: Partial<Pick<Document, 'name' | 'content' | 'is_stale'>>) => Promise<Document>;
  deleteDocument: (documentId: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentStoreState>((set, get) => ({
  documents: [],
  documentsById: {},
  selectedDocumentId: null,
  loading: false,
  loadingDocumentId: null,
  error: null,

  fetchDocuments: async (workspaceId) => {
    set({ loading: true, error: null });
    try {
      const documents = await listDocuments(workspaceId);
      set((state) => ({
        documents,
        documentsById: {},
        selectedDocumentId: documents.some((document) => document.id === state.selectedDocumentId)
          ? state.selectedDocumentId
          : null,
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch documents';
      set({ loading: false, error: message });
      throw error;
    }
  },

  fetchDocumentById: async (documentId) => {
    const cachedDocument = get().documentsById[documentId];
    if (cachedDocument) {
      set({ selectedDocumentId: documentId, error: null });
      return cachedDocument;
    }

    set({ loadingDocumentId: documentId, error: null });
    try {
      const document = await getDocument(documentId);
      set((state) => ({
        documentsById: { ...state.documentsById, [document.id]: document },
        selectedDocumentId: document.id,
        loadingDocumentId: null,
      }));
      return document;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch document';
      set({ loadingDocumentId: null, error: message });
      throw error;
    }
  },

  generateDocument: async (collectionId, name) => {
    set({ error: null });
    try {
      const document = await generateDocs(collectionId, { name });
      set((state) => {
        const nextListItem = {
          id: document.id,
          collection_id: document.collection_id,
          name: document.name,
          is_stale: document.is_stale,
          updated_at: document.updated_at,
        };
        const exists = state.documents.some((item) => item.id === document.id);
        return {
          documentsById: { ...state.documentsById, [document.id]: document },
          documents: exists
            ? state.documents.map((item) => item.id === document.id ? nextListItem : item)
            : [...state.documents, nextListItem],
        };
      });
      return document;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate document';
      set({ error: message });
      throw error;
    }
  },

  updateDocument: async (documentId, payload) => {
    set({ loadingDocumentId: documentId, error: null });
    try {
      const document = await updateDocumentRequest(documentId, payload);
      set((state) => ({
        documentsById: { ...state.documentsById, [document.id]: document },
        documents: state.documents.map((item) => item.id === document.id ? {
          id: document.id,
          collection_id: document.collection_id,
          name: document.name,
          is_stale: document.is_stale,
          updated_at: document.updated_at,
        } : item),
        loadingDocumentId: null,
      }));
      return document;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update document';
      set({ loadingDocumentId: null, error: message });
      throw error;
    }
  },

  deleteDocument: async (documentId) => {
    set({ loadingDocumentId: documentId, error: null });
    try {
      await deleteDocumentRequest(documentId);
      set((state) => {
        const documentsById = { ...state.documentsById };
        delete documentsById[documentId];
        return {
          documents: state.documents.filter((document) => document.id !== documentId),
          documentsById,
          selectedDocumentId: state.selectedDocumentId === documentId ? null : state.selectedDocumentId,
          loadingDocumentId: null,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete document';
      set({ loadingDocumentId: null, error: message });
      throw error;
    }
  },
}));
