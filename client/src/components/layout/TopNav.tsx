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
import { ChevronDown, LogOut, Plus } from 'lucide-react';
import { ActionDialog } from '@/components/ui/action-dialog';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TopNav() {
  const logout = useAuthStore((s) => s.logout);
  const { createWorkspace, setActiveWorkspace, workspaces, activeWorkspace } = useWorkspaceStore();
  const { environments, activateEnvironment, deactivateAll } = useEnvStore();
  const activeEnv = environments.find((e) => e.is_active);
  const [dialogWorkspaceId, setDialogWorkspaceId] = useState<string | null>(null);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 40,
      background: PM.bgTopBar, borderBottom: `1px solid ${PM.border}`,
      padding: '4px 12px', gap: 12, flexShrink: 0
    }}>

      <ActionDialog
        open={dialogWorkspaceId !== null}
        onOpenChange={(open) => { if (!open) setDialogWorkspaceId(null); }}
        mode="create"
        title="New Workspace"
        description="Enter a name for the workspace."
        placeholder="Workspace name"
        onConfirm={async (name) => {
          try {
            await createWorkspace(name || 'New Workspace');
            toast.success('Workspace created', { style: { color: '#4ade80' } });
          } catch {
            toast.error('Failed to create workspace');
          }
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>

        <span style={{ fontSize: 13, fontWeight: 500 }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                border: `2px solid ${PM.border}`, borderRadius: 4,
                padding: '3px 8px', fontSize: 12, color: PM.muted, cursor: 'pointer',
                userSelect: 'none',
              }}>
                {activeWorkspace && (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: PM.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 10, fontWeight: 800
                  }}>{activeWorkspace.name.charAt(0).toUpperCase()}</div>
                )}
                {activeWorkspace?.name ?? 'No workspace'}
                <span><ChevronDown size={12} /></span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent style={{ minWidth: 160 }}>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => setActiveWorkspace(workspace)}
                  style={{ fontSize: 10 }}
                >
                  {workspace.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem>
                <button className="flex items-center gap-2 italic texts-xs" onClick={(e) => { e.stopPropagation(); setDialogWorkspaceId('new'); }}>
                  <Plus size={8} /> Add Workspace
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: `2px solid ${PM.border}`, borderRadius: 4,
              padding: '3px 8px', fontSize: 12, color: PM.muted, cursor: 'pointer',
              userSelect: 'none',
            }}>
              {activeEnv && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
                  display: 'inline-block', flexShrink: 0,
                  boxShadow: '0 0 4px 1px #22c55e99',
                }} />
              )}
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
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: PM.muted, background: 'none', border: `2px solid ${PM.border}`,
            cursor: 'pointer', padding: '3px 8px', borderRadius: 4
          }}>
          <LogOut size={16} color='red' />
          Sign out
        </button>
      </div>
    </div>
  );
}
