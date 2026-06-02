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
  loadingMore: boolean;
  loadingDocumentId: string | null;
  regeneratingDocumentId: string | null;
  error: string | null;
  hasMore: boolean;
  limit: number;

  fetchDocuments: (workspaceId: string) => Promise<void>;
  fetchMoreDocuments: (workspaceId: string) => Promise<void>;
  fetchDocumentById: (documentId: string) => Promise<Document>;
  generateDocument: (collectionId: string, name?: string) => Promise<Document>;
  updateDocument: (documentId: string, payload: Partial<Pick<Document, 'name' | 'content' | 'is_stale'>>) => Promise<Document>;
  deleteDocument: (documentId: string) => Promise<void>;
  markCollectionDocumentStale: (collectionId: string) => void;
  removeDocumentByCollection: (collectionId: string) => void;
}

export const useDocumentStore = create<DocumentStoreState>((set, get) => ({
  documents: [],
  documentsById: {},
  selectedDocumentId: null,
  loading: false,
  loadingMore: false,
  loadingDocumentId: null,
  regeneratingDocumentId: null,
  error: null,
  hasMore: false,
  limit: 20,

  fetchDocuments: async (workspaceId) => {
    set({ loading: true, error: null });
    try {
      const page = await listDocuments(workspaceId, 0, get().limit);
      const documents = page.items;
      set((state) => ({
        documents,
        documentsById: {},
        selectedDocumentId: documents.some((document) => document.id === state.selectedDocumentId)
          ? state.selectedDocumentId
          : null,
        loading: false,
        loadingMore: false,
        hasMore: page.has_more,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch documents';
      set({ loading: false, loadingMore: false, error: message });
      throw error;
    }
  },

  fetchMoreDocuments: async (workspaceId) => {
    const { loading, loadingMore, hasMore, documents, limit } = get();
    if (loading || loadingMore || !hasMore) {
      return;
    }

    set({ loadingMore: true, error: null });
    try {
      const page = await listDocuments(workspaceId, documents.length, limit);
      set((state) => ({
        documents: [...state.documents, ...page.items],
        loadingMore: false,
        hasMore: page.has_more,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch more documents';
      set({ loadingMore: false, error: message });
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
    const existingDocument = get().documents.find((document) => document.collection_id === collectionId) ?? null;
    set({ error: null, regeneratingDocumentId: existingDocument?.id ?? null });
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
          regeneratingDocumentId: null,
        };
      });
      return document;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate document';
      set({ error: message, regeneratingDocumentId: null });
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

  markCollectionDocumentStale: (collectionId) => {
    set((state) => {
      const documentListItem = state.documents.find((document) => document.collection_id === collectionId);
      if (!documentListItem || documentListItem.is_stale) {
        return state;
      }

      const cachedDocument = Object.values(state.documentsById).find((document) => document.collection_id === collectionId);

      return {
        documents: state.documents.map((document) =>
          document.collection_id === collectionId ? { ...document, is_stale: true } : document
        ),
        documentsById: cachedDocument
          ? {
            ...state.documentsById,
            [cachedDocument.id]: { ...cachedDocument, is_stale: true },
          }
          : state.documentsById,
      };
    });
  },

  removeDocumentByCollection: (collectionId) => {
    set((state) => {
      const cachedDocument = Object.values(state.documentsById).find((document) => document.collection_id === collectionId);
      if (!state.documents.some((document) => document.collection_id === collectionId) && !cachedDocument) {
        return state;
      }

      const documentsById = { ...state.documentsById };
      if (cachedDocument) {
        delete documentsById[cachedDocument.id];
      }

      return {
        documents: state.documents.filter((document) => document.collection_id !== collectionId),
        documentsById,
        selectedDocumentId: cachedDocument && state.selectedDocumentId === cachedDocument.id
          ? null
          : state.selectedDocumentId,
      };
    });
  },
}));
