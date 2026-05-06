import { useRequestStore } from '@/store/requestStore';
import { HTTP_METHODS, METHOD_HEX, PM } from '@/lib/constants';
import { ChevronDown } from 'lucide-react';

export default function MethodSelector() {
  const { method, setMethod } = useRequestStore();
  const color = METHOD_HEX[method] ?? '#888';

  return (
    <div className="relative flex items-center" style={{ borderRight: `1px solid ${PM.border}` }}>
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        style={{
          background: PM.bgInput, border: 'none',
          color, fontWeight: 700, fontSize: 12, padding: '0 28px 0 10px',
          cursor: 'pointer', outline: 'none', width: 90, height: 36,
          appearance: 'none', WebkitAppearance: 'none',
        }}>
        {HTTP_METHODS.map((m) => (
          <option key={m} value={m} style={{ color: METHOD_HEX[m], background: PM.bgInput }}>
            {m}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-1.5 pointer-events-none" style={{ color: PM.muted }} />
    </div>
  );
}
