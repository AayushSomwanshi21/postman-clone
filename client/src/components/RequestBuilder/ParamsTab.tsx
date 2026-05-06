import { useRequestStore } from '@/store/requestStore';
import KeyValueTable from './KeyValueTable';

export default function ParamsTab() {
  const { params, setParams } = useRequestStore();
  return <KeyValueTable rows={params} onChange={setParams} />;
}
