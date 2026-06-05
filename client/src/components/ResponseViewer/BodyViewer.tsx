import Editor from '@monaco-editor/react';
import { useRequestStore } from '@/store/requestStore';

function tryFormat(body: string) {
  try { return JSON.stringify(JSON.parse(body), null, 2); } catch { return body; }
}

export default function BodyViewer() {
  const response = useRequestStore((s) => s.response);
  if (!response) return <p className="text-muted-foreground text-sm p-4">Send a request to see the response.</p>;

  const value = tryFormat(response.body);
  const isJson = value !== response.body;

  return (
    <div className="border rounded-md overflow-hidden" style={{ height: '300px' }}>
      <Editor
        height="100%"
        language={isJson ? 'json' : 'plaintext'}
        value={value}
        theme="vs-dark"
        options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'off', scrollBeyondLastLine: true }}
      />
    </div>
  );
}
