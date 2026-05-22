import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { PM } from '@/lib/constants';
import { useCollectionStore } from '@/store/collectionStore';
import { useDocumentStore } from '@/store/documentStore';
import { toast } from 'sonner';

interface GenerateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GenerateDocumentDialog({ open, onOpenChange }: GenerateDocumentDialogProps) {
  const collections = useCollectionStore((s) => s.collections);
  const generateDocument = useDocumentStore((s) => s.generateDocument);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedCollectionId('');
      setDocumentName('');
      setSaving(false);
      return;
    }
    const initialCollection = collections[0] ?? null;
    setSelectedCollectionId(initialCollection?.id ?? '');
    setDocumentName(initialCollection ? `${initialCollection.name} Docs` : '');
  }, [open, collections]);

  function handleCollectionChange(collectionId: string) {
    const collection = collections.find((item) => item.id === collectionId) ?? null;
    setSelectedCollectionId(collectionId);
    setDocumentName(collection ? `${collection.name} Docs` : '');
  }

  async function handleConfirm() {
    if (saving || !selectedCollectionId) return;
    setSaving(true);
    try {
      await generateDocument(selectedCollectionId, documentName.trim() || undefined);
      toast.success('Document generated', { style: { color: '#4ade80' } });
      onOpenChange(false);
    } catch {
      toast.error('Failed to generate document');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!saving) onOpenChange(nextOpen); }}>
      <AlertDialogContent size="default" className="bg-[#1c1b1b] border-[#3a3a3a]">
        <AlertDialogHeader>
          <AlertDialogTitle>Generate Document</AlertDialogTitle>
          <AlertDialogDescription>
            Choose the collection and confirm the document name.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Select
            value={selectedCollectionId}
            onValueChange={handleCollectionChange}
            disabled={saving || collections.length === 0}
          >
            <SelectTrigger className="w-full rounded-sm border-2 border-gray-500 px-3 text-left">
              <SelectValue placeholder="Select a collection" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] text-[#e5e5e5] border-[#333]">
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Document name"
            value={documentName}
            disabled={saving || !selectedCollectionId}
            onChange={(e) => setDocumentName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving} style={{ borderRadius: 6 }}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleConfirm(); }}
            disabled={saving || !selectedCollectionId}
            style={{ borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {saving && <Spinner style={{ width: 14, height: 14 }} />}
            Generate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
