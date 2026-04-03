import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import WriteReviewModal from "../../components/review/WriteReviewModal";
import {
  ArrowLeft,
  Search,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Star,
  Filter,
  Trophy,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getAvatarFallback } from "../../utils/helpers";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { value: "", label: "Tất cả" },
  { value: "pending", label: "Chờ xem" },
  { value: "reviewing", label: "Đang xem xét" },
  { value: "interview", label: "Phỏng vấn" },
  { value: "accepted", label: "Chấp nhận" },
  { value: "rejected", label: "Từ chối" },
];

const STATUS_COLORS = {
  pending: "bg-yellow-50 text-yellow-600",
  reviewing: "bg-blue-50 text-blue-600",
  interview: "bg-indigo-50 text-indigo-600",
  accepted: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-500",
};

const STATUS_LABELS = {
  pending: "Chờ xem",
  reviewing: "Đang xem xét",
  interview: "Phỏng vấn",
  accepted: "Chấp nhận",
  rejected: "Từ chối",
};

// ─── API services ─────────────────────────────────────────────────────────────
const appService = {
  getJobApplications: (jobId, params) =>
    api.get(`/applications/jobs/${jobId}`, { params }),
  getApplicationStats: (jobId) => api.get(`/applications/jobs/${jobId}/stats`),
  updateStatus: (id, status) =>
    api.put(`/applications/${id}/status`, { status }),
  acceptApplication: (id) => api.put(`/applications/${id}/accept`),
  rejectApplication: (id, reason) =>
    api.put(`/applications/${id}/reject`, { reason }),
};

const jobApiService = {
  getMyJobs: () => api.get("/jobs/my", { params: { pageSize: 100 } }),
};

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ open, onClose, onReject, isRejecting }) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <h3 className="text-base font-bold text-gray-900 mb-3">
          Từ chối ứng viên
        </h3>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do từ chối (tùy chọn)..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => onReject(reason)}
            disabled={isRejecting}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isRejecting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Application Card ─────────────────────────────────────────────────────────
