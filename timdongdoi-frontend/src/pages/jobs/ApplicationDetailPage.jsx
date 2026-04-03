import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Video,
  ExternalLink,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { jobService } from "../../services/jobService";
import { testService } from "../../services/testService";
import { formatDate } from "../../utils/helpers";

// ── Test status config ─────────────────────────────────────────────────────────
const TEST_STATUS = {
  pending: {
    label: "Chưa làm",
    color: "bg-orange-100 text-orange-700",
    icon: AlertTriangle,
  },
  assigned: {
    label: "Chưa làm",
    color: "bg-orange-100 text-orange-700",
    icon: AlertTriangle,
  },
  in_progress: {
    label: "Đang làm",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
};

const INTERVIEW_STATUS = {
  scheduled: { label: "Đã lên lịch", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-600" },
};

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Tests Section ──────────────────────────────────────────────────────────────
function TestsSection({ applicationId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["app-tests", applicationId],
    queryFn: () =>
      testService.getMyApplicationTests(applicationId).then((r) => r.data.data),
  });

  const tests = data || [];
  if (isLoading)
    return <div className="text-sm text-gray-400">Đang tải bài test...</div>;
  if (tests.length === 0)
    return (
      <p className="text-sm text-gray-400 italic">
        Không có bài test nào cho đơn này.
      </p>
    );

  return (
    <div className="space-y-3">
      {tests.map((t) => {
        const statusInfo =
          TEST_STATUS[t.status?.toLowerCase()] || TEST_STATUS.pending;
        const StatusIcon = statusInfo.icon;
        const canTake =
          t.status === "pending" ||
          t.status === "assigned" ||
          t.status === "in_progress";
        const completed = t.status === "completed";

        return (
          <div
            key={t.id}
            className={`rounded-2xl border p-4 ${
              canTake
                ? "border-orange-200 bg-orange-50"
                : completed && t.passed
                  ? "border-green-200 bg-green-50"
                  : completed && !t.passed
                    ? "border-red-200 bg-red-50"
                    : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{t.testTitle}</p>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}
                  >
                    <StatusIcon size={10} />
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {t.durationMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {t.durationMinutes} phút
                    </span>
                  )}
                  {t.passingScore && (
                    <span className="flex items-center gap-1">
                      <Trophy size={11} />
                      Điểm đạt: {t.passingScore}
                    </span>
                  )}
                </div>

                {/* Kết quả nếu đã làm xong */}
                {completed && t.score !== null && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        Điểm của bạn
                      </span>
                      <span
                        className={`text-lg font-extrabold ${t.passed ? "text-green-600" : "text-red-500"}`}
                      >
                        {t.score}
                        {t.passingScore && (
                          <span className="text-sm font-normal text-gray-400">
                            /{t.passingScore}
                          </span>
                        )}
                      </span>
                    </div>
                    {t.passingScore && (
                      <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-200">
                        <div
                          className={`h-full rounded-full ${t.passed ? "bg-green-500" : "bg-red-400"}`}
                          style={{
                            width: `${Math.min((t.score / t.passingScore) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                    <p
                      className={`text-xs font-semibold mt-1 ${t.passed ? "text-green-600" : "text-red-500"}`}
                    >
                      {t.passed ? "✓ Đạt yêu cầu" : "✗ Chưa đạt yêu cầu"}
                    </p>
                  </div>
                )}
              </div>

              {/* Nút làm bài */}
              {canTake && (
                <Link
                  to={`/tests/${t.id}/take`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition shadow-sm shrink-0"
                >
                  <FileText size={14} />
                  {t.status === "in_progress" ? "Tiếp tục" : "Làm bài"}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Interviews Section ─────────────────────────────────────────────────────────
function InterviewsSection({ applicationId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["my-interviews"],
    queryFn: () => testService.getMyInterviews().then((r) => r.data.data),
  });

  // Lọc chỉ lấy phỏng vấn của application này
  const interviews = (data || []).filter(
    (i) => i.applicationId === Number(applicationId),
  );

  if (isLoading)
    return (
      <div className="text-sm text-gray-400">Đang tải lịch phỏng vấn...</div>
    );
  if (interviews.length === 0)
    return (
      <p className="text-sm text-gray-400 italic">
        Chưa có lịch phỏng vấn nào.
      </p>
    );

  return (
    <div className="space-y-3">
      {interviews.map((i) => {
        const statusInfo =
          INTERVIEW_STATUS[i.status] || INTERVIEW_STATUS.scheduled;
        const isUpcoming =
          i.status === "scheduled" && new Date(i.scheduledAt) > new Date();

        return (
          <div
            key={i.id}
            className={`rounded-2xl border p-4 ${
              isUpcoming
                ? "border-blue-200 bg-blue-50"
                : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{i.title}</p>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                {i.description && (
                  <p className="text-sm text-gray-600 mb-2">{i.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatDateTime(i.scheduledAt)}
                  </span>
                  {i.durationMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {i.durationMinutes} phút
                    </span>
                  )}
                </div>
                {i.feedback && (
                  <div className="mt-2 bg-white rounded-lg p-2 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">
                      Nhận xét:
                    </p>
                    <p className="text-sm text-gray-700">{i.feedback}</p>
                  </div>
                )}
              </div>
              {i.meetingLink && isUpcoming && (
                <a
                  href={i.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition shadow-sm shrink-0"
                >
                  <Video size={14} /> Tham gia
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ApplicationDetailPage() {
  const { id } = useParams();

  const { data: response, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: () => jobService.getApplicationById(id).then((r) => r.data),
  });

  const app = response?.data;

  if (isLoading)
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  if (!app)
    return (
      <MainLayout>
        <div className="text-center py-20">Không tìm thấy đơn ứng tuyển</div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/my-applications"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6"
        >
          <ArrowLeft size={16} /> Quay lại danh sách đơn
        </Link>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {app.job?.title}
                </h1>
                <p className="text-blue-600 font-medium mt-1">
                  {app.job?.companyName}
                </p>
              </div>
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${getStatusStyle(app.status)}`}
              >
                {getStatusLabel(app.status)}
              </span>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Thông tin chung */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar size={20} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">
                    Ngày nộp
                  </p>
                  <p className="font-medium">{formatDate(app.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <FileText size={20} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">
                    Loại hồ sơ
                  </p>
                  <p className="font-medium">Online CV</p>
                </div>
              </div>
            </div>

            {/* Thư giới thiệu */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                Thư giới thiệu (Cover Letter)
              </h3>
              <div className="bg-gray-50 rounded-2xl p-6 text-gray-700 leading-relaxed whitespace-pre-line border border-gray-100">
                {app.coverLetter ||
                  "Bạn không đính kèm thư giới thiệu cho đơn này."}
              </div>
            </div>

            {/* CV Đính kèm */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                Tệp đính kèm
              </h3>
              {app.cvFile ? (
                <a
                  href={`http://localhost:5024${app.cvFile}`}
                  target="_blank"
                  className="flex items-center justify-between p-4 bg-white border-2 border-dashed border-blue-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        Curriculum Vitae (CV)
                      </p>
                      <p className="text-xs text-gray-400">
                        Xem hoặc tải xuống bản gốc
                      </p>
                    </div>
                  </div>
                  <Download
                    size={20}
                    className="text-gray-400 group-hover:text-blue-600 mr-2"
                  />
                </a>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  Không có file đính kèm
                </p>
              )}
            </div>

            {/* ✅ Bài test */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText size={18} className="text-orange-500" /> Bài test
              </h3>
              <TestsSection applicationId={id} />
            </div>

            {/* ✅ Lịch phỏng vấn */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" /> Lịch phỏng vấn
              </h3>
              <InterviewsSection applicationId={id} />
            </div>

            {/* Lý do từ chối */}
            {app.status?.toLowerCase() === "rejected" && app.rejectReason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <h3 className="text-base font-bold text-red-700 mb-2 flex items-center gap-2">
                  <XCircle size={16} /> Lý do từ chối
                </h3>
                <p className="text-sm text-red-600">{app.rejectReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function getStatusLabel(status) {
  const labels = {
    pending: "Chờ xem xét",
    reviewing: "Đang xem xét",
    interview: "Phỏng vấn",
    accepted: "Đã chấp nhận",
    rejected: "Từ chối",
  };
  return labels[status?.toLowerCase()] || status;
}

function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "reviewing":
      return "bg-blue-100 text-blue-700";
    case "interview":
      return "bg-indigo-100 text-indigo-700";
    case "accepted":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
