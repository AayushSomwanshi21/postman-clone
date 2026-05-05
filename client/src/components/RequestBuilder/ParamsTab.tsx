import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRequestStore } from '@/store/requestStore';
import type { KeyValueRow } from '@/store/requestStore';

export default function ParamsTab() {
  const { params, setParams } = useRequestStore();

  function update(index: number, field: keyof KeyValueRow, value: string | boolean) {
    const updated = params.map((row, i) => i === index ? { ...row, [field]: value } : row);
    if (index === params.length - 1 && value !== '' && field !== 'enabled') {
      updated.push({ key: '', value: '', enabled: true });
    }
    setParams(updated);
  }

  function remove(index: number) {
    setParams(params.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2 p-2">
      {params.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input type="checkbox" checked={row.enabled} onChange={(e) => update(i, 'enabled', e.target.checked)} />
          <Input placeholder="Key" value={row.key} onChange={(e) => update(i, 'key', e.target.value)} className="flex-1 font-mono text-sm h-8" />
          <Input placeholder="Value" value={row.value} onChange={(e) => update(i, 'value', e.target.value)} className="flex-1 font-mono text-sm h-8" />
          {params.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => remove(i)} className="h-8 px-2 text-muted-foreground">✕</Button>
          )}
        </div>
      ))}
    </div>
  );
}
