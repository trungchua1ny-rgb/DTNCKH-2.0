import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import MainLayout from "../../components/layout/MainLayout";
import { jobService } from "../../services/jobService";
import toast from "react-hot-toast";
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Filter,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  Star,
  X,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

const JOB_TYPES = [
  { value: "", label: "Tất cả loại" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Hợp đồng" },
  { value: "internship", label: "Thực tập" },
  { value: "freelance", label: "Freelance" },
];

const JOB_LEVELS = [
  { value: "", label: "Tất cả cấp độ" },
  { value: "intern", label: "Thực tập sinh" },
  { value: "fresher", label: "Fresher" },
  { value: "junior", label: "Junior" },
  { value: "middle", label: "Middle" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Manager" },
];

const SALARY_OPTIONS = [
  { value: "", label: "Tất cả mức lương" },
  { value: "5000000", label: "Trên 5 triệu" },
  { value: "10000000", label: "Trên 10 triệu" },
  { value: "20000000", label: "Trên 20 triệu" },
  { value: "30000000", label: "Trên 30 triệu" },
  { value: "50000000", label: "Trên 50 triệu" },
];

function formatSalary(min, max, currency = "VND") {
  const fmt = (n) => {
    if (!n) return null;
    if (currency === "VND") return (n / 1_000_000).toFixed(0) + "M";
    return "$" + n.toLocaleString();
  };
  const fMin = fmt(min);
  const fMax = fmt(max);
  if (!fMin && !fMax) return "Thỏa thuận";
  if (!fMin) return `Đến ${fMax}`;
  if (!fMax) return `Từ ${fMin}`;
  return `${fMin} - ${fMax}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  return `${Math.floor(days / 30)} tháng trước`;
}

function JobCard({ job, onSave, onUnsave, isSaved }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isUser = user?.role === "user";

  const handleSaveToggle = (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu tin");
      return;
    }
    if (isSaved) onUnsave(job.id);
    else onSave(job.id);
  };

  const deadline = job.deadline ? new Date(job.deadline) : null;
  const isExpiringSoon = deadline && deadline - Date.now() < 7 * 86400000;

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-blue-100 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {job.company?.logo ? (
            <img
              src={`http://localhost:5024${job.company.logo}`}
              alt={job.company?.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-6 h-6 text-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {job.company?.name}
              </p>
            </div>
            {isUser && (
              <button
                onClick={handleSaveToggle}
                className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
              >
                {isSaved ? (
                  <BookmarkCheck className="w-5 h-5 text-blue-500" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {job.location && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                <MapPin className="w-3 h-3" /> {job.location}
              </span>
            )}
            {job.type && (
              <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                <Briefcase className="w-3 h-3" />
                {JOB_TYPES.find((t) => t.value === job.type)?.label || job.type}
              </span>
            )}
            {(job.salaryMin || job.salaryMax) && (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <DollarSign className="w-3 h-3" />
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" /> {timeAgo(job.createdAt)}
            </span>
            {isExpiringSoon && (
              <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                Sắp hết hạn
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showFilter, setShowFilter] = useState(false);
  const [savedSet, setSavedSet] = useState(new Set());

  const [filters, setFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    location: searchParams.get("location") || "",
    type: searchParams.get("type") || "",
    level: searchParams.get("level") || "",
    salaryMin: searchParams.get("salaryMin") || "",
    page: parseInt(searchParams.get("page") || "1"),
    pageSize: 12,
  });

  const [inputKeyword, setInputKeyword] = useState(filters.keyword);

  // Search jobs
  const { data, isLoading } = useQuery({
    queryKey: ["jobSearch", filters],
    queryFn: () => jobService.searchJobs(filters),
    keepPreviousData: true,
  });

  // Featured jobs
  const { data: featuredData } = useQuery({
    queryKey: ["featuredJobs"],
    queryFn: () => jobService.getFeaturedJobs(6),
    enabled:
      !filters.keyword && !filters.location && !filters.type && !filters.level,
  });

  // Saved jobs (chỉ khi là user)
  const { data: savedData } = useQuery({
    queryKey: ["savedJobs"],
    queryFn: () => jobService.getSavedJobs({ page: 1, pageSize: 100 }),
    enabled: user?.role === "user",
  });

  useEffect(() => {
    if (savedData?.data?.data) {
      setSavedSet(new Set(savedData.data.data.map((j) => j.id)));
    }
  }, [savedData]);

  const saveMutation = useMutation({
    mutationFn: (id) => jobService.saveJob(id),
    onSuccess: (_, id) => {
      setSavedSet((prev) => new Set([...prev, id]));
      toast.success("Đã lưu tin tuyển dụng");
    },
    onError: () => toast.error("Không thể lưu tin"),
  });

  const unsaveMutation = useMutation({
    mutationFn: (id) => jobService.unsaveJob(id),
    onSuccess: (_, id) => {
      setSavedSet((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
      toast.success("Đã bỏ lưu");
    },
  });

  const applyFilters = (newFilters) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);
    const params = {};
    Object.entries(updated).forEach(([k, v]) => {
      if (v && v !== 1) params[k] = v;
    });
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters({ keyword: inputKeyword });
  };

  const clearFilter = (key) => {
    const updated = { ...filters, [key]: "", page: 1 };
    setFilters(updated);
    if (key === "keyword") setInputKeyword("");
    const params = {};
    Object.entries(updated).forEach(([k, v]) => {
      if (v && v !== 1) params[k] = v;
    });
    setSearchParams(params);
  };

  const jobs = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / filters.pageSize);

  const featuredJobs = featuredData?.data?.data || [];
  const showFeatured =
    featuredJobs.length > 0 &&
    !filters.keyword &&
    !filters.type &&
    !filters.level &&
    !filters.location;

  // ✅ LOGIC XỬ LÝ TRÙNG LẶP
  const featuredJobIds = new Set(featuredJobs.map((job) => job.id));
  const displayJobs = showFeatured
    ? jobs.filter((job) => !featuredJobIds.has(job.id))
    : jobs;

  const activeFilters = [
    filters.type && {
      key: "type",
      label: JOB_TYPES.find((t) => t.value === filters.type)?.label,
    },
    filters.level && {
      key: "level",
      label: JOB_LEVELS.find((l) => l.value === filters.level)?.label,
    },
    filters.salaryMin && {
      key: "salaryMin",
      label: SALARY_OPTIONS.find((s) => s.value === filters.salaryMin)?.label,
    },
    filters.location && { key: "location", label: `📍 ${filters.location}` },
  ].filter(Boolean);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Search */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Tìm kiếm việc làm
            </h1>
            <p className="text-blue-200 mb-8">
              Khám phá hàng nghìn cơ hội nghề nghiệp phù hợp với bạn
            </p>

            <form
              onSubmit={handleSearch}
              className="flex gap-3 max-w-2xl mx-auto"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={inputKeyword}
                  onChange={(e) => setInputKeyword(e.target.value)}
                  placeholder="Tên công việc, kỹ năng, công ty..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                Tìm kiếm
              </button>
            </form>

            {/* Quick filters */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["React", "NodeJS", "Python", "Java", "UI/UX", "Marketing"].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setInputKeyword(tag);
                      applyFilters({ keyword: tag });
                    }}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full transition-colors"
                  >
                    {tag}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                showFilter
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
              {activeFilters.length > 0 && (
                <span className="bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-xl border border-blue-100"
              >
                {f.label}
                <button
                  onClick={() => clearFilter(f.key)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            {total > 0 && (
              <span className="ml-auto text-sm text-gray-500">
                Tìm thấy <strong className="text-gray-900">{total}</strong> việc
                làm
              </span>
            )}
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Địa điểm
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={filters.location}
                    onChange={(e) => applyFilters({ location: e.target.value })}
                    placeholder="Hà Nội, TP.HCM..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Loại công việc
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => applyFilters({ type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Cấp độ
                </label>
                <select
                  value={filters.level}
                  onChange={(e) => applyFilters({ level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {JOB_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Mức lương tối thiểu
                </label>
                <select
                  value={filters.salaryMin}
                  onChange={(e) => applyFilters({ salaryMin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {SALARY_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Featured jobs */}
          {showFeatured && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Việc làm nổi bật
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSave={(id) => saveMutation.mutate(id)}
                    onUnsave={(id) => unsaveMutation.mutate(id)}
                    isSaved={savedSet.has(job.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            {filters.keyword && (
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Kết quả cho "
                <span className="text-blue-600">{filters.keyword}</span>"
              </h2>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
                  >
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="flex gap-2 mt-3">
                          <div className="h-6 w-16 bg-gray-100 rounded-full" />
                          <div className="h-6 w-20 bg-gray-100 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayJobs.length === 0 && !showFeatured ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Không tìm thấy việc làm phù hợp</p>
                <p className="text-sm text-gray-400 mt-1">
                  Thử thay đổi từ khóa hoặc bộ lọc
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSave={(id) => saveMutation.mutate(id)}
                    onUnsave={(id) => unsaveMutation.mutate(id)}
                    isSaved={savedSet.has(job.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => applyFilters({ page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page;
                  if (totalPages <= 7) page = i + 1;
                  else if (filters.page <= 4) page = i + 1;
                  else if (filters.page >= totalPages - 3)
                    page = totalPages - 6 + i;
                  else page = filters.page - 3 + i;

                  return (
                    <button
                      key={page}
                      onClick={() => applyFilters({ page })}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        filters.page === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => applyFilters({ page: filters.page + 1 })}
                  disabled={filters.page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