function ApplicationCard({
  app,
  onAccept,
  onReject,
  onUpdateStatus,
  isProcessing,
  onWriteReview,
}) {
  const [expanded, setExpanded] = useState(false);
  const status = app.status?.toLowerCase();
  const applicant = app.user || app.applicant;
  const isAccepted = status === "accepted";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Applicant info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
              {applicant?.avatar ? (
                <img
                  src={`http://localhost:5024${applicant.avatar}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                getAvatarFallback(applicant?.fullName)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-900">
                  {applicant?.fullName || "Ứng viên"}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-500"}`}
                >
                  {STATUS_LABELS[status] || status}
                </span>
                {/* Badge đã viết review */}
                {isAccepted && app.hasReview && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-600 flex items-center gap-1">
                    <Star
                      size={10}
                      className="fill-yellow-400 text-yellow-400"
                    />{" "}
                    Đã đánh giá
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {applicant?.jobTitle && <span>{applicant.jobTitle} · </span>}
                Nộp lúc:{" "}
                {app.appliedAt
                  ? new Date(app.appliedAt).toLocaleDateString("vi-VN")
                  : ""}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {status === "pending" && (
              <button
                onClick={() => onUpdateStatus(app.id, "reviewing")}
                disabled={isProcessing}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                title="Xem xét"
              >
                <Eye size={15} />
              </button>
            )}
            {(status === "pending" || status === "reviewing") && (
              <button
                onClick={() => onUpdateStatus(app.id, "interview")}
                disabled={isProcessing}
                className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                title="Mời phỏng vấn"
              >
                <Star size={15} />
              </button>
            )}
            {status !== "accepted" && status !== "rejected" && (
              <>
                <button
                  onClick={() => onAccept(app.id)}
                  disabled={isProcessing}
                  className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition"
                  title="Chấp nhận"
                >
                  <CheckCircle size={15} />
                </button>
                <button
                  onClick={() => onReject(app)}
                  disabled={isProcessing}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Từ chối"
                >
                  <XCircle size={15} />
                </button>
              </>
            )}

            {/* ✅ Nút viết đánh giá — chỉ hiện khi accepted */}
            {isAccepted && applicant?.id && (
              <button
                onClick={() => onWriteReview(app, applicant)}
                className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition"
                title="Viết đánh giá ứng viên"
              >
                <Star size={15} />
              </button>
            )}

            {applicant?.id && (
              <Link
                to={`/messages/${applicant.id}`}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                title="Nhắn tin"
              >
                <MessageSquare size={15} />
              </Link>
            )}
            <Link
              to={`/company/applications/${app.id}/tests`}
              className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition"
              title="Xem kết quả bài test"
            >
              <Trophy size={15} />
            </Link>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* ✅ Banner viết đánh giá khi accepted */}
        {isAccepted && !app.hasReview && applicant?.id && (
          <div className="mt-3 flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
            <p className="text-xs text-yellow-700 flex items-center gap-1.5">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              Bạn có thể đánh giá ứng viên này sau khi cộng tác
            </p>
            <button
              onClick={() => onWriteReview(app, applicant)}
              className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 underline underline-offset-2"
            >
              Viết đánh giá
            </button>
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3 bg-gray-50/50">
          {app.coverLetter && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">
                Cover Letter
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-lg border border-gray-100">
                {app.coverLetter}
              </p>
            </div>
          )}
          {app.cvFile && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">
                CV đính kèm
              </p>
              <a
                href={`http://localhost:5024${app.cvFile}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition"
              >
                <FileText size={14} /> Xem CV
              </a>
            </div>
          )}
          {applicant?.id && (
            <Link
              to={`/profile/${applicant.id}`}
              className="inline-flex items-center gap-2 text-xs text-blue-600 hover:underline"
            >
              Xem hồ sơ ứng viên →
            </Link>
          )}
          <Link
            to={`/company/applications/${app.id}/tests`}
            className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:underline font-medium"
          >
            <Trophy size={12} /> Xem kết quả bài test →
          </Link>
          {app.rejectReason && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">
                Lý do từ chối
              </p>
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                {app.rejectReason}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageApplicationsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, app: null });
  const [selectedJobId, setSelectedJobId] = useState(jobId || "");

  // ✅ Review modal state
  const [reviewModal, setReviewModal] = useState({
    open: false,
    applicationId: null,
    toUserId: null,
    toUserName: "",
  });

  const { data: jobsData } = useQuery({
    queryKey: ["myJobsList"],
    queryFn: () =>
      jobApiService.getMyJobs().then((r) => r.data.Data || r.data.data || []),
    enabled: !jobId,
  });

  const activeJobId = jobId || selectedJobId;

  const { data: appsData, isLoading } = useQuery({
    queryKey: ["jobApplications", activeJobId, statusFilter],
    queryFn: () =>
      appService
        .getJobApplications(activeJobId, {
          status: statusFilter || undefined,
          pageSize: 50,
        })
        .then((r) => r.data),
    enabled: !!activeJobId,
  });

  const { data: statsData } = useQuery({
    queryKey: ["appStats", activeJobId],
    queryFn: () =>
      appService
        .getApplicationStats(activeJobId)
        .then((r) => r.data.Data || r.data.data),
    enabled: !!activeJobId,
  });

  const apps = appsData?.Data || appsData?.data || [];
  const filtered = apps.filter(
    (a) =>
      !search ||
      (a.user || a.applicant)?.fullName
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  const acceptMutation = useMutation({
    mutationFn: (id) => appService.acceptApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["jobApplications"]);
      queryClient.invalidateQueries(["appStats"]);
      toast.success("Đã chấp nhận ứng viên!");
      setProcessingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.Message || "Thất bại");
      setProcessingId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => appService.rejectApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(["jobApplications"]);
      queryClient.invalidateQueries(["appStats"]);
      toast.success("Đã từ chối ứng viên");
      setRejectModal({ open: false, app: null });
      setProcessingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.Message || "Thất bại");
      setProcessingId(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => appService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["jobApplications"]);
      queryClient.invalidateQueries(["appStats"]);
      toast.success("Đã cập nhật trạng thái");
      setProcessingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.Message || "Thất bại");
      setProcessingId(null);
    },
  });

  const handleAccept = (id) => {
    setProcessingId(id);
    acceptMutation.mutate(id);
  };
  const handleReject = (app) => setRejectModal({ open: true, app });
  const handleConfirmReject = (reason) => {
    setProcessingId(rejectModal.app.id);
    rejectMutation.mutate({ id: rejectModal.app.id, reason });
  };
  const handleUpdateStatus = (id, status) => {
    setProcessingId(id);
    updateStatusMutation.mutate({ id, status });
  };

  // ✅ Mở modal viết review
  const handleWriteReview = (app, applicant) => {
    setReviewModal({
      open: true,
      applicationId: app.id,
      toUserId: applicant.id,
      toUserName: applicant.fullName || "Ứng viên",
    });
  };

  const stats = statsData || {};

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/company/jobs")}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              Quản lý ứng viên
            </h1>
            <p className="text-sm text-gray-400">
              Xem xét và xử lý đơn ứng tuyển
            </p>
          </div>
        </div>

        {/* Job selector */}
        {!jobId && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Chọn tin tuyển dụng
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn tin --</option>
              {(jobsData || []).map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.applicationCount || 0} ứng viên)
                </option>
              ))}
            </select>
          </div>
        )}

        {activeJobId && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                {
                  label: "Tổng",
                  value: stats.total || 0,
                  color: "text-gray-900",
                },
                {
                  label: "Chờ xem",
                  value: stats.pending || 0,
                  color: "text-yellow-600",
                },
                {
                  label: "Xem xét",
                  value: stats.reviewing || 0,
                  color: "text-blue-600",
                },
                {
                  label: "PV",
                  value: stats.interview || 0,
                  color: "text-indigo-600",
                },
                {
                  label: "Chấp nhận",
                  value: stats.accepted || 0,
                  color: "text-green-600",
                },
                {
                  label: "Từ chối",
                  value: stats.rejected || 0,
                  color: "text-red-500",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm"
                >
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Tìm tên ứng viên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                      statusFilter === tab.value
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Applications list */}
            {isLoading ? (
              <LoadingSpinner />
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                <Users size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">
                  Chưa có ứng viên nào
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {statusFilter
                    ? "Không có ứng viên ở trạng thái này"
                    : "Tin tuyển dụng chưa có ứng viên"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">
                  {filtered.length} ứng viên
                </p>
                {filtered.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onUpdateStatus={handleUpdateStatus}
                    isProcessing={processingId === app.id}
                    onWriteReview={handleWriteReview}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!activeJobId && !isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <Filter size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500">
              Chọn một tin tuyển dụng để xem ứng viên
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <RejectModal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, app: null })}
        onReject={handleConfirmReject}
        isRejecting={rejectMutation.isPending}
      />

      {/* ✅ Write Review Modal */}
      {reviewModal.open && (
        <WriteReviewModal
          type="job"
          applicationId={reviewModal.applicationId}
          toUserId={reviewModal.toUserId}
          toUserName={reviewModal.toUserName}
          onClose={() =>
            setReviewModal({
              open: false,
              applicationId: null,
              toUserId: null,
              toUserName: "",
            })
          }
          onSuccess={() => {
            queryClient.invalidateQueries(["jobApplications"]);
            toast.success("Đánh giá đã được gửi!");
          }}
        />
      )}
    </MainLayout>
  );
}
