import { useState } from 'react';
import { Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { useCollectionStore } from '@/store/collectionStore';
import { useRequestStore } from '@/store/requestStore';
import { useTabStore } from '@/store/tabStore';
import type { SavedRequest } from '@/lib/types';
import { PM, METHOD_HEX } from '@/lib/constants';

interface Props {
  request: SavedRequest;
}

export default function RequestItem({ request }: Props) {
  const loadRequest = useRequestStore((s) => s.loadRequest);
  const deleteRequest = useRequestStore((s) => s.deleteRequest);
  const openTab = useTabStore((s) => s.openTab);
  const activeRequestId = useCollectionStore((s) => s.activeRequestId);
  const isActive = activeRequestId === request.id;

  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleClick() {
    openTab({ id: request.id, name: request.name, method: request.method });
    loadRequest(request);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await deleteRequest(request.collection_id, request.id);
      toast.success('Request deleted', { style: { color: '#4ade80' } });
    } catch {
      toast.error('Failed to delete request');
    } finally {
      setDeleting(false);
      setAlertOpen(false);
    }
  }

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setMenuOpen(false); }}
        style={{ position: 'relative' }}
      >
        <div
          onClick={handleClick}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 4px 4px 24px', cursor: 'pointer', borderRadius: 4,
            background: isActive || hovered ? PM.bgHover : 'transparent',
            fontSize: 12, userSelect: 'none',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, minWidth: 36, color: METHOD_HEX[request.method] ?? PM.muted }}>
            {request.method}
          </span>
          <span style={{ color: PM.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {request.name}
          </span>
          {hovered && (
            <MoreHorizontal
              size={13}
              color={PM.muted}
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              style={{ flexShrink: 0 }}
            />
          )}
        </div>

        {menuOpen && (
          <div
            style={{
              position: 'absolute', right: 4, top: '100%', zIndex: 100,
              background: PM.bgPanel, border: `1px solid ${PM.border}`,
              borderRadius: 6, padding: 4, minWidth: 80,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setAlertOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '6px 10px', border: 'none',
                background: 'transparent', color: '#e74c3c',
                fontSize: 12, cursor: 'pointer', borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        )}
      </div>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent size="sm" className="bg-[#1c1b1b] border-[#3a3a3a]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} style={{ borderRadius: 6 }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={deleting}
              style={{ background: '#e74c3c', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6 }}
            >
              {deleting && <Spinner style={{ width: 14, height: 14 }} />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
