import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Briefcase,
  Rocket,
  TrendingUp,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  MapPin,
  Clock,
  DollarSign,
  Users,
  BookOpen,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { recommendationService } from "../../services/recommendationService";
import { formatTimeAgo, formatSalary } from "../../utils/helpers";

// ─── Match level config ───────────────────────────────────────────────────────
const MATCH_LEVEL = {
  Excellent: {
    label: "Xuất sắc",
    color: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  Good: {
    label: "Tốt",
    color: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  Fair: {
    label: "Khá",
    color: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-500",
  },
  Poor: {
    label: "Thấp",
    color: "bg-gray-100 text-gray-500",
    dot: "bg-gray-400",
  },
};

const PROJECT_TYPE_LABEL = {
  startup: "Startup",
  freelance: "Freelance",
  research: "Nghiên cứu",
  social: "Xã hội",
  side_project: "Side Project",
  other: "Khác",
};

function MatchBadge({ score, level }) {
  const info = MATCH_LEVEL[level] || MATCH_LEVEL.Fair;
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${info.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
      {score}% · {info.label}
    </div>
  );
}

function MatchBar({ score }) {
  const color =
    score >= 80
      ? "bg-green-500"
      : score >= 60
        ? "bg-blue-500"
        : score >= 40
          ? "bg-yellow-500"
          : "bg-gray-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">
        {score}%
      </span>
    </div>
  );
}

// ─── Job Recommendation Card ──────────────────────────────────────────────────
function JobRecommendCard({ job }) {
  const API_BASE = "http://localhost:5024";
  const hasSkills = job.totalSkillsRequired > 0;
  const matchedCount =
    job.matchedSkills?.filter((s) => s.isMatched).length || 0;

  return (
    <Link
      to={`/jobs/${job.jobId}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all p-5 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
          {job.companyLogo ? (
            <img
              src={`${API_BASE}${job.companyLogo}`}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Briefcase size={18} className="text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">{job.companyName}</p>
          <h3 className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-2">
            {job.jobTitle}
          </h3>
        </div>
        <MatchBadge score={job.matchScore} level={job.matchLevel} />
      </div>

      {/* Match bar */}
      <MatchBar score={job.matchScore} />

      {/* Info */}
      <div className="flex flex-wrap gap-2">
        {job.location && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={11} />
            {job.location}
          </span>
        )}
        {job.type && (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
            {job.type}
          </span>
        )}
        {(job.salaryMin || job.salaryMax) && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <DollarSign size={11} />
            {formatSalary(job.salaryMin, job.salaryMax)}
          </span>
        )}
      </div>

      {/* Match reasons hoặc thông báo không có kỹ năng yêu cầu */}
      {hasSkills ? (
        <>
          {job.matchReasons?.length > 0 && (
            <div className="space-y-1">
              {job.matchReasons.slice(0, 2).map((r, i) => (
                <p
                  key={i}
                  className="text-xs text-gray-500 flex items-start gap-1.5"
                >
                  <CheckCircle
                    size={11}
                    className="text-green-500 shrink-0 mt-0.5"
                  />
                  {r}
                </p>
              ))}
            </div>
          )}
          {/* Matched skills */}
          {job.matchedSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {job.matchedSkills.slice(0, 4).map((s, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.isMatched
                      ? "bg-green-100 text-green-700"
                      : "bg-red-50 text-red-400 line-through"
                  }`}
                >
                  {s.skillName}
                </span>
              ))}
              {job.matchedSkills.length > 4 && (
                <span className="text-xs text-gray-400">
                  +{job.matchedSkills.length - 4}
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-400 italic flex items-center gap-1">
          <AlertCircle size={11} className="text-gray-300" />
          Không yêu cầu kỹ năng cụ thể — phù hợp dựa trên kinh nghiệm &amp; địa
          điểm
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={11} />
          {formatTimeAgo(job.createdAt)}
        </span>
        <span className="text-xs text-blue-500 font-medium group-hover:gap-2 flex items-center gap-1 transition-all">
          Xem chi tiết <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}

// ─── Project Recommendation Card ─────────────────────────────────────────────
function ProjectRecommendCard({ project }) {
  const hasSkills = project.matchedSkills?.length > 0;

  return (
    <Link
      to={`/projects/${project.projectId}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all p-5 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shrink-0">
          <Rocket size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {project.ownerName && (
            <p className="text-xs text-gray-400 truncate">
              bởi {project.ownerName}
            </p>
          )}
          <h3 className="font-semibold text-gray-800 text-sm group-hover:text-violet-600 transition-colors line-clamp-2">
            {project.projectTitle}
          </h3>
        </div>
        <MatchBadge score={project.matchScore} level={project.matchLevel} />
      </div>

      {/* Match bar */}
      <MatchBar score={project.matchScore} />

      {/* Info */}
      <div className="flex flex-wrap gap-2">
        {project.type && (
          <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-xs rounded-full font-medium">
            {PROJECT_TYPE_LABEL[project.type] || project.type}
          </span>
        )}
        {project.locationType && (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
            {project.locationType === "remote"
              ? "Remote"
              : project.locationType === "hybrid"
                ? "Hybrid"
                : "Tại chỗ"}
          </span>
        )}
        {project.openPositions > 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <Users size={11} />
            {project.openPositions} vị trí trống
          </span>
        )}
      </div>

      {/* Match reasons / skills */}
      {hasSkills ? (
        <>
          {project.matchReasons?.length > 0 && (
            <div className="space-y-1">
              {project.matchReasons.slice(0, 2).map((r, i) => (
                <p
                  key={i}
                  className="text-xs text-gray-500 flex items-start gap-1.5"
                >
                  <CheckCircle
                    size={11}
                    className="text-green-500 shrink-0 mt-0.5"
                  />
                  {r}
                </p>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {project.matchedSkills.slice(0, 4).map((s, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  s.isMatched
                    ? "bg-green-100 text-green-700"
                    : "bg-red-50 text-red-400 line-through"
                }`}
              >
                {s.skillName}
              </span>
            ))}
            {project.matchedSkills.length > 4 && (
              <span className="text-xs text-gray-400">
                +{project.matchedSkills.length - 4}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-400 italic flex items-center gap-1">
          <AlertCircle size={11} className="text-gray-300" />
          Không yêu cầu kỹ năng cụ thể
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={11} />
          {formatTimeAgo(project.createdAt)}
        </span>
        <span className="text-xs text-violet-500 font-medium group-hover:gap-2 flex items-center gap-1 transition-all">
          Xem chi tiết <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────
function StatsSection({ stats }) {
  if (!stats) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
      <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-blue-500" /> Tổng quan phù hợp
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          {
            label: "Tổng gợi ý",
            value: stats.totalJobsRecommended || 0,
            color: "text-blue-600",
          },
          {
            label: "Xuất sắc (≥80%)",
            value: stats.excellentMatches || 0,
            color: "text-green-600",
          },
          {
            label: "Tốt (60-79%)",
            value: stats.goodMatches || 0,
            color: "text-blue-500",
          },
          {
            label: "Khá (40-59%)",
            value: stats.fairMatches || 0,
            color: "text-yellow-600",
          },
        ].map((s) => (
          <div key={s.label} className="text-center p-3 bg-gray-50 rounded-xl">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stats.topMatchedSkills?.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Star size={14} className="text-yellow-500" /> Kỹ năng mạnh nhất
              của bạn
            </p>
            <div className="flex flex-wrap gap-1.5">
              {stats.topMatchedSkills.map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                >
                  ✓ {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {stats.missingSkills?.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <BookOpen size={14} className="text-orange-500" /> Nên học thêm để
              tăng % match
            </p>
            <div className="flex flex-wrap gap-1.5">
              {stats.missingSkills.map((s, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full"
                >
                  + {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const { data: jobsRes, isLoading: jobsLoading } = useQuery({
    queryKey: ["rec-jobs"],
    queryFn: () =>
      recommendationService.getRecommendedJobs(12).then((r) => r.data),
  });
  const { data: projectsRes, isLoading: projectsLoading } = useQuery({
    queryKey: ["rec-projects"],
    queryFn: () =>
      recommendationService.getRecommendedProjects(12).then((r) => r.data),
  });
  const { data: statsRes } = useQuery({
    queryKey: ["rec-stats"],
    queryFn: () => recommendationService.getStats().then((r) => r.data.data),
  });

  const jobs = jobsRes?.data || [];
  const projects = projectsRes?.data || [];
  const message = jobsRes?.message || "";

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-4 py-1.5 rounded-full text-sm font-semibold text-blue-700 mb-3">
            <Sparkles size={15} /> Được cá nhân hóa cho bạn
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            Gợi ý dành riêng cho bạn
          </h1>
          <p className="text-gray-500">
            Dựa trên kỹ năng, kinh nghiệm và mức lương kỳ vọng của bạn
          </p>
        </div>

        {/* Stats */}
        <StatsSection stats={statsRes} />

        {/* No data warning */}
        {!jobsLoading && jobs.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-orange-500 shrink-0 mt-0.5"
            />
            <div>
              <p className="font-semibold text-orange-700">
                Chưa có gợi ý phù hợp
              </p>
              <p className="text-sm text-orange-600 mt-0.5">
                {message ||
                  "Hãy cập nhật kỹ năng trong hồ sơ để nhận gợi ý chính xác hơn."}
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-orange-700 hover:underline"
              >
                Cập nhật hồ sơ ngay <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Recommended Jobs */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Briefcase size={18} className="text-blue-500" />
                <span className="text-sm font-semibold text-blue-500 uppercase tracking-wider">
                  Việc làm
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-800">
                Việc làm phù hợp với bạn
                {jobs.length > 0 && (
                  <span className="text-gray-400 font-normal text-base ml-2">
                    ({jobs.length})
                  </span>
                )}
              </h2>
            </div>
            <Link
              to="/job-search"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Xem tất cả <ArrowRight size={15} />
            </Link>
          </div>

          {jobsLoading ? (
            <LoadingSpinner />
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-400">
              <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có gợi ý việc làm</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <JobRecommendCard key={job.jobId} job={job} />
              ))}
            </div>
          )}
        </section>

        {/* Recommended Projects */}
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Rocket size={18} className="text-violet-500" />
                <span className="text-sm font-semibold text-violet-500 uppercase tracking-wider">
                  Dự án
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-800">
                Dự án phù hợp với bạn
                {projects.length > 0 && (
                  <span className="text-gray-400 font-normal text-base ml-2">
                    ({projects.length})
                  </span>
                )}
              </h2>
            </div>
            <Link
              to="/projects"
              className="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              Xem tất cả <ArrowRight size={15} />
            </Link>
          </div>

          {projectsLoading ? (
            <LoadingSpinner />
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl text-gray-400">
              <Rocket size={40} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có gợi ý dự án</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <ProjectRecommendCard key={p.projectId} project={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
