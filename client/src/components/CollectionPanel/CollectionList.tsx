import { useRef, useState, useEffect } from 'react';
import { ChevronRight, MoreHorizontal, Pencil, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useCollectionStore } from '@/store/collectionStore';
import { useDocumentStore } from '@/store/documentStore';
import { useRequestStore } from '@/store/requestStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import RequestItem from './RequestItem';
import { PM } from '@/lib/constants';
import { ActionDialog } from '@/components/ui/action-dialog';
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger';
import { toast } from 'sonner';
import type { Collection } from '@/lib/types';
import { searchCollections } from '@/lib/collectionService';

function RequestListEnd({
  hasMore,
  loading,
  onReachEnd,
}: {
  hasMore: boolean;
  loading: boolean;
  onReachEnd: () => void | Promise<void>;
}) {
  return (
    <div style={{ paddingLeft: 20 }}>
      <InfiniteScrollTrigger
        hasMore={hasMore}
        loading={loading}
        onReachEnd={onReachEnd}
      />
    </div>
  );
}

export default function CollectionList() {
  const {
    collections,
    expandedIds,
    requestsByCollection,
    requestsHasMoreByCollection,
    toggleExpand,
    fetchMoreCollections,
    fetchMoreRequests,
    createCollection,
    updateCollection,
    deleteCollection,
    creating,
    setCreating,
    loading,
    loadingMore,
    hasMore,
    loadingRequestIds,
    loadingMoreRequestIds,
  } =
    useCollectionStore();
  const documents = useDocumentStore((s) => s.documents);
  const { createRequest } = useRequestStore();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [dialogCollectionId, setDialogCollectionId] = useState<string | null>(null);
  const [renameCollectionId, setRenameCollectionId] = useState<string | null>(null);
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Collection[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renameCollection = collections.find((c) => c.id === renameCollectionId);
  const staleCollectionIds = new Set(
    documents
      .filter((document) => document.is_stale)
      .map((document) => document.collection_id)
  );

  // --- debounced search effect ---
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
        const results = await searchCollections(activeWorkspace.id, q);
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

  function handleSearchResultClick(collectionId: string) {
    // if not expanded, expand it and clear search so user sees it in the list
    if (!expandedIds.has(collectionId)) {
      toggleExpand(collectionId);
    }
    setSearchTerm('');
  }

  async function handleCreate() {
    const name = inputRef.current?.value.trim();
    if (!name || !activeWorkspace) return;
    try {
      await createCollection(activeWorkspace.id, name);
      toast.success('Collection created', { style: { color: '#4ade80' } });
    } catch {
      toast.error('Failed to create collection');
    }
    setCreating(false);
  }

  const isSearching = searchTerm.trim().length > 0;

  return (
    <>
      <div style={{ padding: '4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: PM.bgInput,
            border: `1px solid ${PM.border}`,
            borderRadius: 4,
            padding: '4px 8px',
          }}
        >
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setSearchTerm(''); }}
            placeholder="Search Collections"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: PM.text,
              width: '100%',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = PM.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = PM.border)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 6px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Collections
        </span>
        <button
          onClick={() => creating ? handleCreate() : setCreating(true)}
          style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = PM.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
        >
          <Plus size={16} />
        </button>
      </div>

      {creating && (
        <div style={{ padding: '0 4px 6px' }}>
          <input
            ref={inputRef}
            autoFocus
            placeholder="Collection name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setCreating(false);
            }}
            style={{
              width: '100%', fontSize: 12, background: PM.bgInput,
              border: `1px solid ${PM.accent}`, borderRadius: 4,
              padding: '4px 6px', color: PM.text, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {!isSearching && loading && <div style={{ padding: '6px 4px' }}><Spinner /></div>}

      {!isSearching && !loading && collections.length === 0 && !creating && (
        <div style={{ fontSize: 12, color: '#4a4a4a', padding: '6px 4px', lineHeight: 1.5 }}>
          No collections yet.<br />Create one to get started.
        </div>
      )}

      {isSearching && (
        <>
          {searchLoading && <div style={{ padding: '6px 4px' }}><Spinner /></div>}

          {!searchLoading && searchResults.length === 0 && (
            <div style={{ fontSize: 12, color: '#4a4a4a', padding: '6px 4px' }}>
              No collections match "{searchTerm}".
            </div>
          )}

          {!searchLoading && searchResults.map((col) => (
            <div
              key={col.id}
              onClick={() => handleSearchResultClick(col.id)}
              onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 4px', cursor: 'pointer', borderRadius: 4, fontSize: 13, color: PM.text }}
            >
              <ChevronRight size={13} color={PM.muted} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {col.name}
              </span>
              {staleCollectionIds.has(col.id) && (
                <span title="Unsynced changes">
                  <RefreshCw size={12} color="#ff6c37" />
                </span>
              )}
            </div>
          ))}
        </>
      )}

      <ActionDialog
        open={dialogCollectionId !== null}
        onOpenChange={(open) => { if (!open) setDialogCollectionId(null); }}
        mode="create"
        title="New Request"
        description="Enter a name for the request."
        placeholder="Request name"
        onConfirm={async (name) => {
          try {
            await createRequest(dialogCollectionId!, name || 'New Request');
            toast.success('Request created', { style: { color: '#4ade80' } });
          } catch {
            toast.error('Failed to create request');
          }
        }}
      />

      <ActionDialog
        open={deleteCollectionId !== null}
        onOpenChange={(open) => { if (!open) setDeleteCollectionId(null); }}
        mode="delete"
        title="Delete Collection"
        description="Are you sure? This will permanently delete the collection and all its requests."
        onConfirm={async () => {
          try {
            await deleteCollection(deleteCollectionId!);
            toast.success('Collection deleted', { style: { color: '#4ade80' } });
          } catch {
            toast.error('Failed to delete collection');
          }
        }}
      />

      <ActionDialog
        open={renameCollectionId !== null}
        onOpenChange={(open) => { if (!open) setRenameCollectionId(null); }}
        mode="create"
        title="Rename Collection"
        description="Enter a new name for the collection."
        placeholder="Collection name"
        initialValue={renameCollection?.name}
        onConfirm={async (name) => {
          if (!name) return;
          try {
            await updateCollection(renameCollectionId!, name);
            toast.success('Collection renamed', { style: { color: '#4ade80' } });
          } catch {
            toast.error('Failed to rename collection');
          }
        }}
      />

      {!isSearching && collections.map((col) => (
        <div key={col.id}>
          <div
            onMouseEnter={() => setHoveredId(col.id)}
            onMouseLeave={() => { setHoveredId(null); setMenuOpenId(null); }}
            style={{ position: 'relative' }}
          >
            <div
              onClick={() => toggleExpand(col.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 4px', cursor: 'pointer', borderRadius: 4, fontSize: 13, color: PM.text, userSelect: 'none', background: hoveredId === col.id ? PM.bgHover : 'transparent' }}
            >
              <ChevronRight
                size={13}
                color={PM.muted}
                style={{
                  flexShrink: 0,
                  transform: expandedIds.has(col.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', flex: 1 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{col.name}</span>
                {staleCollectionIds.has(col.id) && (
                  <span title="This collection has unsynced changes. Regenerate the document to update.">
                    <RefreshCw size={12} color="#ff6c37" />
                  </span>
                )}
              </span>
              {hoveredId === col.id && (
                <MoreHorizontal
                  size={13}
                  color={PM.muted}
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === col.id ? null : col.id); }}
                  style={{ flexShrink: 0, cursor: 'pointer' }}
                />
              )}
            </div>

            {menuOpenId === col.id && (
              <div
                style={{
                  position: 'absolute', right: 4, top: '100%', zIndex: 100,
                  background: PM.bgPanel, border: `1px solid ${PM.border}`,
                  borderRadius: 6, padding: 4, minWidth: 130,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setDialogCollectionId(col.id); }}
                  className="menu-item"
                  onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Plus size={13} />
                  Add Request
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setRenameCollectionId(col.id); }}
                  className="menu-item"
                  onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Pencil size={13} />
                  Rename
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setDeleteCollectionId(col.id); }}
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

          {expandedIds.has(col.id) && (
            loadingRequestIds.has(col.id)
              ? <div style={{ padding: '4px 4px 4px 22px' }}><Spinner /></div>
              : (
                <>
                  {(requestsByCollection[col.id] ?? []).length === 0 && (
                    <div style={{ padding: '4px 4px 4px 24px', fontSize: 12, color: '#666666' }}>No requests yet.</div>
                  )}
                  {(requestsByCollection[col.id] ?? []).map((req) => (
                    <RequestItem key={req.id} request={req} />
                  ))}
                  <RequestListEnd
                    hasMore={requestsHasMoreByCollection[col.id] ?? false}
                    loading={loadingMoreRequestIds.has(col.id)}
                    onReachEnd={() => fetchMoreRequests(col.id)}
                  />
                </>
              )
          )}
        </div>
      ))}

      {!isSearching && activeWorkspace && (
        <InfiniteScrollTrigger
          hasMore={hasMore}
          loading={loadingMore}
          onReachEnd={() => fetchMoreCollections(activeWorkspace.id)}
        />
      )}
    </>
  );
}
