import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useEnvStore } from '@/store/envStore';
import type { EnvVariable } from '@/lib/types';

const EMPTY_VARS: EnvVariable[] = [];

interface Props {
  envId: string;
}

export default function EnvVariableTable({ envId }: Props) {
  const variables = useEnvStore((s) => s.variablesByEnv[envId] ?? EMPTY_VARS);
  const { createVariable, updateVariable, deleteVariable } = useEnvStore();
  const [draftKey, setDraftKey] = useState('');
  const [draftValue, setDraftValue] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setDraftKey('');
    setDraftValue('');
  }, [envId]);

  async function commitDraft() {
    if (!draftKey.trim()) return;
    await createVariable(envId, draftKey.trim(), draftValue);
    setDraftKey('');
    setDraftValue('');
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteVariable(envId, id);
    setDeletingId(null);
  }

  function handleUpdate(varId: string, payload: Partial<Pick<EnvVariable, 'key' | 'value'>>) {
    updateVariable(envId, varId, payload);
  }

  return (
    <div className="border-b border-[#3a3a3a]">
      <div className="flex flex-row items-center border-b border-[#3a3a3a] bg-[#242424]">
        <div className="kv-col-header">Variable</div>
        <div className="kv-col-header-div">Value</div>
        <div className="w-8 shrink-0" />
      </div>

      {variables.map((v) => (
        <div
          key={v.id}
          className="flex flex-row items-center border-b border-[#2e2e2e]"
          onMouseEnter={() => setHoveredId(v.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{ opacity: deletingId === v.id ? 0.4 : 1, transition: 'opacity 0.15s' }}
        >
          <div className="flex-1 min-w-0">
            <input
              defaultValue={v.key}
              disabled={deletingId === v.id}
              onBlur={(e) => { if (e.target.value !== v.key) handleUpdate(v.id, { key: e.target.value }); }}
              placeholder="Variable"
              className="kv-cell-input disabled:cursor-not-allowed"
            />
          </div>
          <div className="kv-col-divider">
            <input
              defaultValue={v.value}
              disabled={deletingId === v.id}
              onBlur={(e) => { if (e.target.value !== v.value) handleUpdate(v.id, { value: e.target.value }); }}
              placeholder="Value"
              className="kv-cell-input disabled:cursor-not-allowed"
            />
          </div>
          <div className="w-8 shrink-0 flex items-center justify-center">
            {hoveredId === v.id && deletingId !== v.id && (
              <button
                onClick={() => handleDelete(v.id)}
                className="text-[#555] hover:text-[#e74c3c] bg-transparent border-none cursor-pointer flex items-center"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-row items-center border-b border-[#2e2e2e]">
        <div className="flex-1 min-w-0">
          <input
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitDraft(); }}
            placeholder="Add variable"
            className="kv-cell-input placeholder-[#3a3a3a]"
          />
        </div>
        <div className="kv-col-divider">
          <input
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => { if (e.key === 'Enter') commitDraft(); }}
            placeholder="Value"
            className="kv-cell-input placeholder-[#3a3a3a]"
          />
        </div>
        <div className="w-8 shrink-0" />
      </div>
    </div>
  );
}
