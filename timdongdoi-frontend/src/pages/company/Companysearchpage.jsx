import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import companyService from "../../services/companyService";
import {
  Search,
  Building2,
  MapPin,
  Users,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";

const INDUSTRIES = [
  { value: "", label: "Tất cả ngành" },
  { value: "technology", label: "Công nghệ thông tin" },
  { value: "finance", label: "Tài chính - Ngân hàng" },
  { value: "education", label: "Giáo dục" },
  { value: "healthcare", label: "Y tế - Sức khỏe" },
  { value: "retail", label: "Bán lẻ - Thương mại" },
  { value: "manufacturing", label: "Sản xuất" },
  { value: "marketing", label: "Marketing - Truyền thông" },
  { value: "construction", label: "Xây dựng - Bất động sản" },
  { value: "logistics", label: "Vận tải - Logistics" },
  { value: "hospitality", label: "Du lịch - Nhà hàng" },
  { value: "other", label: "Khác" },
];

const COMPANY_SIZES = [
  { value: "", label: "Mọi quy mô" },
  { value: "1-10", label: "1 - 10 nhân viên" },
  { value: "11-50", label: "11 - 50 nhân viên" },
  { value: "51-200", label: "51 - 200 nhân viên" },
  { value: "201-500", label: "201 - 500 nhân viên" },
  { value: "501-1000", label: "501 - 1000 nhân viên" },
  { value: "1000+", label: "Trên 1000 nhân viên" },
];

function CompanyCard({ company }) {
  const navigate = useNavigate();
  const isVerified = company.verificationStatus === "verified";

  return (
    <div
      onClick={() => navigate(`/companies/${company.id}`)}
      className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-blue-100 transition-all cursor-pointer group"
    >
      {/* Logo + Name */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {company.logo ? (
            <img
              src={`http://localhost:5024${company.logo}`}
              alt={company.name}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <Building2 className="w-7 h-7 text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {company.name}
            </h3>
            {isVerified && (
              <CheckCircle
                className="w-4 h-4 text-blue-500 flex-shrink-0"
                title="Đã xác minh"
              />
            )}
          </div>
          {company.industry && (
            <p className="text-sm text-gray-500 mt-0.5">
              {INDUSTRIES.find((i) => i.value === company.industry)?.label ||
                company.industry}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-50 pt-4">
        {company.size && (
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            {COMPANY_SIZES.find((s) => s.value === company.size)?.label ||
              company.size}
          </span>
        )}
        {company.totalJobs > 0 && (
          <span className="flex items-center gap-1.5 ml-auto">
            <Briefcase className="w-4 h-4 text-blue-400" />
            <span className="text-blue-600 font-medium">
              {company.totalJobs}
            </span>{" "}
            việc làm
          </span>
        )}
      </div>
    </div>
  );
}

export default function CompanySearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);

  const [filters, setFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    industry: searchParams.get("industry") || "",
    size: searchParams.get("size") || "",
    page: parseInt(searchParams.get("page") || "1"),
    pageSize: 12,
  });

  const [inputKeyword, setInputKeyword] = useState(filters.keyword);

  const { data, isLoading } = useQuery({
    queryKey: ["companySearch", filters],
    queryFn: () => companyService.searchCompanies(filters),
    keepPreviousData: true,
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

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters({ keyword: inputKeyword });
  };

  const companies = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / filters.pageSize);

  const activeFilters = [
    filters.industry && {
      key: "industry",
      label: INDUSTRIES.find((i) => i.value === filters.industry)?.label,
    },
    filters.size && {
      key: "size",
      label: COMPANY_SIZES.find((s) => s.value === filters.size)?.label,
    },
  ].filter(Boolean);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Khám phá công ty
            </h1>
            <p className="text-indigo-200 mb-8">
              Tìm hiểu về các doanh nghiệp hàng đầu đang tuyển dụng
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
                  placeholder="Tên công ty, ngành nghề..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Tìm kiếm
              </button>
            </form>

            {/* Industry quick links */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {INDUSTRIES.slice(1, 6).map((ind) => (
                <button
                  key={ind.value}
                  onClick={() => applyFilters({ industry: ind.value })}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    filters.industry === ind.value
                      ? "bg-white text-indigo-700 font-medium"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                >
                  {ind.label}
                </button>
              ))}
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
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
              {activeFilters.length > 0 && (
                <span className="bg-indigo-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-xl border border-indigo-100"
              >
                {f.label}
                <button
                  onClick={() => clearFilter(f.key)}
                  className="hover:text-indigo-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            {total > 0 && (
              <span className="ml-auto text-sm text-gray-500">
                <strong className="text-gray-900">{total}</strong> công ty
              </span>
            )}
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Ngành nghề
                </label>
                <select
                  value={filters.industry}
                  onChange={(e) => applyFilters({ industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {INDUSTRIES.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Quy mô công ty
                </label>
                <select
                  value={filters.size}
                  onChange={(e) => applyFilters({ size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {COMPANY_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse"
                >
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-full mt-4 pt-4" />
                </div>
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Không tìm thấy công ty phù hợp</p>
              <p className="text-sm text-gray-400 mt-1">
                Thử thay đổi từ khóa hoặc bộ lọc
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => applyFilters({ page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const page =
                      totalPages <= 7
                        ? i + 1
                        : filters.page <= 4
                          ? i + 1
                          : filters.page >= totalPages - 3
                            ? totalPages - 6 + i
                            : filters.page - 3 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => applyFilters({ page })}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          filters.page === page
                            ? "bg-indigo-600 text-white"
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
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
