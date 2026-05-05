import { useRequestStore } from '@/store/requestStore';

function statusColor(code: number) {
  if (code >= 200 && code < 300) return '#22c55e';
  if (code >= 300 && code < 400) return '#eab308';
  if (code >= 400) return '#ef4444';
  return '#6b7280';
}

export default function StatusBar() {
  const response = useRequestStore((s) => s.response);
  if (!response) return null;

  return (
    <div className="flex items-center text-sm">
      <span
        className="px-2 py-0.5 rounded text-white text-xs font-semibold"
        style={{ backgroundColor: statusColor(response.status_code) }}
      >
        {response.status_code}
      </span>
      <span className="text-muted-foreground" style={{ marginLeft: '3rem' }}>{response.elapsed_ms} ms</span>
    </div>
  );
}
