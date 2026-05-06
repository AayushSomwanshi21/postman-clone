import type { KeyValueRow } from '@/store/requestStore';

interface Props {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
}

export default function KeyValueTable({ rows, onChange }: Props) {
  function update(index: number, field: keyof KeyValueRow, value: string | boolean) {
    const updated = rows.map((row, i) => i === index ? { ...row, [field]: value } : row);
    if (index === rows.length - 1 && value !== '' && field !== 'enabled') {
      updated.push({ key: '', value: '', enabled: true });
    }
    onChange(updated);
  }

  function remove(index: number) {
    if (rows.length > 1) onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="border-b border-[#3a3a3a]">
      {/* Header */}
      <div className="flex flex-row items-center border-b border-[#3a3a3a] bg-[#242424]">
        <div className="w-7 shrink-0" />
        <div className="kv-col-header">Key</div>
        <div className="kv-col-header-div">Value</div>
        <div className="kv-col-header-div">Description</div>
        <div className="w-8 shrink-0" />
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div key={i} className="flex flex-row items-center border-b border-[#2e2e2e]">
          <div className="w-7 shrink-0 flex items-center justify-center">
            <input type="checkbox" checked={row.enabled}
              onChange={(e) => update(i, 'enabled', e.target.checked)}
              className="cursor-pointer accent-[#4285f4]" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              value={row.key}
              onChange={(e) => update(i, 'key', e.target.value)}
              placeholder="Key"
              className="kv-cell-input"
            />
          </div>
          <div className="kv-col-divider">
            <input
              value={row.value}
              onChange={(e) => update(i, 'value', e.target.value)}
              placeholder="Value"
              className="kv-cell-input"
            />
          </div>
          <div className="kv-col-divider">
            <input
              placeholder="Description"
              className="w-full bg-transparent border-none outline-none px-2 py-1.5 text-sm font-mono text-[#4a4a4a] placeholder-[#4a4a4a]"
            />
          </div>
          <div className="w-8 shrink-0 flex items-center justify-center">
            {rows.length > 1 && (
              <button onClick={() => remove(i)}
                className="text-[#555] hover:text-[#e74c3c] text-sm bg-transparent border-none cursor-pointer leading-none">
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
