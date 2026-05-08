import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import UrlBar from '@/components/RequestBuilder/UrlBar';
import ParamsTab from '@/components/RequestBuilder/ParamsTab';
import HeadersTab from '@/components/RequestBuilder/HeadersTab';
import BodyTab from '@/components/RequestBuilder/BodyTab';
import AuthTab from '@/components/RequestBuilder/AuthTab';
import StatusBar from '@/components/ResponseViewer/StatusBar';
import BodyViewer from '@/components/ResponseViewer/BodyViewer';
import HeadersViewer from '@/components/ResponseViewer/HeadersViewer';
import { useAuthStore } from '@/store/authStore';
import { useRequestStore } from '@/store/requestStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useTabStore } from '@/store/tabStore';
import { useCollectionStore } from '@/store/collectionStore';
import CollectionList from '@/components/CollectionPanel/CollectionList';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PM, METHOD_HEX } from '@/lib/constants';

function methodColor(m: string) {
  return METHOD_HEX[m] ?? PM.muted;
}

type RequestTab = 'params' | 'headers' | 'body' | 'auth';
type ResponseTab = 'body' | 'headers';

export default function Home() {
  const logout = useAuthStore((s) => s.logout);
  const { response, headers, params } = useRequestStore();
  const { activeWorkspace, fetchWorkspaces } = useWorkspaceStore();
  const { tabs, activeTabId, closeTab, setActiveTab } = useTabStore();
  const { requestsByCollection, activeRequestId } = useCollectionStore();
  const [activeReqTab, setActiveReqTab] = useState<RequestTab>('params');
  const [activeResTab, setActiveResTab] = useState<ResponseTab>('body');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchWorkspaces(); }, []);

  const headerCount = headers.filter((h) => h.enabled && h.key).length;
  const paramCount = params.filter((p) => p.enabled && p.key).length;

  async function handleSave() {
    if (!activeRequestId || saving) return;
    const collectionId = Object.entries(requestsByCollection).find(([, reqs]) =>
      reqs.some((r) => r.id === activeRequestId)
    )?.[0];
    if (!collectionId) return;
    setSaving(true);
    try {
      await useRequestStore.getState().updateRequest(collectionId, activeRequestId);
      toast.success('Request updated successfully', { style: { color: '#4ade80' } });
    } catch {
      toast.error('Failed to save request');
    } finally {
      setSaving(false);
    }
  }

  function handleTabClick(tabId: string) {
    setActiveTab(tabId);
    const request = Object.values(requestsByCollection).flat().find((r) => r.id === tabId);
    if (request) {
      useRequestStore.getState().loadRequest(request);
    } else {
      useRequestStore.setState({
        name: null, method: 'GET', url: '', body: '', response: null,
        headers: [{ key: '', value: '', enabled: true }],
        params: [{ key: '', value: '', enabled: true }],
      });
    }
  }

  const reqTabs: { id: RequestTab; label: string; count?: number }[] = [
    { id: 'params', label: 'Params', count: paramCount },
    { id: 'auth', label: 'Authorization' },
    { id: 'headers', label: 'Headers', count: headerCount },
    { id: 'body', label: 'Body' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: PM.bgApp, color: PM.text, overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif'
    }}>

      {/* ── TOP NAV ─────────────────────────────────────────────── */}
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

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: PM.bgInput, border: `1px solid ${PM.border}`,
            borderRadius: 4, padding: '3px 10px', width: '100%', maxWidth: 380
          }}>
            <span style={{ color: PM.muted, fontSize: 13 }}>🔍</span>
            <span style={{ color: '#555', fontSize: 13 }}>Search</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            border: `1px solid ${PM.border}`, borderRadius: 4,
            padding: '3px 8px', fontSize: 12, color: PM.muted, cursor: 'pointer'
          }}>
            No environment <span style={{ fontSize: 9, marginLeft: 4 }}>▾</span>
          </div>
          <button onClick={logout}
            style={{
              fontSize: 12, color: PM.muted, background: 'none', border: 'none',
              cursor: 'pointer', padding: '3px 8px', borderRadius: 4
            }}>
            Sign out
          </button>
        </div>
      </div>

      {/* ── MAIN BODY ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── ICON SIDEBAR ──── */}
        <div style={{
          width: 48, background: PM.bgTopBar,
          borderRight: `1px solid ${PM.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '10px 0', gap: 6, flexShrink: 0
        }}>
          {[
            { icon: '≡', title: 'Collections' },
            { icon: '↺', title: 'History' },
          ].map(({ icon, title }) => (
            <button key={title} title={title}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'none', border: 'none',
                cursor: 'pointer', borderRadius: 4, color: PM.muted,
                fontSize: 16, transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
              {icon}
            </button>
          ))}
        </div>

        {/* ── COLLECTIONS PANEL ──── */}
        <div style={{
          width: 230, background: PM.bgPanel,
          borderRight: `1px solid ${PM.border}`,
          display: 'flex', flexDirection: 'column', flexShrink: 0
        }}>

          <div style={{ padding: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: PM.bgInput, border: `1px solid ${PM.border}`,
              borderRadius: 4, padding: '4px 8px'
            }}>
              <span style={{ color: '#555', fontSize: 12 }}>🔍</span>
              <input placeholder="Search" style={{
                background: 'transparent', border: 'none',
                outline: 'none', fontSize: 13, color: PM.muted, width: '100%'
              }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
            <CollectionList />
          </div>

          <div style={{ borderTop: `1px solid ${PM.border}` }}>
            {['ENVIRONMENTS', 'SPECS', 'FLOWS'].map((section) => (
              <div key={section}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', fontSize: 11, fontWeight: 600,
                  color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: 'pointer', transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = PM.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: 10 }}>›</span>{section}
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT ──── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', background: PM.bgContent
        }}>

          {/* ── TAB BAR ── */}
          <Tabs value={activeTabId} onValueChange={handleTabClick} style={{ flexShrink: 0 }}>
            <TabsList variant="line" style={{
              height: 36, borderRadius: 0, justifyContent: 'flex-start', alignItems: 'flex-end',
              background: PM.bgPanel, borderBottom: `1px solid ${PM.border}`, padding: '0 4px', gap: 2,
            }}>
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <TabsTrigger
                    key={tab.id} value={tab.id}
                    className="[&::after]:hidden!"
                    style={{
                      height: 32, gap: 8, paddingInline: 12,
                      borderRadius: '4px 4px 0 0',
                      border: `1px solid ${isActive ? PM.border : 'transparent'}`,
                      borderBottom: `1px solid ${isActive ? PM.bgContent : 'transparent'}`,
                      background: isActive ? PM.bgContent : 'transparent',
                      marginBottom: isActive ? -1 : 0,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: methodColor(tab.method) }}>{tab.method}</span>
                    <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tab.name}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                      style={{ color: '#555', fontSize: 15, lineHeight: 1, marginLeft: 2 }}
                    >×</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Breadcrumb + actions */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '6px 16px',
            borderBottom: `1px solid ${PM.border}`, flexShrink: 0
          }}>
            <span style={{ fontSize: 13, color: PM.muted }}>New Request</span>
            <div>
              <button
                onClick={handleSave}
                disabled={!activeRequestId || saving}
                style={{
                  fontSize: 13, color: PM.text, background: 'none',
                  border: `1px solid ${PM.border}`, borderRadius: 4,
                  padding: '3px 12px', cursor: (activeRequestId && !saving) ? 'pointer' : 'not-allowed',
                  opacity: (activeRequestId && !saving) ? 1 : 0.4, transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => { if (activeRequestId && !saving) e.currentTarget.style.background = PM.bgHover; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* URL Bar */}
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${PM.border}`, flexShrink: 0 }}>
            <UrlBar />
          </div>

          {/* Request tabs header */}
          <div style={{
            borderBottom: `1px solid ${PM.border}`, flexShrink: 0,
            display: 'flex', alignItems: 'center', padding: '0 16px'
          }}>
            {reqTabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveReqTab(tab.id)}
                style={{
                  padding: '8px 12px', background: 'none', border: 'none',
                  borderBottom: activeReqTab === tab.id ? `2px solid ${PM.accent}` : '2px solid transparent',
                  color: activeReqTab === tab.id ? PM.text : PM.muted,
                  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: 5, fontWeight: activeReqTab === tab.id ? 600 : 400,
                  transition: 'color 0.15s'
                }}>
                {tab.label}
                {!!tab.count && (
                  <span style={{
                    background: '#333', borderRadius: 10, fontSize: 10,
                    padding: '1px 5px', color: '#aaa'
                  }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content — scrolls independently */}
          <div style={{ overflowY: 'auto', maxHeight: '40%', flexShrink: 0 }}>
            {activeReqTab === 'params' && <ParamsTab />}
            {activeReqTab === 'headers' && <HeadersTab />}
            {activeReqTab === 'body' && <BodyTab />}
            {activeReqTab === 'auth' && <AuthTab />}
          </div>

          {/* Spacer — fills empty space, collapses when response has data */}
          <div style={{ flexGrow: response ? 0 : 1 }} />

          {/* Response section */}
          <div style={{ flexGrow: response ? 1 : 0, flexShrink: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: `1px solid ${PM.border}` }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '8px 16px',
              borderBottom: `1px solid ${PM.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: PM.text }}>Response</span>
                <StatusBar />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button style={{
                  fontSize: 12, color: PM.muted, background: 'none',
                  border: 'none', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 4
                }}>
                  ↺ History <span style={{ fontSize: 9 }}>▾</span>
                </button>
                <button style={{
                  color: '#555', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 16, lineHeight: 1
                }}>⋯</button>
              </div>
            </div>

            {!response ? (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '48px 16px', gap: 18, color: '#505050'
              }}>
                {[
                  { icon: '↺', text: 'Send + Get a successful response' },
                  { icon: '⊞', text: 'Send + Visualize response' },
                  { icon: '✓', text: 'Send + Write tests' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{
                    display: 'flex', alignItems: 'center',
                    gap: 10, fontSize: 13
                  }}>
                    <span>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  display: 'flex', padding: '0 16px',
                  borderBottom: `1px solid ${PM.border}`
                }}>
                  {(['body', 'headers'] as ResponseTab[]).map((tab) => (
                    <button key={tab} onClick={() => setActiveResTab(tab)}
                      style={{
                        padding: '6px 12px', background: 'none', border: 'none',
                        borderBottom: activeResTab === tab ? `2px solid ${PM.accent}` : '2px solid transparent',
                        color: activeResTab === tab ? PM.text : PM.muted,
                        fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                        fontWeight: activeResTab === tab ? 600 : 400
                      }}>
                      {tab}
                    </button>
                  ))}
                </div>
                {activeResTab === 'body' ? <BodyViewer /> : <HeadersViewer />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
