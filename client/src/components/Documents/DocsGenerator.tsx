import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PM } from '@/lib/constants';
import type { Document } from '@/lib/types';
import { exportDocument } from '@/lib/documentService';
import { interpolate } from '@/lib/interpolate';
import { useEnvStore } from '@/store/envStore';
import { useDocumentStore } from '@/store/documentStore';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

interface DocsGeneratorProps {
  document: Document;
}

export default function DocsGenerator({ document }: DocsGeneratorProps) {
  const activeVariables = useEnvStore(useShallow((s) => s.getActiveVariablesMap()));
  const generateDocument = useDocumentStore((s) => s.generateDocument);
  const [regenerating, setRegenerating] = useState(false);
  const { resolvedContent, unresolvedVariables } = useMemo(() => {
    const resolved = interpolate(document.content, activeVariables);
    const unresolved = Array.from(
      new Set(
        Array.from(resolved.matchAll(/\{\{(\w+)\}\}/g), (match) => match[1]),
      ),
    );

    return {
      resolvedContent: resolved,
      unresolvedVariables: unresolved,
    };
  }, [activeVariables, document.content]);

  const handleDownloadPDF = async () => {
    if (unresolvedVariables.length > 0) return;

    try {
      const { blob, filename } = await exportDocument(document.id);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      toast.error('Failed to export document');
    }
  };

  const handleRegenerate = async () => {
    if (regenerating) return;

    setRegenerating(true);
    try {
      await generateDocument(document.collection_id, document.name);
      toast.success('Document regenerated', { style: { color: '#4ade80' } });
    } catch (error) {
      toast.error('Failed to regenerate document');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div
        className="flex items-center justify-end px-3 py-2 border-b gap-2"
        style={{ borderColor: PM.border }}
      >
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-neutral-300 border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neutral-800"
          disabled={unresolvedVariables.length > 0}
          title={unresolvedVariables.length > 0 ? 'Resolve all environment variables before exporting.' : 'Download PDF'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Stale warning */}
      {document.is_stale && (
        <div
          className="px-4 py-2.5 text-sm border-b flex items-center justify-between gap-3"
          style={{ background: 'rgba(255, 108, 55, 0.12)', borderColor: PM.border, color: '#ffb08f' }}
        >
          <span>This document may be outdated. Regenerate it to sync with the latest collection changes.</span>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(255, 176, 143, 0.14)',
              color: '#ffd7c7',
              border: '1px solid rgba(255, 176, 143, 0.28)',
              cursor: regenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      )}

      {unresolvedVariables.length > 0 && (
        <div
          className="px-4 py-2.5 text-sm border-b"
          style={{ background: 'rgba(255, 184, 0, 0.12)', borderColor: PM.border, color: '#ffd166' }}
        >
          Some environment variables could not be resolved for this document:
          {' '}
          {unresolvedVariables.map((variable) => `{{${variable}}}`).join(', ')}.
        </div>
      )}

      {/* Markdown preview */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {resolvedContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
