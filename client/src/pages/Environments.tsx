import { useState, useEffect } from 'react';
import { useEnvStore } from '@/store/envStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { PM } from '@/lib/constants';
import EnvList from '@/components/EnvironmentManager/EnvList';
import EnvEditor from '@/components/EnvironmentManager/EnvEditor';

export default function Environments() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const activeEnvironmentId = useEnvStore((s) => s.activeEnvironmentId);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);

  useEffect(() => {
    if (activeEnvironmentId && !selectedEnvId) setSelectedEnvId(activeEnvironmentId);
  }, [activeEnvironmentId]);

  if (!activeWorkspace) return null;

  return (
    <>
      <div style={{
        width: 230, background: PM.bgPanel,
        borderRight: `1px solid ${PM.border}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <EnvList
          selectedId={selectedEnvId}
          onSelect={setSelectedEnvId}
          workspaceId={activeWorkspace.id}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: PM.bgContent }}>
        <EnvEditor envId={selectedEnvId} />
      </div>
    </>
  );
}
