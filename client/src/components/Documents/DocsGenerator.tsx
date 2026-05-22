import Editor from '@monaco-editor/react';
import { PM } from '@/lib/constants';
import type { Document } from '@/lib/types';

interface DocsGeneratorProps {
  document: Document;
}

export default function DocsGenerator({ document }: DocsGeneratorProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {document.is_stale && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(255, 108, 55, 0.12)',
          borderBottom: `1px solid ${PM.border}`,
          color: '#ffb08f',
          fontSize: 13,
        }}>
          This document may be outdated. Regenerate it to sync with the latest collection changes.
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language="markdown"
          value={document.content}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            wrappingIndent: 'same',
            renderLineHighlight: 'none',
          }}
        />
      </div>
    </div>
  );
}
