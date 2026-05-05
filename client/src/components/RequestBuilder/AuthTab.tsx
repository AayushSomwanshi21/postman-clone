import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRequestStore } from '@/store/requestStore';

export default function AuthTab() {
  const { headers, setHeaders } = useRequestStore();

  const authHeader = headers.find((h) => h.key.toLowerCase() === 'authorization');
  const token = authHeader?.value.replace('Bearer ', '') ?? '';

  function setToken(value: string) {
    const without = headers.filter((h) => h.key.toLowerCase() !== 'authorization');
    if (value) {
      setHeaders([{ key: 'Authorization', value: `Bearer ${value}`, enabled: true }, ...without]);
    } else {
      setHeaders(without.length ? without : [{ key: '', value: '', enabled: true }]);
    }
  }

  return (
    <div className="p-2 space-y-2 max-w-md">
      <Label className="text-muted-foreground text-xs">Bearer Token</Label>
      <Input
        placeholder="Paste your token here"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="font-mono text-sm"
      />
    </div>
  );
}
