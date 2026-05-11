import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { PM } from '@/lib/constants';
import TopNav from '@/components/layout/TopNav';
import Sidebar from '@/components/layout/Sidebar';
import CollectionPanel from '@/components/layout/CollectionPanel';

export default function Home() {
  const { fetchWorkspaces } = useWorkspaceStore();

  useEffect(() => { fetchWorkspaces(); }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: PM.bgApp, color: PM.text, overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <TopNav />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <CollectionPanel />
      </div>
    </div>
  );
}
