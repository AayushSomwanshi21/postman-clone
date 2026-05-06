import { useRequestStore } from '@/store/requestStore';
import { PM } from '@/lib/constants';

function statusColor(code: number) {
  if (code >= 200 && code < 300) return '#49cc90';
  if (code >= 300 && code < 400) return '#fca130';
  if (code >= 400) return '#e74c3c';
  return '#888';
}

export default function StatusBar() {
  const response = useRequestStore((s) => s.response);
  if (!response) return null;

  const color = statusColor(response.status_code);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
      <span style={{ color, fontWeight: 700 }}>
        {response.status_code}
      </span>
      <span style={{ color: PM.muted }}>{response.elapsed_ms} ms</span>
    </div>
  );
}
