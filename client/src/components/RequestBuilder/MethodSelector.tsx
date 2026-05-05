import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRequestStore } from '@/store/requestStore';
import { HTTP_METHODS, METHOD_COLORS } from '@/lib/constants';

export default function MethodSelector() {
  const { method, setMethod } = useRequestStore();
  return (
    <Select value={method} onValueChange={setMethod}>
      <SelectTrigger className={`w-32 font-semibold ${METHOD_COLORS[method]}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {HTTP_METHODS.map((m) => (
          <SelectItem key={m} value={m} className={METHOD_COLORS[m]}>
            {m}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
