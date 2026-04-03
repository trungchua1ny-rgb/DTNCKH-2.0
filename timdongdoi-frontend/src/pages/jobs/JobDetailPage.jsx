import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  Users,
  Building2,
  Globe,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  CalendarDays,
  Flag,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ReportModal from "../../components/common/ReportModal";
import { jobService } from "../../services/jobService";
import { useAuth } from "../../contexts/AuthContext";
import { formatSalary, formatDate, formatTimeAgo } from "../../utils/helpers";
import { JOB_TYPES, JOB_LEVELS } from "../../utils/constants";

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); // ← thêm

  // Fetch job detail
  const { data: jobData, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => jobService.getJobById(id).then((r) => r.data.data),
  });

  // Fetch saved jobs
  const { data: savedData } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => jobService.getSavedJobs().then((r) => r.data.data),
    enabled: !!user && user.role === "user",
  });

  const isSaved = Array.isArray(savedData)
    ? savedData.some((j) => (j.jobId || j.id) === Number(id))
    : false;

  const saveMutation = useMutation({
    mutationFn: () =>
      isSaved ? jobService.unsaveJob(id) : jobService.saveJob(id),
    onSuccess: () => queryClient.invalidateQueries(["saved-jobs"]),
  });

  if (isLoading)
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  if (!jobData)
    return (
      <MainLayout>
        <div className="text-center py-20 text-gray-500">
          Không tìm thấy việc làm
        </div>
      </MainLayout>
    );

  const job = jobData;
  const jobType =
    JOB_TYPES.find((t) => t.value === job.type)?.label || job.type;
  const jobLevel =
    JOB_LEVELS.find((l) => l.value === job.level)?.label || job.level;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== Main content ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                  {job.companyLogo ? (
                    <img
                      src={`http://localhost:5024${job.companyLogo}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 size={28} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-gray-800 mb-1">
                    {job.title}
                  </h1>
                  <p className="text-blue-600 font-medium">{job.companyName}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {jobType && <Tag color="blue">{jobType}</Tag>}
                {jobLevel && <Tag color="purple">{jobLevel}</Tag>}
                {job.locationType && (
                  <Tag color="green">
                    {job.locationType === "remote"
                      ? "Remote"
                      : job.locationType === "hybrid"
                        ? "Hybrid"
                        : "Tại VP"}
                  </Tag>
                )}
                {job.status === "open" && <Tag color="green">Đang tuyển</Tag>}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={<DollarSign size={16} />} label="Mức lương">
                  {formatSalary(
                    job.salaryMin,
                    job.salaryMax,
                    job.salaryCurrency,
                  )}
                </InfoItem>
                <InfoItem icon={<MapPin size={16} />} label="Địa điểm">
                  {job.location || "Không xác định"}
                </InfoItem>
                <InfoItem icon={<Users size={16} />} label="Số lượng">
                  {job.positions || 1} vị trí
                </InfoItem>
                <InfoItem icon={<CalendarDays size={16} />} label="Hạn nộp">
                  {job.deadline ? formatDate(job.deadline) : "Không giới hạn"}
                </InfoItem>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-3">
                Mô tả công việc
              </h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-3">
                  Yêu cầu công việc
                </h2>
                <div className="text-gray-600 text-sm whitespace-pre-line">
                  {job.requirements}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-3">
                  Quyền lợi
                </h2>
                <div className="text-gray-600 text-sm whitespace-pre-line">
                  {job.benefits}
                </div>
              </div>
            )}

            {/* Skills */}
            {job.skills?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-3">
                  Kỹ năng yêu cầu
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s) => (
                    <span
                      key={s.skillId}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium
                        ${s.isRequired ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {s.skillName}
                      {s.isRequired && <span className="ml-1 text-xs">*</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== Sidebar ===== */}
          <div className="space-y-4">
            {/* Apply card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400">Đăng</p>
                  <p className="text-sm font-medium text-gray-600">
                    {formatTimeAgo(job.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Lượt xem</p>
                  <p className="text-sm font-medium text-gray-600">
                    {job.views || 0}
                  </p>
                </div>
              </div>

              {user?.role === "user" && job.status === "open" && (
                <>
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md mb-3"
                  >
                    Ứng tuyển ngay
                  </button>
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className={`w-full py-2.5 border-2 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2
                      ${isSaved ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={18} />
                    ) : (
                      <Bookmark size={18} />
                    )}
                    {isSaved ? "Đã lưu" : "Lưu việc làm"}
                  </button>
                </>
              )}

              {!user && (
                <Link
                  to="/login"
                  className="block w-full py-2.5 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md"
                >
                  Đăng nhập để ứng tuyển
                </Link>
              )}

              {job.status !== "open" && user?.role === "user" && (
                <div className="text-center py-3 bg-gray-50 rounded-xl text-gray-500 text-sm font-medium">
                  Đã ngừng tuyển dụng
                </div>
              )}

              {/* ✅ Nút báo cáo — chỉ hiện khi đã đăng nhập */}
              {user && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full mt-3 py-2 text-xs text-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Flag size={13} /> Báo cáo tin tuyển dụng
                </button>
              )}
            </div>

            {/* Company info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Về công ty</h3>
              {job.companyLogo && (
                <img
                  src={`http://localhost:5024${job.companyLogo}`}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover mb-3"
                />
              )}
              <p className="font-medium text-gray-700 mb-1">
                {job.companyName}
              </p>
              {job.companyIndustry && (
                <p className="text-sm text-gray-500 mb-1">
                  {job.companyIndustry}
                </p>
              )}
              {job.companyWebsite && (
                <a
                  href={job.companyWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Globe size={14} /> Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <ApplyModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            queryClient.invalidateQueries(["my-applications"]);
          }}
        />
      )}

      {/* ✅ Report Modal */}
      {showReportModal && (
        <ReportModal
          type="job"
          targetId={job.id}
          targetName={job.title}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </MainLayout>
  );
}

// ==================== Apply Modal ====================
function ApplyModal({ job, onClose, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvFile) {
      setError("Vui lòng tải lên CV của bạn");
      return;
    }

    const formData = new FormData();
    formData.append("jobId", job.id);
    formData.append("coverLetter", coverLetter);
    formData.append("cvFile", cvFile);

    try {
      setLoading(true);
      setError("");
      await jobService.applyJob(job.id, formData);
      setSuccess(true);
      setTimeout(onSuccess, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Ứng tuyển thất bại, vui lòng thử lại",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Ứng tuyển: {job.title}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{job.companyName}</p>
        </div>

        {success ? (
          <div className="p-10 text-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">Ứng tuyển thành công!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* CV Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                CV của bạn <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors
                ${cvFile ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-blue-300"}`}
              >
                {cvFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 size={20} />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {cvFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCvFile(null)}
                      className="text-gray-400 hover:text-gray-600 text-xs underline ml-1"
                    >
                      Xóa
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-2">
                      PDF, DOC, DOCX (tối đa 5MB)
                    </p>
                    <label className="cursor-pointer px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                      Chọn file CV
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => setCvFile(e.target.files[0])}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Cover letter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Thư giới thiệu (tùy chọn)
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Giới thiệu bản thân và lý do bạn phù hợp với vị trí này..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Đang gửi..." : "Gửi ứng tuyển"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ==================== Helpers ====================
function Tag({ color, children }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}
    >
      {children}
    </span>
  );
}

function InfoItem({ icon, label, children }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
      <span className="text-blue-500 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-700">{children}</p>
      </div>
    </div>
  );
}
