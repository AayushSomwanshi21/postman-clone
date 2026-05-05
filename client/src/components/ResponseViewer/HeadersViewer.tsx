import { useRequestStore } from '@/store/requestStore';

export default function HeadersViewer() {
  const response = useRequestStore((s) => s.response);
  if (!response) return null;

  return (
    <div className="font-mono text-xs space-y-1 p-2">
      {Object.entries(response.headers).map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <span className="text-muted-foreground min-w-48">{key}</span>
          <span className="break-all">{value}</span>
        </div>
      ))}
    </div>
  );
}
