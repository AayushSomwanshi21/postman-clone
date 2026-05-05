import Editor from '@monaco-editor/react';
import { useRequestStore } from '@/store/requestStore';

export default function BodyTab() {
  const { body, setBody } = useRequestStore();

  return (
    <div className="border rounded-md overflow-hidden" style={{ height: '200px' }}>
      <Editor
        height="100%"
        language="json"
        value={body}
        onChange={(val) => setBody(val ?? '')}
        theme="vs-dark"
        options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'off', scrollBeyondLastLine: false }}
      />
    </div>
  );
}
