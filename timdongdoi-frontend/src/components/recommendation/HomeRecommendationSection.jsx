/**
 * HomeRecommendationSection
 * Component nhúng trực tiếp vào HomePage — KHÔNG có MainLayout
 * Hiển thị tối đa 3 job + 3 project gợi ý cho user đã đăng nhập
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Briefcase,
  Rocket,
  ArrowRight,
  MapPin,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { recommendationService } from "../../services/recommendationService";
import { formatTimeAgo, formatSalary } from "../../utils/helpers";

const API_BASE = "http://localhost:5024";

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
  open_source: "Open Source",
  other: "Khác",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MatchBadge({ score, level }) {
  const info = MATCH_LEVEL[level] || MATCH_LEVEL.Fair;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${info.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
      {score}%
    </span>
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
          : "bg-gray-300";
  return (
    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
      <div className="h-1 bg-gray-100 rounded mb-3" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
    </div>
  );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
function HomeRecJobCard({ job }) {
  return (
    <Link
      to={`/jobs/${job.jobId}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all p-5 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
          {job.companyLogo ? (
            <img
              src={`${API_BASE}${job.companyLogo}`}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Briefcase size={16} className="text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">{job.companyName}</p>
          <h3 className="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
            {job.jobTitle}
          </h3>
        </div>
        <MatchBadge score={job.matchScore} level={job.matchLevel} />
      </div>

      <MatchBar score={job.matchScore} />

      <div className="flex flex-wrap gap-1.5">
        {job.location && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={10} />
            {job.location}
          </span>
        )}
        {job.type && (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
            {job.type}
          </span>
        )}
      </div>

      {job.matchReasons?.length > 0 && (
        <p className="text-xs text-gray-500 flex items-start gap-1">
          <CheckCircle size={11} className="text-green-500 shrink-0 mt-0.5" />
          {job.matchReasons[0]}
        </p>
      )}

      {job.matchedSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.matchedSkills.slice(0, 3).map((s, i) => (
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
          {job.matchedSkills.length > 3 && (
            <span className="text-xs text-gray-400">
              +{job.matchedSkills.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          {formatTimeAgo(job.createdAt)}
        </span>
        <span className="text-xs text-blue-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Xem <ArrowRight size={11} />
        </span>
      </div>
    </Link>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function HomeRecProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.projectId}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all p-5 flex flex-col gap-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shrink-0">
          <Rocket size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {project.ownerName && (
            <p className="text-xs text-gray-400 truncate">
              bởi {project.ownerName}
            </p>
          )}
          <h3 className="font-semibold text-gray-800 text-sm group-hover:text-violet-600 transition-colors line-clamp-1">
            {project.projectTitle}
          </h3>
        </div>
        <MatchBadge score={project.matchScore} level={project.matchLevel} />
      </div>

      <MatchBar score={project.matchScore} />

      <div className="flex flex-wrap gap-1.5">
        {project.type && (
          <span className="px-2 py-0.5 bg-violet-50 text-violet-600 text-xs rounded-full font-medium">
            {PROJECT_TYPE_LABEL[project.type] || project.type}
          </span>
        )}
        {project.openPositions > 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <Users size={10} />
            {project.openPositions} vị trí
          </span>
        )}
      </div>

      {project.matchedSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.matchedSkills.slice(0, 3).map((s, i) => (
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
          {project.matchedSkills.length > 3 && (
            <span className="text-xs text-gray-400">
              +{project.matchedSkills.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          {formatTimeAgo(project.createdAt)}
        </span>
        <span className="text-xs text-violet-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Xem <ArrowRight size={11} />
        </span>
      </div>
    </Link>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function HomeRecommendationSection() {
  const { data: jobsRes, isLoading: jobsLoading } = useQuery({
    queryKey: ["home-rec-jobs"],
    queryFn: () =>
      recommendationService.getRecommendedJobs(3).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: projectsRes, isLoading: projectsLoading } = useQuery({
    queryKey: ["home-rec-projects"],
    queryFn: () =>
      recommendationService.getRecommendedProjects(3).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const jobs = jobsRes?.data || [];
  const projects = projectsRes?.data || [];

  // Không render gì nếu cả 2 đều empty và không đang loading
  if (
    !jobsLoading &&
    !projectsLoading &&
    jobs.length === 0 &&
    projects.length === 0
  ) {
    return null;
  }

  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-blue-500" />
              <span className="text-sm font-semibold text-blue-500 uppercase tracking-wider">
                Dành riêng cho bạn
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800">
              Gợi ý phù hợp với bạn
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Dựa trên kỹ năng và kinh nghiệm trong hồ sơ của bạn
            </p>
          </div>
          <Link
            to="/recommendations"
            className="hidden sm:flex items-center gap-2 text-blue-600 font-semibold text-sm hover:gap-3 transition-all"
          >
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>

        {/* Jobs */}
        {(jobsLoading || jobs.length > 0) && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={15} className="text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-700">
                Việc làm phù hợp
              </h3>
            </div>
            {jobsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <HomeRecJobCard key={job.jobId} job={job} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projects */}
        {(projectsLoading || projects.length > 0) && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Rocket size={15} className="text-violet-500" />
              <h3 className="text-sm font-semibold text-gray-700">
                Dự án phù hợp
              </h3>
            </div>
            {projectsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((p) => (
                  <HomeRecProjectCard key={p.projectId} project={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile: link xem tất cả */}
        <div className="mt-6 sm:hidden text-center">
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm"
          >
            Xem tất cả gợi ý <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
