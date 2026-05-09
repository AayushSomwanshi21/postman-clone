import { useRef, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useCollectionStore } from '@/store/collectionStore';
import { useRequestStore } from '@/store/requestStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import RequestItem from './RequestItem';
import { PM } from '@/lib/constants';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function CollectionList() {
  const { collections, expandedIds, requestsByCollection, toggleExpand, createCollection, creating, setCreating, loading, loadingRequestIds } =
    useCollectionStore();
  const { createRequest } = useRequestStore();
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dialogCollectionId, setDialogCollectionId] = useState<string | null>(null);
  const [requestName, setRequestName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!dialogCollectionId || saving) return;
    setSaving(true);
    try {
      await createRequest(dialogCollectionId, requestName.trim() || 'New Request');
      toast.success('Request created', { style: { color: '#4ade80' } });
    } catch {
      toast.error('Failed to create request');
    } finally {
      setSaving(false);
      setDialogCollectionId(null);
    }
  }

  async function handleCreate() {
    const name = inputRef.current?.value.trim();
    if (!name || !activeWorkspace) return;
    await createCollection(activeWorkspace.id, name);
    setCreating(false);
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 6px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Collections
        </span>
        <button
          onClick={() => setCreating(true)}
          style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = PM.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
        >
          +
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

      {loading && (
        <div style={{ padding: '6px 4px' }}>
          <Spinner />
        </div>
      )}

      {!loading && collections.length === 0 && !creating && (
        <div style={{ fontSize: 12, color: '#4a4a4a', padding: '6px 4px', lineHeight: 1.5 }}>
          No collections yet.<br />Create one to get started.
        </div>
      )}

      <AlertDialog open={dialogCollectionId !== null} onOpenChange={(open) => { if (!open) setDialogCollectionId(null); }}>
        <AlertDialogContent className="bg-[#1c1b1b] border-[#3a3a3a]">
          <AlertDialogHeader>
            <AlertDialogTitle>New Request</AlertDialogTitle>
            <AlertDialogDescription>Enter a name for the request.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            autoFocus
            placeholder="Request name"
            value={requestName}
            disabled={saving}
            onChange={(e) => setRequestName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} style={{ borderRadius: 6 }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleSave(); }}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, background: PM.accent }}
            >
              {saving && <Spinner style={{ width: 14, height: 14 }} />}
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {collections.map((col) => (
        <div key={col.id}>
          <div
            onClick={() => toggleExpand(col.id)}
            onMouseEnter={() => setHoveredId(col.id)}
            onMouseLeave={() => setHoveredId(null)}
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
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{col.name}</span>
            {hoveredId === col.id && (
              <Plus
                size={13}
                color={PM.muted}
                onClick={(e) => { e.stopPropagation(); setRequestName(''); setDialogCollectionId(col.id); }}
                style={{ flexShrink: 0, cursor: 'pointer' }}
              />
            )}
          </div>

          {expandedIds.has(col.id) && (
            loadingRequestIds.has(col.id)
              ? <div style={{ padding: '4px 4px 4px 22px' }}><Spinner /></div>
              : (requestsByCollection[col.id] ?? []).map((req) => (
                <RequestItem key={req.id} request={req} />
              ))
          )}
        </div>
      ))}
    </>
  );
}
