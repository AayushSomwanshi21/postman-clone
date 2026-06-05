import { useRequestStore } from '@/store/requestStore';
import { PM } from '@/lib/constants';

export default function HeadersViewer() {
  const response = useRequestStore((s) => s.response);
  if (!response) return null;

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12, padding: '8px 16px', overflowY: 'auto', maxHeight: 300 }}>
      {Object.entries(response.headers).map(([key, value]) => (
        <div key={key} style={{
          display: 'flex', gap: 16, padding: '3px 0',
          borderBottom: `1px solid ${PM.bgHover}`
        }}>
          <span style={{ color: PM.muted, minWidth: 200, flexShrink: 0 }}>{key}</span>
          <span style={{ color: PM.text, wordBreak: 'break-all' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}
