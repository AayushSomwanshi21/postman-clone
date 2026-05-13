import { useAuthStore } from '@/store/authStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useEnvStore } from '@/store/envStore';
import { PM } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export default function TopNav() {
  const logout = useAuthStore((s) => s.logout);
  const { activeWorkspace } = useWorkspaceStore();
  const { environments, activateEnvironment, deactivateAll } = useEnvStore();
  const activeEnv = environments.find((e) => e.is_active);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 40,
      background: PM.bgTopBar, borderBottom: `1px solid ${PM.border}`,
      padding: '0 12px', gap: 12, flexShrink: 0
    }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', background: PM.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 10, fontWeight: 800
        }}>P</div>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{activeWorkspace?.name ?? 'My Workspace'}</span>
        <span style={{ color: PM.muted, fontSize: 9 }}>▾</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              border: `2px solid ${PM.border}`, borderRadius: 4,
              padding: '3px 8px', fontSize: 12, color: PM.muted, cursor: 'pointer',
              userSelect: 'none',
            }}>
              {activeEnv?.name ?? 'No environment'}
              <span><ChevronDown size={12} /></span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ minWidth: 180 }}>
            <DropdownMenuItem
              onClick={deactivateAll}
              style={{ fontStyle: 'italic', fontSize: 10 }}
            >
              No environment
            </DropdownMenuItem>
            {environments.length > 0 && <DropdownMenuSeparator />}
            {environments.map((env) => (
              <DropdownMenuItem
                key={env.id}
                onClick={() => activateEnvironment(env.id)}
                style={{ fontSize: 10, fontWeight: env.is_active ? 600 : undefined }}
              >
                {env.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button onClick={logout}
          style={{
            fontSize: 12, color: PM.muted, background: 'none', border: 'none',
            cursor: 'pointer', padding: '3px 8px', borderRadius: 4
          }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
