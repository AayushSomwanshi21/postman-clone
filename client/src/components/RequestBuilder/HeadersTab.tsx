import { useRequestStore } from '@/store/requestStore';
import KeyValueTable from './KeyValueTable';

export default function HeadersTab() {
  const { headers, setHeaders } = useRequestStore();
  return <KeyValueTable rows={headers} onChange={setHeaders} />;
}
