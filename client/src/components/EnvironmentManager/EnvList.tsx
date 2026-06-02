import { useRef, useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { useEnvStore } from '@/store/envStore';
import { ActionDialog } from '@/components/ui/action-dialog';
import { Spinner } from '@/components/ui/spinner';
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger';
import { PM } from '@/lib/constants';
import { toast } from 'sonner';
import { searchEnvironments } from '@/lib/environmentService';
import type { Environment } from '@/lib/types';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  workspaceId: string;
}

export default function EnvList({ selectedId, onSelect, workspaceId }: Props) {
  const {
    environments,
    loading,
    loadingMore,
    hasMore,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    activateEnvironment,
    fetchVariables,
    fetchMoreEnvironments,
  } = useEnvStore();

  const [creating, setCreating] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Environment[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renameEnv = environments.find((e) => e.id === renameId);
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
      try {
        const results = await searchEnvironments(workspaceId, q);
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
  }, [searchTerm, workspaceId]);

  async function handleSearchResultClick(envId: string) {
    await handleSelect(envId);
    setSearchTerm('');
  }

  async function handleCreate() {
    const name = inputRef.current?.value.trim();
    if (!name) return;
    try {
      await createEnvironment(workspaceId, name);
      toast.success('Environment created', { style: { color: '#4ade80' } });
    } catch {
      toast.error('Failed to create environment');
    }
    setCreating(false);
  }

  async function handleSelect(id: string) {
    onSelect(id);
    await fetchVariables(id);
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
            placeholder="Search environments"
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
          Environments
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
            placeholder="Environment name"
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

      {/* Dialogs */}
      <ActionDialog
        open={renameId !== null}
        onOpenChange={(open) => { if (!open) setRenameId(null); }}
        mode="create"
        title="Rename Environment"
        placeholder="Environment name"
        initialValue={renameEnv?.name}
        onConfirm={async (name) => {
          if (!name) return;
          try {
            await updateEnvironment(renameId!, name);
            toast.success('Environment renamed', { style: { color: '#4ade80' } });
          } catch {
            toast.error('Failed to rename environment');
          }
        }}
      />

      <ActionDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        mode="delete"
        title="Delete Environment"
        description="Are you sure? This will permanently delete the environment and all its variables."
        onConfirm={async () => {
          try {
            await deleteEnvironment(deleteId!);
            toast.success('Environment deleted', { style: { color: '#4ade80' } });
          } catch {
            toast.error('Failed to delete environment');
          }
        }}
      />

      {/* ── SEARCH MODE ── */}
      {isSearching && (
        <>
          {searchLoading && <div style={{ padding: '6px 4px' }}><Spinner /></div>}

          {!searchLoading && searchResults.length === 0 && (
            <div style={{ fontSize: 12, color: '#4a4a4a', padding: '6px 4px' }}>
              No environments match "{searchTerm}".
            </div>
          )}

          {!searchLoading && searchResults.map((env) => (
            <div
              key={env.id}
              onClick={() => handleSearchResultClick(env.id)}
              onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 4px', cursor: 'pointer', borderRadius: 4,
                fontSize: 13, color: PM.text,
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: env.is_active ? '#4ade80' : 'transparent',
                border: env.is_active ? 'none' : '1px solid #555',
              }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {env.name}
              </span>
            </div>
          ))}
        </>
      )}

      {/* ── NORMAL MODE ── */}
      {!isSearching && loading && environments.length === 0 && (
        <div style={{ padding: '6px 4px' }}><Spinner /></div>
      )}

      {!isSearching && !loading && environments.length === 0 && !creating && (
        <div style={{ fontSize: 12, color: '#4a4a4a', padding: '6px 4px', lineHeight: 1.5 }}>
          No environments yet.<br />Create one to get started.
        </div>
      )}

      {!isSearching && environments.map((env) => (
        <div
          key={env.id}
          onMouseEnter={() => setHoveredId(env.id)}
          onMouseLeave={() => { setHoveredId(null); setMenuOpenId(null); }}
          style={{ position: 'relative' }}
        >
          <div
            onClick={() => handleSelect(env.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 4px', cursor: 'pointer', borderRadius: 4,
              fontSize: 13, color: PM.text, userSelect: 'none',
              background: selectedId === env.id || hoveredId === env.id ? PM.bgHover : 'transparent',
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: env.is_active ? '#4ade80' : 'transparent',
              border: env.is_active ? 'none' : '1px solid #555',
            }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{env.name}</span>
            {hoveredId === env.id && (
              <MoreHorizontal
                size={13}
                color={PM.muted}
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === env.id ? null : env.id); }}
                style={{ flexShrink: 0, cursor: 'pointer' }}
              />
            )}
          </div>

          {menuOpenId === env.id && (
            <div style={{
              position: 'absolute', right: 4, top: '100%', zIndex: 100,
              background: PM.bgPanel, border: `1px solid ${PM.border}`,
              borderRadius: 6, padding: 4, minWidth: 140,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}>
              {!env.is_active && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                    try {
                      await activateEnvironment(env.id);
                      onSelect(env.id);
                      toast.success('Environment activated', { style: { color: '#4ade80' } });
                    } catch {
                      toast.error('Failed to activate environment');
                    }
                  }}
                  className="menu-item"
                  onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <CheckCircle size={13} />
                  Set Active
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setRenameId(env.id); }}
                className="menu-item"
                onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Pencil size={13} />
                Rename
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); setDeleteId(env.id); }}
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
      ))}

      {!isSearching && (
        <InfiniteScrollTrigger
          hasMore={hasMore}
          loading={loadingMore}
          onReachEnd={() => fetchMoreEnvironments(workspaceId)}
        />
      )}
    </>
  );
}
