import { Search } from "lucide-react";
import { useDebounce } from "../NewHooks/useDebounce";

type Props = {
  search: string;
  onSearch: (v: string) => void;
  status?: string;
  onStatusChange: (v?: string) => void;
  limit: number;
  onLimitChange: (l: number) => void;
};

export default function ProjectFilters({
  search,
  onSearch,
  status,
  onStatusChange,
  limit,
  onLimitChange,
}: Props) {
  const debounced = useDebounce((v: string) => onSearch(v), 300);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mb-2">
      <div className="relative w-full sm:flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          className="pl-10 pr-3 py-2 w-full border rounded-md"
          placeholder="Search projects..."
          defaultValue={search}
          onChange={(e) => debounced(e.target.value)}
        />
      </div>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value || undefined)}
        className="px-3 py-2 border rounded-md"
      >
        <option value="">All Statuses</option>
        <option value="idea">Idea</option>
        <option value="prototype">Prototype</option>
        <option value="red_seal">Red Seal</option>
        <option value="green_seal">Green Seal</option>
        <option value="po_pending">PO Pending</option>
        <option value="po_approved">PO Approved</option>
      </select>

      <select
        value={String(limit)}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        className="px-3 py-2 border rounded-md"
      >
        <option value={4}>4</option>
        <option value={8}>8</option>
        <option value={12}>12</option>
        <option value={24}>24</option>
      </select>
    </div>
  );
}
