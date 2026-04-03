import { Search, X } from "lucide-react";
import {
  PROJECT_TYPES,
  COMPENSATION_TYPES,
  LOCATION_TYPES,
} from "../../utils/constants";

export default function ProjectFilter({ filters, onChange }) {
  const handleChange = (key, value) =>
    onChange({ ...filters, [key]: value, page: 1 });

  const handleReset = () => onChange({ page: 1, pageSize: 12 });

  const hasActive =
    filters.keyword ||
    filters.type ||
    filters.locationType ||
    filters.compensationType;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Tìm kiếm dự án..."
          value={filters.keyword || ""}
          onChange={(e) => handleChange("keyword", e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {filters.keyword && (
          <button
            onClick={() => handleChange("keyword", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <select
          value={filters.type || ""}
          onChange={(e) => handleChange("type", e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
        >
          <option value="">Loại dự án</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={filters.locationType || ""}
          onChange={(e) => handleChange("locationType", e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
        >
          <option value="">Hình thức</option>
          {LOCATION_TYPES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <select
          value={filters.compensationType || ""}
          onChange={(e) => handleChange("compensationType", e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
        >
          <option value="">Thù lao</option>
          {COMPENSATION_TYPES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {hasActive && (
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
          >
            <X size={14} /> Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
