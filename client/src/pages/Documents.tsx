import DocList from '@/components/Documents/DocList';
import DocsGenerator from '@/components/Documents/DocsGenerator';
import { PM } from '@/lib/constants';
import { useDocumentStore } from '@/store/documentStore';
import { Spinner } from '@/components/ui/spinner';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function Documents() {
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const selectedDocumentId = useDocumentStore((s) => s.selectedDocumentId);
  const documentsById = useDocumentStore((s) => s.documentsById);
  const loadingDocumentId = useDocumentStore((s) => s.loadingDocumentId);
  const document = selectedDocumentId ? documentsById[selectedDocumentId] ?? null : null;

  if (!activeWorkspace) return null;

  return (
    <>
      <div style={{
        width: 230, background: PM.bgPanel,
        borderRight: `1px solid ${PM.border}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          <DocList />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: PM.bgContent }}>
        {loadingDocumentId && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}>
            <Spinner />
          </div>
        )}

        {!loadingDocumentId && !document && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            color: PM.muted,
            fontSize: 14,
          }}>
            Select a document to view it.
          </div>
        )}

        {!loadingDocumentId && document && (
          <>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${PM.border}`,
              background: PM.bgPanel,
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: PM.text }}>{document.name}</div>
            </div>

            <DocsGenerator document={document} />
          </>
        )}
      </div>
    </>
  );
}
