import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { JOB_TYPES, JOB_LEVELS, LOCATION_TYPES } from "../../utils/constants";

export default function JobFilter({ filters, onChange }) {
  const [showMore, setShowMore] = useState(false);

  // ✅ Kỹ thuật Local State: Tách biệt hoàn toàn ô gõ với dữ liệu gốc để chống lỗi nhảy số e+24
  const [minInput, setMinInput] = useState(
    filters.salaryMin ? (filters.salaryMin / 1000000).toString() : "",
  );
  const [maxInput, setMaxInput] = useState(
    filters.salaryMax ? (filters.salaryMax / 1000000).toString() : "",
  );

  // ✅ Khi bấm "Xóa bộ lọc", hàm này sẽ dọn dẹp sạch sẽ 2 ô input
  useEffect(() => {
    if (!filters.salaryMin) setMinInput(""); // eslint-disable-line
    if (!filters.salaryMax) setMaxInput(""); // eslint-disable-line
  }, [filters.salaryMin, filters.salaryMax]);

  // Xử lý các filter chữ/select thông thường
  const handleChange = (key, value) => {
    // Nếu rỗng -> xóa thuộc tính đó để URL sạch sẽ
    if (value === "") {
      const newFilters = { ...filters };
      delete newFilters[key];
      onChange({ ...newFilters, page: 1 });
    } else {
      onChange({ ...filters, [key]: value, page: 1 });
    }
  };

  // Xử lý riêng cho 2 ô Lương: Cập nhật chữ trên ô input ngay lập tức, và gửi số đã nhân 1 triệu lên API
  const handleSalaryChange = (field, textValue, setLocalInput) => {
    setLocalInput(textValue); // Cho phép người dùng gõ/xóa tự do trên giao diện

    const newFilters = { ...filters, page: 1 };
    if (textValue === "") {
      delete newFilters[field]; // Nếu xóa trắng -> Bỏ điều kiện lọc đó đi
    } else {
      newFilters[field] = Number(textValue) * 1000000;
    }
    onChange(newFilters);
  };

  const handleReset = () => {
    onChange({ page: 1, pageSize: 12 });
  };

  // ✅ FIX: Đã đổi tên "search" thành "keyword" cho khớp với Swagger
  const hasActiveFilters =
    filters.keyword ||
    filters.type ||
    filters.level ||
    filters.locationType ||
    filters.salaryMin ||
    filters.salaryMax;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        {/* ✅ FIX: Đã đổi tên biến thành keyword */}
        <input
          type="text"
          placeholder="Tìm kiếm việc làm, công ty..."
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

      {/* Quick filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Type */}
        <select
          value={filters.type || ""}
          onChange={(e) => handleChange("type", e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
        >
          <option value="">Loại hình</option>
          {JOB_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Level */}
        <select
          value={filters.level || ""}
          onChange={(e) => handleChange("level", e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
        >
          <option value="">Cấp độ</option>
          {JOB_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        {/* Location type */}
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

        {/* More filters toggle */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors
            ${showMore ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
        >
          <SlidersHorizontal size={15} />
          Lọc thêm
        </button>
      </div>

      {/* Extended filters */}
      {showMore && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Lương tối thiểu (triệu)
            </label>
            <input
              type="number"
              min="0"
              placeholder="VD: 10"
              value={minInput}
              onChange={(e) =>
                handleSalaryChange("salaryMin", e.target.value, setMinInput)
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Lương tối đa (triệu)
            </label>
            <input
              type="number"
              min="0"
              placeholder="VD: 30"
              value={maxInput}
              onChange={(e) =>
                handleSalaryChange("salaryMax", e.target.value, setMaxInput)
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <div className="flex justify-end pt-1">
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
