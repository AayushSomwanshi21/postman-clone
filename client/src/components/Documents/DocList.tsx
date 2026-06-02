import { useRef, useState, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2, Plus, RefreshCw } from 'lucide-react';
import { ActionDialog } from '@/components/ui/action-dialog';
import GenerateDocumentDialog from '@/components/Documents/GenerateDocumentDialog';
import { Spinner } from '@/components/ui/spinner';
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger';
import { useDocumentStore } from '@/store/documentStore';
import { PM } from '@/lib/constants';
import { toast } from 'sonner';
import type { DocumentListItem } from '@/lib/types';
import { searchDocuments } from '@/lib/documentService';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function DocList() {
    const {
        documents,
        selectedDocumentId,
        loading,
        loadingMore,
        hasMore,
        fetchDocumentById,
        fetchMoreDocuments,
        generateDocument,
        regeneratingDocumentId,
        updateDocument,
        deleteDocument,
    } = useDocumentStore();
    const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);
    const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
    const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<DocumentListItem[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const renameDocument = documents.find((d) => d.id === renameDocumentId) ?? null;
    const isSearching = searchTerm.trim().length > 0;

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const q = searchTerm.trim();

        if (!q) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);

        debounceRef.current = setTimeout(async () => {
            if (!activeWorkspace) return;
            try {
                const results = await searchDocuments(activeWorkspace.id, q);
                setSearchResults(results);
            } catch {
                toast.error('Search failed');
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 250);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchTerm, activeWorkspace]);

    async function handleSelect(document: DocumentListItem) {
        try {
            await fetchDocumentById(document.id);
        } catch {
            toast.error('Failed to load document');
        }
    }

    async function handleSearchResultClick(document: DocumentListItem) {
        await handleSelect(document);
        setSearchTerm('');
    }

    async function handleRegenerate(document: DocumentListItem) {
        if (regeneratingDocumentId === document.id) return;
        try {
            await generateDocument(document.collection_id, document.name);
            toast.success('Document regenerated', { style: { color: '#4ade80' } });
            setMenuOpenId(null);
        } catch {
            toast.error('Failed to regenerate document');
        }
    }

    // reusable row renderer — used in both search and normal mode
    function renderDocumentRow(document: DocumentListItem) {
        return (
            <div
                key={document.id}
                onMouseEnter={() => setHoveredId(document.id)}
                onMouseLeave={() => { setHoveredId(null); setMenuOpenId(null); }}
                style={{ position: 'relative' }}
            >
                <div
                    onClick={() => handleSelect(document)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 4px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        fontSize: 13,
                        color: PM.text,
                        userSelect: 'none',
                        background: selectedDocumentId === document.id || hoveredId === document.id ? PM.bgHover : 'transparent',
                    }}
                >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {document.name}
                    </span>
                    {hoveredId === document.id && (
                        <MoreHorizontal
                            size={13}
                            color={PM.muted}
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === document.id ? null : document.id);
                            }}
                            style={{ flexShrink: 0, cursor: 'pointer' }}
                        />
                    )}
                </div>

                {menuOpenId === document.id && (
                    <div style={{
                        position: 'absolute', right: 4, top: '100%', zIndex: 100,
                        background: PM.bgPanel, border: `1px solid ${PM.border}`,
                        borderRadius: 6, padding: 4, minWidth: 130,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); void handleRegenerate(document); }}
                            className="menu-item"
                            disabled={regeneratingDocumentId === document.id}
                            onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <RefreshCw size={13} />
                            {regeneratingDocumentId === document.id ? 'Regenerating...' : 'Regenerate'}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setRenameDocumentId(document.id); }}
                            className="menu-item"
                            onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <Pencil size={13} />
                            Rename
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setDeleteDocumentId(document.id); }}
                            className="menu-item"
                            style={{ color: '#e74c3c' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <Trash2 size={13} />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            {/* Search input */}
            <div style={{ padding: '4px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: PM.bgInput, border: `1px solid ${PM.border}`,
                    borderRadius: 4, padding: '4px 8px',
                }}>
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setSearchTerm(''); }}
                        placeholder="Search Documents"
                        style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            fontSize: 13, color: PM.text, width: '100%',
                        }}
                    />
                </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 6px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Documents
                </span>
                <button
                    onClick={() => setGenerateDialogOpen(true)}
                    style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = PM.text)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Dialogs */}
            <GenerateDocumentDialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen} />

            <ActionDialog
                open={renameDocumentId !== null}
                onOpenChange={(open) => { if (!open) setRenameDocumentId(null); }}
                mode="create"
                title="Rename Document"
                description="Enter a new name for the document."
                placeholder="Document name"
                initialValue={renameDocument?.name}
                onConfirm={async (name) => {
                    if (!name) return;
                    try {
                        await updateDocument(renameDocumentId!, { name });
                        toast.success('Document renamed', { style: { color: '#4ade80' } });
                    } catch {
                        toast.error('Failed to rename document');
                    }
                }}
            />

            <ActionDialog
                open={deleteDocumentId !== null}
                onOpenChange={(open) => { if (!open) setDeleteDocumentId(null); }}
                mode="delete"
                title="Delete Document"
                description="Are you sure? This will permanently delete the document."
                onConfirm={async () => {
                    try {
                        await deleteDocument(deleteDocumentId!);
                        toast.success('Document deleted', { style: { color: '#4ade80' } });
                    } catch {
                        toast.error('Failed to delete document');
                    }
                }}
            />

            {/* ── SEARCH MODE ── */}
            {isSearching && (
                <>
                    {searchLoading && <div style={{ padding: '6px 4px' }}><Spinner /></div>}

                    {!searchLoading && searchResults.length === 0 && (
                        <div style={{ fontSize: 12, color: '#4a4a4a', padding: '6px 4px' }}>
                            No documents match "{searchTerm}".
                        </div>
                    )}

                    {!searchLoading && searchResults.map((document) => (
                        <div
                            key={document.id}
                            onClick={() => handleSearchResultClick(document)}
                            onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '5px 4px', cursor: 'pointer', borderRadius: 4,
                                fontSize: 13, color: PM.text,
                            }}
                        >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {document.name}
                            </span>
                        </div>
                    ))}
                </>
            )}

            {/* ── NORMAL MODE ── */}
            {!isSearching && loading && <div style={{ padding: '6px 4px' }}><Spinner /></div>}

            {!isSearching && !loading && documents.length === 0 && (
                <div style={{ fontSize: 12, color: '#4a4a4a', padding: '6px 4px', lineHeight: 1.5 }}>
                    No documents yet.<br />Generate one to get started.
                </div>
            )}

            {!isSearching && documents.map((document) => renderDocumentRow(document))}

            {!isSearching && activeWorkspace && (
                <InfiniteScrollTrigger
                    hasMore={hasMore}
                    loading={loadingMore}
                    onReachEnd={() => fetchMoreDocuments(activeWorkspace.id)}
                />
            )}
        </>
    );
}
