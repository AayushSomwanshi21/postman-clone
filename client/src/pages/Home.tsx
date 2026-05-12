import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { PM } from '@/lib/constants';
import TopNav from '@/components/layout/TopNav';
import Sidebar from '@/components/layout/Sidebar';
import CollectionPanel from '@/components/layout/CollectionPanel';
import Environments from '@/pages/Environments';
import Documents from '@/pages/Documents';

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
        <Routes>
          <Route path="/collections" element={<CollectionPanel />} />
          <Route path="/environments" element={<Environments />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="*" element={<Navigate to="/collections" replace />} />
        </Routes>
      </div>
    </div>
  );
}
