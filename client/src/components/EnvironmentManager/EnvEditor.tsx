import { useEnvStore } from '@/store/envStore';
import { PM } from '@/lib/constants';
import EnvVariableTable from './EnvVariableTable';

interface Props {
  envId: string | null;
}

export default function EnvEditor({ envId }: Props) {
  const environments = useEnvStore((s) => s.environments);
  const env = environments.find((e) => e.id === envId) ?? null;

  if (!envId || !env) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PM.muted }}>
        Select an environment to view its variables
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${PM.border}`,
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: PM.text }}>{env.name}</span>
        {env.is_active && (
          <span style={{ fontSize: 11, color: '#4ade80' }}>● Active</span>
        )}
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <EnvVariableTable envId={envId} />
      </div>
    </div>
  );
}
