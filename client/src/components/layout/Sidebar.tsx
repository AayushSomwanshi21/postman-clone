import { LayoutList, Files, Layers } from 'lucide-react';
import { PM } from '@/lib/constants';

export default function Sidebar() {
  return (
    <div style={{
      width: 48, background: PM.bgTopBar,
      borderRight: `1px solid ${PM.border}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 0', gap: 6, flexShrink: 0
    }}>
      {[
        { icon: <LayoutList size={18} />, title: 'Collections' },
        { icon: <Files size={18} />, title: 'Documents' },
        { icon: <Layers size={18} />, title: 'Environments' },
      ].map(({ icon, title }) => (
        <button key={title} title={title}
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'none', border: 'none',
            cursor: 'pointer', borderRadius: 4, color: PM.muted,
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
          {icon}
        </button>
      ))}
    </div>
  );
}
