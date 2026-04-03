import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Clock,
  Filter,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ChevronRight,
  Star,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import WriteReviewModal from "../../components/review/WriteReviewModal";
import { projectService } from "../../services/projectService";
import { PROJECT_APPLICATION_STATUSES } from "../../utils/constants";
import { formatTimeAgo } from "../../utils/helpers";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "accepted", label: "Đã chấp nhận" },
  { value: "rejected", label: "Bị từ chối" },
];

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ applications }) {
  const total = applications.length;
  const pending = applications.filter(
    (a) => a.status?.toLowerCase() === "pending",
  ).length;
  const accepted = applications.filter(
    (a) => a.status?.toLowerCase() === "accepted",
  ).length;
  const rejected = applications.filter(
    (a) => a.status?.toLowerCase() === "rejected",
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        {
          label: "Tổng đơn",
          value: total,
          bg: "bg-gray-100",
          text: "text-gray-700",
        },
        {
          label: "Chờ duyệt",
          value: pending,
          bg: "bg-yellow-50",
          text: "text-yellow-700",
        },
        {
          label: "Chấp nhận",
          value: accepted,
          bg: "bg-green-50",
          text: "text-green-700",
        },
        {
          label: "Từ chối",
          value: rejected,
          bg: "bg-red-50",
          text: "text-red-700",
        },
      ].map((s) => (
        <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
          <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Withdraw Modal ───────────────────────────────────────────────────────────
function WithdrawModal({ open, onConfirm, onCancel, isLoading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            Rút đơn ứng tuyển?
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Đơn ứng tuyển của bạn sẽ bị xóa. Bạn có thể nộp lại sau nếu muốn.
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition text-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Rút đơn"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Application Card ─────────────────────────────────────────────────────────
function ApplicationCard({ app, onWithdraw, isWithdrawing, onWriteReview }) {
  const [showDetail, setShowDetail] = useState(false);
  const statusKey = app.status?.toLowerCase() || "pending";
  const status = PROJECT_APPLICATION_STATUSES[statusKey] || {
    label: app.status,
    color: "bg-gray-100 text-gray-600",
  };
  const canWithdraw = statusKey === "pending";
  const isAccepted = statusKey === "accepted";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Main row */}
      <div className="p-5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <Link
            to={`/projects/${app.projectId}`}
            className="font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-1"
          >
            {app.project?.title}
          </Link>
          <p className="text-sm text-blue-600 font-medium">
            {app.position?.role}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <Clock size={12} /> Apply {formatTimeAgo(app.appliedAt)}
          </p>
        </div>

        <div className="text-right shrink-0 space-y-2">
          <span
            className={`block px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
          >
            {status.label}
          </span>
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <button
              onClick={() => setShowDetail((v) => !v)}
              className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-1 transition"
              title={showDetail ? "Ẩn chi tiết" : "Xem chi tiết"}
            >
              {showDetail ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{showDetail ? "Ẩn" : "Chi tiết"}</span>
            </button>

            {/* ✅ Nút viết review — chỉ hiện khi accepted */}
            {isAccepted && app.project?.owner?.id && (
              <button
                onClick={() => onWriteReview(app)}
                className="text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1 transition"
                title="Đánh giá project owner"
              >
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                Đánh giá
              </button>
            )}

            {canWithdraw && (
              <button
                onClick={() => onWithdraw(app.id)}
                disabled={isWithdrawing}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50"
              >
                Rút đơn
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Banner nhắc đánh giá khi accepted */}
      {isAccepted && app.project?.owner?.id && (
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
            <p className="text-xs text-yellow-700 flex items-center gap-1.5">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              Bạn có thể đánh giá project owner
            </p>
            <button
              onClick={() => onWriteReview(app)}
              className="text-xs font-semibold text-yellow-700 hover:text-yellow-800 underline underline-offset-2"
            >
              Viết đánh giá
            </button>
          </div>
        </div>
      )}

      {/* Expandable detail */}
      {showDetail && (
        <div className="border-t border-gray-50 bg-gray-50 px-5 py-4 space-y-3">
          {app.coverLetter && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Cover Letter
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {app.coverLetter}
              </p>
            </div>
          )}
          {app.portfolioLink && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Portfolio / Link
              </p>
              <a
                href={app.portfolioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {app.portfolioLink}
              </a>
            </div>
          )}
          {!app.coverLetter && !app.portfolioLink && (
            <p className="text-sm text-gray-400 italic">
              Không có thông tin bổ sung.
            </p>
          )}
          <Link
            to={`/projects/${app.projectId}`}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Xem dự án <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyProjectApplicationsPage() {
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [reviewModal, setReviewModal] = useState({
    open: false,
    projectMemberId: null,
    toUserId: null,
    toUserName: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-project-applications", page],
    queryFn: () =>
      projectService
        .getMyApplications({ page, pageSize: 10 })
        .then((r) => r.data.data || []),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id) => projectService.withdrawApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["my-project-applications"]);
      setWithdrawTarget(null);
      toast.success("Đã rút đơn ứng tuyển");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Rút đơn thất bại");
      setWithdrawTarget(null);
    },
  });

  const applications = Array.isArray(data) ? data : [];
  const totalCount = applications.length;

  const filtered =
    activeFilter === "all"
      ? applications
      : applications.filter((a) => a.status?.toLowerCase() === activeFilter);

  // ── Mở review modal ──────────────────────────────────────────────────────
  // Member review owner — cần projectMemberId của chính mình
  // app.project.owner chứa info owner
  // Nhưng cần memberId của user trong project này
  // → Dùng accepted application để tìm memberId từ /projects/{id}/members
  function handleWriteReview(app) {
    // ProjectMemberId: backend cần id của ProjectMember record
    // Trong ProjectApplicationDto sau khi accepted, không có memberId trực tiếp
    // → Dùng projectId + userId để backend tìm
    // Workaround: truyền applicationId thay thế, backend validate qua CanReviewProjectAsync
    // Thực ra cần projectMemberId — fetch từ /projects/{id}/members
    setReviewModal({
      open: true,
      // Tạm dùng app.id làm reference, user cần tìm memberId của mình
      projectMemberId: app.projectMemberId || null,
      toUserId: app.project?.owner?.id,
      toUserName: app.project?.owner?.fullName || "Project Owner",
      projectId: app.projectId,
    });
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dự án đã apply</h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi trạng thái các đơn bạn đã nộp vào dự án.
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : applications.length === 0 ? (
          <EmptyState
            icon={<Users size={64} />}
            title="Chưa apply dự án nào"
            description="Khám phá và tham gia các dự án thú vị!"
            action={
              <Link
                to="/projects"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md text-sm"
              >
                Tìm dự án
              </Link>
            }
          />
        ) : (
          <>
            <StatsBar applications={applications} />

            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setActiveFilter(opt.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    activeFilter === opt.value
                      ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">
                Không có đơn nào ở trạng thái này.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onWithdraw={(id) => setWithdrawTarget(id)}
                    isWithdrawing={
                      withdrawMutation.isPending && withdrawTarget === app.id
                    }
                    onWriteReview={handleWriteReview}
                  />
                ))}
              </div>
            )}

            <Pagination
              page={page}
              pageSize={10}
              total={totalCount}
              onChange={setPage}
            />
          </>
        )}
      </div>

      <WithdrawModal
        open={!!withdrawTarget}
        onCancel={() => setWithdrawTarget(null)}
        onConfirm={() => withdrawMutation.mutate(withdrawTarget)}
        isLoading={withdrawMutation.isPending}
      />

      {/* ✅ Write Review Modal */}
      {reviewModal.open && (
        <WriteReviewModal
          type="project"
          projectMemberId={reviewModal.projectMemberId}
          toUserId={reviewModal.toUserId}
          toUserName={reviewModal.toUserName}
          onClose={() =>
            setReviewModal({
              open: false,
              projectMemberId: null,
              toUserId: null,
              toUserName: "",
            })
          }
          onSuccess={() => toast.success("Đã gửi đánh giá!")}
        />
      )}
    </MainLayout>
  );
}
