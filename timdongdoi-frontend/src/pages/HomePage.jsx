import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Briefcase,
  Users,
  ArrowRight,
  Rocket,
  Building2,
  Heart,
  MapPin,
  Clock,
  TrendingUp,
  Zap,
  Sparkles,
  Shield,
  Star,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { jobService } from "../services/jobService";
import { projectService } from "../services/projectService";
import companyService from "../services/companyService";
import MainLayout from "../components/layout/MainLayout";
import HomeRecommendationSection from "../components/recommendation/HomeRecommendationSection";

const API_BASE = "http://localhost:5024";

const JOB_TYPE_LABEL = {
  "full-time": "Toàn thời gian",
  "part-time": "Bán thời gian",
  contract: "Hợp đồng",
  internship: "Thực tập",
  freelance: "Freelance",
};
const LOCATION_TYPE_LABEL = {
  remote: "Remote",
  onsite: "Tại văn phòng",
  hybrid: "Hybrid",
};
const PROJECT_TYPE_MAP = {
  startup: { label: "Startup", bg: "bg-violet-50 text-violet-600" },
  freelance: { label: "Freelance", bg: "bg-blue-50 text-blue-600" },
  research: { label: "Nghiên cứu", bg: "bg-emerald-50 text-emerald-600" },
  social: { label: "Xã hội", bg: "bg-orange-50 text-orange-600" },
  side_project: { label: "Side Project", bg: "bg-pink-50 text-pink-600" },
  open_source: { label: "Open Source", bg: "bg-cyan-50 text-cyan-600" },
  other: { label: "Khác", bg: "bg-gray-100 text-gray-500" },
};
const COMPENSATION_MAP = {
  paid: { label: "Có thù lao", bg: "bg-emerald-50 text-emerald-600" },
  equity: { label: "Equity", bg: "bg-amber-50 text-amber-600" },
  revenue_share: { label: "Chia doanh thu", bg: "bg-blue-50 text-blue-600" },
  volunteer: { label: "Tình nguyện", bg: "bg-gray-100 text-gray-500" },
  negotiable: { label: "Thương lượng", bg: "bg-indigo-50 text-indigo-600" },
};
const GRADIENTS = [
  "from-blue-400 to-indigo-500",
  "from-violet-400 to-purple-500",
  "from-cyan-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-pink-500",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function imgUrl(p) {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `${API_BASE}${p}`;
}
function initials(n = "") {
  return (
    n
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}
function grad(i) {
  return GRADIENTS[Math.abs(i) % GRADIENTS.length];
}
function formatSalary(min, max, cur = "VND") {
  const f = (n) => (n >= 1e6 ? `${n / 1e6}tr` : `${n / 1e3}k`);
  if (min && max) return `${f(min)} - ${f(max)} ${cur}`;
  if (min) return `Từ ${f(min)} ${cur}`;
  if (max) return `Đến ${f(max)} ${cur}`;
  return "Thỏa thuận";
}
function formatTimeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} ngày trước`;
  return `${Math.floor(day / 30)} tháng trước`;
}

// Smart extract — handle mọi response format
function extractArray(res) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d?.Data)) return d.Data; // PascalCase { Data: [] }
  if (Array.isArray(d?.data?.data)) return d.data.data; // nested { data: { data: [] } }
  if (Array.isArray(d?.data)) return d.data; // camelCase { data: [] }
  if (Array.isArray(d)) return d;
  return [];
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="w-11 h-11 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
      <div className="h-7 bg-gray-100 rounded-lg w-1/3 mb-3" />
      <div className="flex gap-2">
        <div className="h-6 bg-gray-100 rounded-full w-24" />
        <div className="h-6 bg-gray-100 rounded-full w-16" />
      </div>
    </div>
  );
}
function CompanySkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse flex gap-4">
      <div className="w-14 h-14 bg-gray-200 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-green-100 rounded w-1/4" />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, gradient }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-6">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} mb-1 shadow-sm`}
      >
        <Icon size={22} className="text-white" />
      </div>
      <span className="text-3xl font-extrabold text-gray-800 tracking-tight">
        {value}
      </span>
      <span className="text-sm text-gray-500 font-medium text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function HomeJobCard({ job, idx }) {
  const id = job.id ?? job.Id;
  const title = job.title ?? job.Title ?? "(Không có tiêu đề)";
  const type = job.type ?? job.Type;
  const locationType = job.locationType ?? job.LocationType;
  const location = job.location ?? job.Location;
  const salaryMin = job.salaryMin ?? job.SalaryMin;
  const salaryMax = job.salaryMax ?? job.SalaryMax;
  const currency = job.salaryCurrency ?? job.SalaryCurrency ?? "VND";
  const createdAt = job.createdAt ?? job.CreatedAt;
  const skills = job.skills ?? job.Skills ?? [];
  const company = job.company ?? job.Company ?? {};
  const companyName = company.name ?? company.Name ?? "Công ty";
  const companyLogo = company.logo ?? company.Logo;
  const isVerified = ["verified", "approved"].includes(
    (
      company.verificationStatus ??
      company.VerificationStatus ??
      ""
    ).toLowerCase(),
  );

  return (
    <Link
      to={`/jobs/${id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 p-5 flex flex-col gap-3 h-full"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50 flex items-center justify-center">
          {companyLogo ? (
            <img
              src={imgUrl(companyLogo)}
              alt={companyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${grad(idx)} text-white text-xs font-bold`}
            >
              {initials(companyName)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <p className="text-xs text-gray-400 truncate">{companyName}</p>
            {isVerified && (
              <Shield size={11} className="text-blue-500 flex-shrink-0" />
            )}
          </div>
          <h3 className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>
        </div>
      </div>
      {(salaryMin || salaryMax) && (
        <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg w-fit">
          {formatSalary(salaryMin, salaryMax, currency)}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {type && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
            {JOB_TYPE_LABEL[type.toLowerCase()] ?? type}
          </span>
        )}
        {locationType && (
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
            {LOCATION_TYPE_LABEL[locationType.toLowerCase()] ?? locationType}
          </span>
        )}
        {location && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full flex items-center gap-1">
            <MapPin size={10} />
            {location}
          </span>
        )}
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 3).map((s, i) => (
            <span
              key={s.skillId ?? s.id ?? i}
              className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md"
            >
              {s.skillName ?? s.SkillName}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="text-xs text-gray-400 self-center">
              +{skills.length - 3}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={11} />
          {createdAt ? formatTimeAgo(createdAt) : "Mới đăng"}
        </span>
        <span className="text-xs text-blue-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Xem thêm <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function HomeProjectCard({ project, idx }) {
  const typeInfo =
    PROJECT_TYPE_MAP[(project.type ?? "").toLowerCase()] ??
    PROJECT_TYPE_MAP.other;
  const compInfo =
    COMPENSATION_MAP[(project.compensationType ?? "").toLowerCase()] ?? null;
  const locLabel =
    LOCATION_TYPE_LABEL[(project.locationType ?? "").toLowerCase()] ??
    project.locationType;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all duration-300 p-5 flex flex-col gap-3 h-full"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex-shrink-0 bg-gradient-to-br ${grad(idx + 2)} flex items-center justify-center`}
        >
          <Rocket size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-violet-600 transition-colors line-clamp-2">
            {project.title}
          </h3>
          {project.owner?.fullName && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              bởi {project.owner.fullName}
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeInfo.bg}`}
        >
          {typeInfo.label}
        </span>
        {locLabel && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
            {locLabel}
          </span>
        )}
        {compInfo && (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${compInfo.bg}`}
          >
            {compInfo.label}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs">
          {project.openPositions > 0 && (
            <span className="text-emerald-600 font-medium">
              {project.openPositions} vị trí trống
            </span>
          )}
          <span className="text-gray-400 flex items-center gap-1">
            <Clock size={11} />
            {formatTimeAgo(project.createdAt)}
          </span>
        </div>
        <span className="text-xs text-violet-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Xem <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}

// ─── Company Card ─────────────────────────────────────────────────────────────
// CompanyDto: id, userId, name, logo, industry, size, website,
//             verificationStatus, createdAt, totalJobs, totalLocations
function HomeCompanyCard({ company, idx }) {
  const isVerified = ["verified", "approved"].includes(
    (company.verificationStatus ?? "").toLowerCase(),
  );

  return (
    <Link
      to={`/companies/${company.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 p-4 flex items-center gap-4"
    >
      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50 flex items-center justify-center">
        {company.logo ? (
          <img
            src={imgUrl(company.logo)}
            alt={company.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${grad(idx)} text-white text-lg font-bold`}
          >
            {initials(company.name)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-semibold text-gray-800 text-sm truncate group-hover:text-blue-600 transition-colors">
            {company.name}
          </h3>
          {isVerified && (
            <Shield size={13} className="text-blue-500 flex-shrink-0" />
          )}
        </div>
        {company.industry && (
          <p className="text-xs text-gray-400 truncate">{company.industry}</p>
        )}
        {/* totalJobs từ backend đếm status="active" */}
        {company.totalJobs > 0 && (
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {company.totalJobs} việc làm
          </p>
        )}
      </div>
      <ChevronRight
        size={16}
        className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0"
      />
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  // GET /api/jobs/featured?limit=6 → { Success: true, Data: JobDto[] }
  const { data: jobsRes, isLoading: jobsLoading } = useQuery({
    queryKey: ["home-featured-jobs"],
    queryFn: () => jobService.getFeaturedJobs(6),
    staleTime: 5 * 60 * 1000,
  });

  // GET /api/projects/featured?count=6 → { success: true, data: ProjectListDto[] }
  const { data: projectsRes, isLoading: projectsLoading } = useQuery({
    queryKey: ["home-featured-projects"],
    queryFn: () => projectService.getFeaturedProjects(6),
    staleTime: 5 * 60 * 1000,
  });

  // GET /api/companies?page=1&pageSize=6 → { Success: true, Data: CompanyDto[] }
  const { data: companiesRes, isLoading: companiesLoading } = useQuery({
    queryKey: ["home-featured-companies"],
    queryFn: () => companyService.searchCompanies({ page: 1, pageSize: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const jobs = extractArray(jobsRes);
  const projects = extractArray(projectsRes);
  const companies = extractArray(companiesRes);

  function handleSearch(e) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (keyword.trim()) p.set("keyword", keyword.trim());
    if (location.trim()) p.set("location", location.trim());
    navigate(`/job-search?${p.toString()}`);
  }

  return (
    <MainLayout>
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 pt-20 pb-32">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-400 opacity-20 rounded-full blur-3xl" />
          <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-300 opacity-20 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Sparkles size={13} /> Nền tảng tuyển dụng &amp; kết nối nhân tài
            Việt Nam
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
            Tìm việc làm mơ ước
            <br />
            <span className="text-blue-200">hoặc đồng đội lý tưởng</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Kết nối ứng viên với nhà tuyển dụng hàng đầu, hoặc tìm đồng đội cho
            startup, freelance &amp; side project của bạn.
          </p>
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2"
          >
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <Search size={18} className="text-gray-400 flex-shrink-0" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tên công việc, kỹ năng, từ khóa..."
                className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400"
              />
            </div>
            <div className="hidden sm:block w-px bg-gray-200 my-2" />
            <div className="flex items-center gap-3 px-4 py-2">
              <MapPin size={18} className="text-gray-400 flex-shrink-0" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Địa điểm (Hà Nội, TP.HCM...)"
                className="w-44 text-sm text-gray-700 outline-none placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition shadow-md whitespace-nowrap"
            >
              <Search size={16} /> Tìm kiếm
            </button>
          </form>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="text-blue-200 text-xs">Tìm kiếm phổ biến:</span>
            {[
              "Lập trình viên",
              "Marketing",
              "Designer",
              "Data Analyst",
              "Product Manager",
            ].map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() =>
                  navigate(`/job-search?keyword=${encodeURIComponent(kw)}`)
                }
                className="text-xs bg-white/15 hover:bg-white/25 text-white px-3 py-1 rounded-full transition border border-white/20"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS ══════════════════ */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
            <StatCard
              icon={Briefcase}
              value="1.200+"
              label="Việc làm đang tuyển"
              gradient="from-blue-500 to-indigo-500"
            />
            <StatCard
              icon={Building2}
              value="350+"
              label="Công ty uy tín"
              gradient="from-indigo-500 to-violet-500"
            />
            <StatCard
              icon={Users}
              value="8.500+"
              label="Ứng viên đã đăng ký"
              gradient="from-violet-500 to-purple-500"
            />
            <StatCard
              icon={Rocket}
              value="420+"
              label="Dự án tìm đồng đội"
              gradient="from-cyan-500 to-blue-500"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURED JOBS ══════════════════ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-blue-500" />
                <span className="text-sm font-semibold text-blue-500 uppercase tracking-wider">
                  Nổi bật
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800">
                Việc làm hấp dẫn
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Cơ hội nghề nghiệp được cập nhật mới nhất
              </p>
            </div>
            <Link
              to="/job-search"
              className="hidden sm:flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all"
            >
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>
          {jobsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có việc làm nào</p>
              <Link
                to="/job-search"
                className="text-sm text-blue-500 mt-2 inline-block hover:underline"
              >
                Xem tất cả việc làm →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job, idx) => (
                <HomeJobCard
                  key={job.id ?? job.Id ?? idx}
                  job={job}
                  idx={idx}
                />
              ))}
            </div>
          )}
          <div className="mt-6 sm:hidden text-center">
            <Link
              to="/job-search"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm"
            >
              Xem tất cả việc làm <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      {user?.role === "user" && <HomeRecommendationSection />}
      {/* ══════════════════ FEATURED PROJECTS ══════════════════ */}
      <section className="bg-gradient-to-br from-violet-50 via-white to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-violet-500" />
                <span className="text-sm font-semibold text-violet-500 uppercase tracking-wider">
                  Tìm đồng đội
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800">
                Dự án đang tìm người
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Startup, freelance, nghiên cứu &amp; nhiều hơn nữa
              </p>
            </div>
            <Link
              to="/projects"
              className="hidden sm:flex items-center gap-2 text-violet-600 font-semibold text-sm hover:gap-3 transition-all"
            >
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>
          {projectsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Rocket size={40} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có dự án nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p, idx) => (
                <HomeProjectCard key={p.id ?? idx} project={p} idx={idx} />
              ))}
            </div>
          )}
          <div className="mt-6 sm:hidden text-center">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-violet-600 font-semibold text-sm"
            >
              Xem tất cả dự án <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURED COMPANIES ══════════════════ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star size={18} className="text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-600 uppercase tracking-wider">
                  Đối tác
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800">
                Công ty hàng đầu
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Nhà tuyển dụng uy tín, môi trường làm việc tốt
              </p>
            </div>
            <Link
              to="/companies"
              className="hidden sm:flex items-center gap-2 text-gray-600 font-semibold text-sm hover:gap-3 transition-all"
            >
              Xem tất cả <ArrowRight size={16} />
            </Link>
          </div>
          {companiesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CompanySkeleton key={i} />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Building2 size={40} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có công ty nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {companies.map((c, idx) => (
                <HomeCompanyCard key={c.id} company={c} idx={idx} />
              ))}
            </div>
          )}
          <div className="mt-6 sm:hidden text-center">
            <Link
              to="/companies"
              className="inline-flex items-center gap-2 text-gray-600 font-semibold text-sm"
            >
              Xem tất cả công ty <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA: CHƯA ĐĂNG NHẬP ══════════════════ */}
      {!user && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-10 sm:p-14 text-center shadow-2xl">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white opacity-5 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white opacity-5 rounded-full" />
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                />
              </div>
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full mb-5">
                  <Heart size={12} /> Tham gia cộng đồng hơn 8.500 người
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                  Sẵn sàng bắt đầu
                  <br />
                  hành trình của bạn?
                </h2>
                <p className="text-blue-100 text-base max-w-xl mx-auto mb-8 leading-relaxed">
                  Đăng ký miễn phí để tìm việc làm mơ ước, kết nối với đồng đội
                  tiềm năng và xây dựng sự nghiệp của bạn.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5">
                  <Link
                    to="/register"
                    className="flex items-center gap-2 bg-white text-indigo-600 font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-blue-50 transition shadow-lg whitespace-nowrap"
                  >
                    <Users size={17} /> Đăng ký tìm việc
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition whitespace-nowrap"
                  >
                    <Building2 size={17} /> Đăng ký tuyển dụng
                  </Link>
                </div>
                <p className="text-blue-200 text-sm">
                  Đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    className="text-white font-bold underline underline-offset-2 hover:no-underline"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ CTA: ĐÃ ĐĂNG NHẬP ══════════════════ */}
      {user && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 rounded-3xl p-10 sm:p-14 text-center shadow-2xl">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-white opacity-5 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white opacity-5 rounded-full" />
              </div>
              <div className="relative">
                <p className="text-indigo-200 text-sm mb-2">
                  Xin chào,{" "}
                  <span className="font-semibold text-white">
                    {user.fullName}
                  </span>{" "}
                  👋
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                  {user.role === "company"
                    ? "Tìm được ứng viên phù hợp chưa?"
                    : "Khám phá cơ hội mới hôm nay!"}
                </h2>
                <p className="text-indigo-100 text-base max-w-xl mx-auto mb-8 leading-relaxed">
                  {user.role === "company"
                    ? "Đăng tin tuyển dụng, quản lý ứng viên và xây dựng đội nhóm mơ ước."
                    : "Hàng nghìn việc làm và dự án đang chờ bạn khám phá."}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {user.role === "company" ? (
                    <>
                      <Link
                        to="/company/jobs/new"
                        className="flex items-center gap-2 bg-white text-indigo-600 font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition shadow-lg whitespace-nowrap"
                      >
                        <Briefcase size={17} /> Đăng tin tuyển dụng
                      </Link>
                      <Link
                        to="/company/applications"
                        className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition whitespace-nowrap"
                      >
                        <Users size={17} /> Xem ứng viên
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/job-search"
                        className="flex items-center gap-2 bg-white text-indigo-600 font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition shadow-lg whitespace-nowrap"
                      >
                        <Briefcase size={17} /> Tìm việc ngay
                      </Link>
                      <Link
                        to="/projects"
                        className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition whitespace-nowrap"
                      >
                        <Rocket size={17} /> Khám phá dự án
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
