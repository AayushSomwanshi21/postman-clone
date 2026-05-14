import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRequestStore, type AuthType } from '@/store/requestStore';
import { useShallow } from 'zustand/react/shallow';
import { Eye, EyeOff } from 'lucide-react';

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apikey', label: 'API Key' },
];

function SecretInput({ placeholder, value, onChange, className }: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={className}
        style={{ paddingRight: 32 }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: '#888', display: 'flex', alignItems: 'center',
        }}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

export default function AuthTab() {
  const { authType, authData, setAuthType, setAuthData } = useRequestStore(
    useShallow((s) => ({
      authType: s.authType,
      authData: s.authData,
      setAuthType: s.setAuthType,
      setAuthData: s.setAuthData,
    }))
  );

  return (
    <div className="p-4 space-y-4 max-w-md">
      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Auth Type</Label>
        <Select value={authType} onValueChange={(v) => setAuthType(v as AuthType)}>
          <SelectTrigger className="w-full border-2 border-gray-500 rounded-sm px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] text-[#e5e5e5] border-[#333]">
            {AUTH_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {authType === 'bearer' && (
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Token</Label>
          <SecretInput
            placeholder="Paste your token here"
            value={authData.token ?? ''}
            onChange={(e) => setAuthData({ token: e.target.value })}
            className="font-mono text-sm border-gray-400 rounded-sm px-3"
          />
        </div>
      )}

      {authType === 'basic' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Username</Label>
            <Input
              placeholder="Username"
              value={authData.username ?? ''}
              onChange={(e) => setAuthData({ username: e.target.value })}
              className="text-sm border-gray-400 rounded-sm px-3"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Password</Label>
            <SecretInput
              placeholder="Password"
              value={authData.password ?? ''}
              onChange={(e) => setAuthData({ password: e.target.value })}
              className="text-sm border-gray-400 rounded-sm px-3"
            />
          </div>
        </div>
      )}

      {authType === 'apikey' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Key</Label>
            <Input
              placeholder="Header or param name"
              value={authData.key ?? ''}
              onChange={(e) => setAuthData({ key: e.target.value })}
              className="font-mono text-sm border-gray-400 rounded-sm px-3"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Value</Label>
            <SecretInput
              placeholder="Key value"
              value={authData.value ?? ''}
              onChange={(e) => setAuthData({ value: e.target.value })}
              className="font-mono text-sm border-gray-400 rounded-sm px-3"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Add to</Label>
            <Select
              value={authData.in ?? 'header'}
              onValueChange={(v) => setAuthData({ in: v as 'header' | 'query' })}
            >
              <SelectTrigger className="w-full border-2 border-gray-500 rounded-sm px-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] text-[#e5e5e5] border-[#333]">
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query Param</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {authType === 'none' && (
        <p className="text-xs text-muted-foreground">
          No authentication will be sent with this request.
        </p>
      )}
    </div>
  );
}
