import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  Briefcase,
  ArrowRight,
  Bookmark,
  Clock,
  MapPin,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { jobService } from "../../services/jobService";
import { formatSalary, formatTimeAgo } from "../../utils/helpers";
import toast from "react-hot-toast";

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

const GRADIENTS = [
  "from-blue-400 to-indigo-500",
  "from-violet-400 to-purple-500",
  "from-cyan-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-pink-500",
];

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

// GET /api/jobs/saved
// Response: { Success: true, Data: JobDto[], Page, PageSize }
// JobDto: { id, companyId, title, type, level, salaryMin, salaryMax, salaryCurrency,
//            location, locationType, deadline, status, views, createdAt,
//            company{id,name,logo,industry,verificationStatus}, skills[], totalApplications }
function extractSavedJobs(res) {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d.Data)) return d.Data; // { Success, Data: [] }
  if (Array.isArray(d.data)) return d.data; // { success, data: [] }
  if (Array.isArray(d)) return d;
  return [];
}

function SavedJobCard({ job, idx, onUnsave, isUnsaving }) {
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

  const title = job.title ?? job.Title ?? "(Không có tiêu đề)";
  const type = job.type ?? job.Type;
  const locationType = job.locationType ?? job.LocationType;
  const location = job.location ?? job.Location;
  const salaryMin = job.salaryMin ?? job.SalaryMin;
  const salaryMax = job.salaryMax ?? job.SalaryMax;
  const currency = job.salaryCurrency ?? job.SalaryCurrency ?? "VND";
  const createdAt = job.createdAt ?? job.CreatedAt;
  const deadline = job.deadline ?? job.Deadline;
  const id = job.id ?? job.Id;

  const isExpired = deadline && new Date(deadline) < new Date();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50 flex items-center justify-center">
          {companyLogo ? (
            <img
              src={imgUrl(companyLogo)}
              alt={companyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${grad(idx)} text-white text-sm font-bold`}
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
          <Link
            to={`/jobs/${id}`}
            className="font-semibold text-gray-800 text-sm leading-snug hover:text-blue-600 transition-colors line-clamp-2"
          >
            {title}
          </Link>
        </div>
        {/* Unsave button */}
        <button
          onClick={() => onUnsave(id)}
          disabled={isUnsaving}
          title="Bỏ lưu"
          className="flex-shrink-0 p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <Heart size={18} className="fill-red-400" />
        </button>
      </div>

      {/* Salary */}
      {(salaryMin || salaryMax) && (
        <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg w-fit">
          {formatSalary(salaryMin, salaryMax, currency)}
        </div>
      )}

      {/* Tags */}
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
        {isExpired && (
          <span className="text-xs bg-red-50 text-red-400 px-2.5 py-1 rounded-full font-medium">
            Hết hạn
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={11} />
          {createdAt ? formatTimeAgo(createdAt) : "Mới đăng"}
        </span>
        <Link
          to={`/jobs/${id}`}
          className="flex items-center gap-1 text-xs text-blue-500 font-medium hover:gap-2 transition-all"
        >
          Xem & ứng tuyển <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

export default function SavedJobsPage() {
  const queryClient = useQueryClient();

  const { data: savedRes, isLoading } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => jobService.getSavedJobs(),
  });

  const unsaveMutation = useMutation({
    mutationFn: (jobId) => jobService.unsaveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries(["saved-jobs"]);
      toast.success("Đã bỏ lưu việc làm");
    },
    onError: () => toast.error("Thao tác thất bại, thử lại nhé"),
  });

  const savedJobs = extractSavedJobs(savedRes);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bookmark className="text-blue-500" size={24} />
              Việc làm đã lưu
            </h1>
            {!isLoading && (
              <p className="text-gray-500 text-sm mt-1">
                {savedJobs.length > 0
                  ? `${savedJobs.length} công việc bạn đang quan tâm`
                  : "Chưa có công việc nào được lưu"}
              </p>
            )}
          </div>
          <Link
            to="/job-search"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
          >
            <Briefcase size={16} />
            Tìm thêm việc
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner />
        ) : savedJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Heart size={28} className="text-gray-200" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">
              Chưa có việc làm nào được lưu
            </h3>
            <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
              Lưu lại những công việc phù hợp để xem lại và ứng tuyển sau
            </p>
            <Link
              to="/job-search"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-md text-sm"
            >
              <Briefcase size={16} />
              Khám phá việc làm ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedJobs.map((job, idx) => (
              <SavedJobCard
                key={job.id ?? job.Id ?? idx}
                job={job}
                idx={idx}
                onUnsave={(id) => unsaveMutation.mutate(id)}
                isUnsaving={unsaveMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
