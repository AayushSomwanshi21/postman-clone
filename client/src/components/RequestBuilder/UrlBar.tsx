import { useRef } from 'react';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import { useEnvStore } from '@/store/envStore';
import { useShallow } from 'zustand/react/shallow';
import api from '@/lib/api';
import { interpolate, buildHighlightHtml } from '@/lib/interpolate';
import MethodSelector from './MethodSelector';
import { PM, URL_INPUT_TEXT_STYLE } from '@/lib/constants';

export default function UrlBar() {
  const { method, url, setUrl, headers, params, pathVars, body, setResponse, setLoading, loading } = useRequestStore();
  const token = useAuthStore((s) => s.token);
  const vars = useEnvStore(useShallow((s) => s.getActiveVariablesMap()));
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  function syncScroll() {
    if (mirrorRef.current && inputRef.current)
      mirrorRef.current.scrollLeft = inputRef.current.scrollLeft;
  }

  async function sendRequest() {
    if (!url) return;
    setLoading(true);
    setResponse(null);
    try {
      const withPathVars = pathVars.reduce(
        (u, { key, value }) => key ? u.replace(new RegExp(`/:${key}(?=/|$)|/\\{${key}\\}(?=/|$)`), `/${interpolate(value, vars)}`) : u,
        url
      );
      const resolvedUrl = interpolate(withPathVars, vars);
      const enabledHeaders = Object.fromEntries(
        headers.filter((h) => h.enabled && h.key).map((h) => [h.key, interpolate(h.value, vars)])
      );
      const enabledParams = Object.fromEntries(
        params.filter((p) => p.enabled && p.key).map((p) => [p.key, interpolate(p.value, vars)])
      );
      let parsedBody = null;
      if (body && method !== 'GET') {
        try { parsedBody = JSON.parse(body); } catch { parsedBody = body; }
      }
      const { data } = await api.post('/proxy', {
        method, url: resolvedUrl,
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
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!url && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', color: PM.muted, ...URL_INPUT_TEXT_STYLE }}>
            Enter URL or paste text
          </div>
        )}
        <div
          ref={mirrorRef}
          aria-hidden
          dangerouslySetInnerHTML={{ __html: buildHighlightHtml(url, vars) }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', overflow: 'hidden',
            color: PM.text, whiteSpace: 'pre', ...URL_INPUT_TEXT_STYLE }}
        />
        <input
          ref={inputRef}
          value={url}
          onChange={(e) => { setUrl(e.target.value); syncScroll(); }}
          onScroll={syncScroll}
          onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
          style={{ position: 'relative', width: '100%', height: '100%',
            background: 'transparent', border: 'none', outline: 'none',
            color: 'transparent', caretColor: PM.text, ...URL_INPUT_TEXT_STYLE }}
        />
      </div>
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
