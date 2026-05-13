import { useRequestStore } from '@/store/requestStore';
import KeyValueTable from './KeyValueTable';

export default function ParamsTab() {
  const { params, setParams, pathVars, setPathVars } = useRequestStore();

  return (
    <div>
      <div className="px-3 py-1.5 text-xs font-semibold text-[#aaa] bg-[#1e1e1e] border-b border-[#3a3a3a]">
        Query Params
      </div>
      <KeyValueTable rows={params} onChange={setParams} />

      <div className="px-3 py-1.5 text-xs font-semibold text-[#aaa] bg-[#1e1e1e] border-b border-[#3a3a3a] mt-2">
        Path Variables
      </div>
      {pathVars.length === 0 ? (
        <div className="px-3 py-3 text-xs text-[#555]">No path variables detected in URL.</div>
      ) : (
        <KeyValueTable rows={pathVars} onChange={setPathVars} readOnlyKeys />
      )}
    </div>
  );
}
