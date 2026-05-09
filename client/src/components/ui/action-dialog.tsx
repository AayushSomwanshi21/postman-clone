import { useState, useEffect } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'delete';
  title: string;
  description?: string;
  placeholder?: string;
  onConfirm: (name?: string) => Promise<void>;
}

export function ActionDialog({ open, onOpenChange, mode, title, description, placeholder, onConfirm }: ActionDialogProps) {
  const [saving, setSaving] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => { if (!open) setInputValue(''); }, [open]);

  async function handleConfirm() {
    if (saving) return;
    setSaving(true);
    try {
      await onConfirm(mode === 'create' ? inputValue.trim() || undefined : undefined);
    } finally {
      setSaving(false);
      onOpenChange(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <AlertDialogContent
        size={mode === 'delete' ? 'sm' : 'default'}
        className="bg-[#1c1b1b] border-[#3a3a3a]"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {mode === 'create' && (
          <Input
            autoFocus
            placeholder={placeholder ?? 'Name'}
            value={inputValue}
            disabled={saving}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
          />
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving} style={{ borderRadius: 6 }}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleConfirm(); }}
            disabled={saving}
            style={{
              borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: 6,
              ...(mode === 'delete' ? { background: '#e74c3c' } : {}),
            }}
          >
            {saving && <Spinner style={{ width: 14, height: 14 }} />}
            {mode === 'create' ? 'Save' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
