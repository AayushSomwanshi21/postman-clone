import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import MethodSelector from './MethodSelector';
import { PM } from '@/lib/constants';

export default function UrlBar() {
  const { method, url, setUrl, headers, params, body, setResponse, setLoading, loading } = useRequestStore();
  const token = useAuthStore((s) => s.token);

  async function sendRequest() {
    if (!url) return;
    setLoading(true);
    setResponse(null);
    try {
      const enabledHeaders = Object.fromEntries(
        headers.filter((h) => h.enabled && h.key).map((h) => [h.key, h.value])
      );
      const enabledParams = Object.fromEntries(
        params.filter((p) => p.enabled && p.key).map((p) => [p.key, p.value])
      );
      let parsedBody = null;
      if (body && method !== 'GET') {
        try { parsedBody = JSON.parse(body); } catch { parsedBody = body; }
      }
      const { data } = await api.post('/proxy', {
        method, url,
        headers: enabledHeaders,
        params: enabledParams,
        body: parsedBody,
      });
      setResponse(data);
    } catch (err: any) {
      setResponse(err.response?.data ?? { status_code: 0, headers: {}, body: 'Request failed', elapsed_ms: 0 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden',
      border: `1px solid ${PM.border}`, background: PM.bgInput }}>
      <MethodSelector />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
        placeholder="Enter URL or paste text"
        style={{ flex: 1, background: PM.bgInput, border: 'none', outline: 'none',
          color: PM.text, fontSize: 13, fontFamily: 'monospace', padding: '0 12px' }}
      />
      <button
        onClick={sendRequest}
        disabled={loading || !token}
        style={{ padding: '0 20px', background: loading || !token ? '#2a3a5a' : PM.sendBtn,
          color: '#fff', border: 'none', cursor: loading || !token ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 600, flexShrink: 0, transition: 'background 0.15s',
          opacity: !token ? 0.6 : 1 }}
        onMouseEnter={(e) => { if (!loading && token) e.currentTarget.style.background = '#3574d4'; }}
        onMouseLeave={(e) => { if (!loading && token) e.currentTarget.style.background = PM.sendBtn; }}>
        {loading ? 'Sending…' : 'Send'}
      </button>
    </div>
  );
}
