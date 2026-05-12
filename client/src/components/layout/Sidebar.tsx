import { NavLink } from 'react-router-dom';
import { PM, SIDEBAR_NAV } from '@/lib/constants';

export default function Sidebar() {
  return (
    <div style={{
      width: 48, background: PM.bgTopBar,
      borderRight: `1px solid ${PM.border}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 0', gap: 6, flexShrink: 0
    }}>
      {SIDEBAR_NAV.map(({ Icon, title, to }) => (
        <NavLink key={title} to={to} title={title} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 4,
              cursor: 'pointer', transition: 'background 0.15s',
              background: isActive ? PM.bgHover : 'none',
              color: isActive ? PM.text : PM.muted,
              borderLeft: isActive ? `2px solid ${PM.accent}` : '2px solid transparent',
            }}>
              <Icon size={18} />
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}
