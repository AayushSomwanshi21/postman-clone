import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRequestStore } from '@/store/requestStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import MethodSelector from './MethodSelector';

export default function UrlBar() {
  const { method, url, setUrl, headers, params, body, setResponse, setLoading, loading } = useRequestStore();
  const token = useAuthStore((s) => s.token);

  async function sendRequest() {
    if (!url) return;
    setLoading(true);
    setResponse(null);
    try {
      const enabledHeaders = Object.fromEntries(headers.filter((h) => h.enabled && h.key).map((h) => [h.key, h.value]));
      const enabledParams = Object.fromEntries(params.filter((p) => p.enabled && p.key).map((p) => [p.key, p.value]));
      let parsedBody = null;
      if (body && method !== 'GET') {
        try { parsedBody = JSON.parse(body); } catch { parsedBody = body; }
      }
      const { data } = await api.post('/proxy', {
        method,
        url,
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
    <div className="flex gap-2">
      <MethodSelector />
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://api.example.com/endpoint"
        className="flex-1 font-mono text-sm"
        onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
      />
      <Button onClick={sendRequest} disabled={loading || !token}>
        {loading ? 'Sending...' : 'Send'}
      </Button>
    </div>
  );
}
