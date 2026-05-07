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
  const openTab = useTabStore((s) => s.openTab);
  const activeRequestId = useCollectionStore((s) => s.activeRequestId);
  const isActive = activeRequestId === request.id;

  function handleClick() {
    openTab({ id: request.id, name: request.name, method: request.method });
    loadRequest(request);
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 4px 4px 24px', cursor: 'pointer', borderRadius: 4,
        background: isActive ? PM.bgHover : 'transparent', fontSize: 12, userSelect: 'none',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = isActive ? PM.bgHover : 'transparent')}
    >
      <span style={{ fontSize: 10, fontWeight: 700, minWidth: 36, color: METHOD_HEX[request.method] ?? PM.muted }}>
        {request.method}
      </span>
      <span style={{ color: PM.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {request.name}
      </span>
    </div>
  );
}
