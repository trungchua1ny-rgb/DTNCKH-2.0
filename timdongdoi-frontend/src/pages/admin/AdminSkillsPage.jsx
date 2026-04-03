import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Tag,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Hash,
  Grid,
} from "lucide-react";
import { toast } from "react-hot-toast";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import api from "../../services/api";

// ── API ───────────────────────────────────────────────────────────────────────
const skillApi = {
  getAll: () => api.get("/Skills"),
  create: (data) => api.post("/Skills", data),
  // search chỉ dùng client-side vì đã có tất cả data
};

// Response mỗi skill: { id, name, category, icon, popularity }

// ── Add Skill Form ────────────────────────────────────────────────────────────
function AddSkillForm({ onSuccess, existingNames }) {
  const [name, setName] = useState("");
  const [category, setCat] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState("");

  const isDuplicate =
    name.trim() && existingNames.has(name.trim().toLowerCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên skill");
      return;
    }
    if (isDuplicate) {
      setError(`Skill "${name.trim()}" đã tồn tại`);
      return;
    }
    setError("");
    setLoad(true);
    try {
      await skillApi.create({
        name: name.trim(),
        category: category.trim() || null,
        icon: icon.trim() || null,
      });
      setName("");
      setCat("");
      setIcon("");
      toast.success(`Đã thêm skill "${name.trim()}"!`);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Thêm skill thất bại");
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Plus size={18} className="text-blue-500" /> Thêm skill mới
      </h2>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
      >
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tên skill <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="VD: React, Python, Figma..."
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
              isDuplicate
                ? "border-red-300 focus:ring-red-400"
                : "border-gray-200 focus:ring-blue-500"
            }`}
          />
          {isDuplicate && (
            <p className="text-xs text-red-400 mt-1">Skill này đã tồn tại</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Danh mục
          </label>
          <input
            value={category}
            onChange={(e) => setCat(e.target.value)}
            placeholder="VD: Frontend, Design..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Icon */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Icon{" "}
            <span className="text-gray-400 font-normal">(emoji hoặc URL)</span>
          </label>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="⚛️ hoặc để trống"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit */}
        <div className="sm:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || !name.trim() || isDuplicate}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-sm text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang thêm...
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                Thêm skill
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Skill Tag ─────────────────────────────────────────────────────────────────
function SkillTag({ skill }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all group">
      {skill.icon ? (
        <span className="text-base shrink-0">{skill.icon}</span>
      ) : (
        <Tag size={13} className="text-blue-400 shrink-0" />
      )}
      <span className="text-sm font-medium text-gray-700">{skill.name}</span>
      {skill.popularity > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <TrendingUp size={10} />
          {skill.popularity}
        </span>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminSkillsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" | "list"

  const { data: raw, isLoading } = useQuery({
    queryKey: ["admin-skills"],
    queryFn: () =>
      skillApi.getAll().then((r) => r.data.data || r.data.Data || r.data || []),
    staleTime: 60 * 1000,
  });

  const skills = Array.isArray(raw) ? raw : [];

  // Set tên đã có để check duplicate
  const existingNames = new Set(skills.map((s) => s.name?.toLowerCase()));

  // Categories
  const categories = [
    ...new Set(skills.map((s) => s.category).filter(Boolean)),
  ].sort();

  // Filter
  const filtered = skills.filter((s) => {
    const matchSearch =
      !search || s.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || s.category === catFilter;
    return matchSearch && matchCat;
  });

  // Sort by popularity desc
  const sorted = [...filtered].sort(
    (a, b) => (b.popularity || 0) - (a.popularity || 0),
  );

  // Group by category
  const grouped = sorted.reduce((acc, s) => {
    const cat = s.category || "Chưa phân loại";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Skills</h1>
            <p className="text-gray-500 text-sm mt-1">
              Hệ thống kỹ năng dùng cho Jobs, Projects và User Profiles
            </p>
          </div>
          {/* Stats */}
          <div className="flex gap-2">
            <div className="text-center px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-lg font-bold text-blue-600">{skills.length}</p>
              <p className="text-xs text-gray-500">Tổng skills</p>
            </div>
            <div className="text-center px-4 py-2 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-lg font-bold text-purple-600">
                {categories.length}
              </p>
              <p className="text-xs text-gray-500">Danh mục</p>
            </div>
          </div>
        </div>

        {/* Add Form */}
        <AddSkillForm
          existingNames={existingNames}
          onSuccess={() => queryClient.invalidateQueries(["admin-skills"])}
        />

        {/* Filters + View toggle */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm skill..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCatFilter("")}
              className={`px-3 py-2 text-sm font-medium rounded-xl transition ${
                !catFilter
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Tất cả ({skills.length})
            </button>
            {categories.map((cat) => {
              const count = skills.filter((s) => s.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat === catFilter ? "" : cat)}
                  className={`px-3 py-2 text-sm font-medium rounded-xl transition ${
                    catFilter === cat
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* View mode */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grouped")}
              className={`p-2 rounded-lg transition ${viewMode === "grouped" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
              title="Nhóm theo danh mục"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
              title="Sắp xếp theo phổ biến"
            >
              <TrendingUp size={16} />
            </button>
          </div>
        </div>

        {/* Skills display */}
        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Tag size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">
              {search ? `Không tìm thấy "${search}"` : "Chưa có skill nào"}
            </p>
          </div>
        ) : viewMode === "grouped" ? (
          // Grouped view
          <div className="space-y-6">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([cat, catSkills]) => (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <Hash size={14} className="text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                      {cat}
                    </h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {catSkills.length}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {catSkills.map((skill) => (
                      <SkillTag key={skill.id} skill={skill} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          // List view - sorted by popularity
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <TrendingUp size={13} /> Sắp xếp theo mức độ phổ biến
            </div>
            <div className="divide-y divide-gray-50">
              {sorted.map((skill, i) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                >
                  <span className="text-xs font-bold text-gray-300 w-6 text-right">
                    {i + 1}
                  </span>
                  {skill.icon ? (
                    <span className="text-lg w-7 text-center">
                      {skill.icon}
                    </span>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Tag size={13} className="text-blue-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      {skill.name}
                    </p>
                    {skill.category && (
                      <p className="text-xs text-gray-400">{skill.category}</p>
                    )}
                  </div>
                  {skill.popularity > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                      <TrendingUp size={11} className="text-orange-400" />
                      <span className="font-semibold text-orange-500">
                        {skill.popularity}
                      </span>
                      <span>users</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Hiển thị {filtered.length}/{skills.length} skills
            {search && ` · Kết quả cho "${search}"`}
          </p>
        )}
      </div>
    </MainLayout>
  );
}
