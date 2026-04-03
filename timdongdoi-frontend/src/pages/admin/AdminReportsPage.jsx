import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  UserX,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Loader2,
  Eye,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import adminService from "../../services/adminService";
import { formatTimeAgo } from "../../utils/helpers";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-yellow-50 text-yellow-700",
    dot: "bg-yellow-400",
  },
  resolved: {
    label: "Đã xử lý",
    color: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  dismissed: {
    label: "Bỏ qua",
    color: "bg-gray-100 text-gray-500",
    dot: "bg-gray-400",
  },
};

const TYPE_CONFIG = {
  user: { label: "Người dùng", color: "bg-red-50 text-red-600" },
  job: { label: "Việc làm", color: "bg-blue-50 text-blue-600" },
  project: { label: "Dự án", color: "bg-violet-50 text-violet-600" },
  review: { label: "Đánh giá", color: "bg-orange-50 text-orange-600" },
};

// ─── Handle Modal ─────────────────────────────────────────────────────────────
function HandleModal({ report, onClose, onSuccess }) {
  const [action, setAction] = useState("resolved");
  const [note, setNote] = useState("");
  const [doBan, setDoBan] = useState(false);
  const [banType, setBanType] = useState("temporary");
  const [banDays, setBanDays] = useState("");
  const [banReason, setBanReason] = useState("");

  const handleMutation = useMutation({
    mutationFn: () => {
      const body = {
        status: action,
        adminNote: note,
        ...(doBan &&
          report.type === "user" && {
            banAction: {
              type: banType,
              durationDays:
                banType === "temporary" ? Number(banDays) : undefined,
              reason: banReason || note,
            },
          }),
      };
      return adminService.handleReport(report.id, body);
    },
    onSuccess: () => {
      toast.success("Đã xử lý báo cáo");
      onSuccess();
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  const isUserReport = report.type === "user";
  const isValid =
    action &&
    (!doBan ||
      (banReason.trim().length >= 3 &&
        (banType === "permanent" || (banDays && Number(banDays) > 0))));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Flag size={16} className="text-red-500" />
            Xử lý báo cáo #{report.id}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Report info */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_CONFIG[report.type]?.color || "bg-gray-100"}`}
              >
                {TYPE_CONFIG[report.type]?.label || report.type}
              </span>
              <span className="text-gray-500">từ</span>
              <span className="font-medium text-gray-700">
                {report.reporterName}
              </span>
            </div>
            <p className="text-gray-700">
              <span className="font-medium">Lý do:</span> {report.reason}
            </p>
            <p className="text-xs text-gray-400">
              {formatTimeAgo(report.createdAt)}
            </p>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Hành động
            </label>
            <div className="flex gap-2">
              {[
                {
                  value: "resolved",
                  label: "Giải quyết",
                  icon: CheckCircle,
                  color: "border-green-300 text-green-700 bg-green-50",
                },
                {
                  value: "dismissed",
                  label: "Bỏ qua",
                  icon: XCircle,
                  color: "border-gray-300 text-gray-600 bg-gray-50",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAction(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                    action === opt.value
                      ? opt.color
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <opt.icon size={15} /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Admin note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Ghi chú admin
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú về quyết định xử lý..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Ban option — chỉ hiện khi report user */}
          {isUserReport && action === "resolved" && (
            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={doBan}
                  onChange={(e) => setDoBan(e.target.checked)}
                  className="w-4 h-4 text-red-500 rounded"
                />
                <span className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
                  <UserX size={15} /> Đồng thời khóa tài khoản người dùng này
                </span>
              </label>

              {doBan && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Loại khóa
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "temporary", label: "Tạm thời" },
                        { value: "permanent", label: "Vĩnh viễn" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setBanType(opt.value)}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                            banType === opt.value
                              ? "border-red-300 bg-red-50 text-red-700"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {banType === "temporary" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Số ngày
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={banDays}
                        onChange={(e) => setBanDays(e.target.value)}
                        placeholder="Nhập số ngày..."
                        className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Lý do khóa <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Lý do cụ thể..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium text-sm rounded-xl hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={() => handleMutation.mutate()}
            disabled={!isValid || handleMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {handleMutation.isPending && (
              <Loader2 size={14} className="animate-spin" />
            )}
            Xác nhận xử lý
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ report, onHandle }) {
  const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
  const typeCfg = TYPE_CONFIG[report.type] || {
    label: report.type,
    color: "bg-gray-100 text-gray-500",
  };

  // ✅ Hàm render Link động tùy theo loại Report giúp Admin click phát là tới nơi
  const renderTargetLink = () => {
    let linkUrl = "#";
    let linkText = "Không xác định";

    switch (report.type) {
      case "user":
        if (report.reportedUserId) {
          linkUrl = `/profile/${report.reportedUserId}`;
          linkText = `Hồ sơ User #${report.reportedUserId}`;
        }
        break;
      case "job":
        if (report.reportedJobId) {
          linkUrl = `/jobs/${report.reportedJobId}`;
          linkText = `Tin tuyển dụng #${report.reportedJobId}`;
        }
        break;
      case "project":
        if (report.reportedProjectId) {
          linkUrl = `/projects/${report.reportedProjectId}`;
          linkText = `Dự án #${report.reportedProjectId}`;
        }
        break;
      case "review":
        if (report.reportedReviewId) {
          linkText = `Đánh giá #${report.reportedReviewId}`;
          return (
            <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
              Đối tượng: {linkText}
            </span>
          );
        }
        break;
    }

    if (linkUrl !== "#") {
      return (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors inline-flex items-center gap-1 mt-1"
        >
          Mở xem {linkText} ↗
        </a>
      );
    }

    return (
      <span className="text-xs text-gray-400 mt-1 block">
        Đối tượng: {linkText}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeCfg.color}`}
            >
              {typeCfg.label}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-400">#{report.id}</span>
          </div>
          <p className="text-sm text-gray-700 mb-1">
            <span className="font-medium">Lý do:</span> {report.reason}
          </p>
          <p className="text-xs text-gray-400">
            Từ:{" "}
            <span className="font-medium text-gray-600">
              {report.reporterName}
            </span>
            {" · "}
            {formatTimeAgo(report.createdAt)}
          </p>

          {/* ✅ Hiển thị Link đến đối tượng thay vì text chay */}
          {renderTargetLink()}

          {report.adminNote && (
            <p className="text-xs text-blue-600 mt-2 bg-blue-50 px-2.5 py-1.5 rounded-lg inline-block">
              Ghi chú: {report.adminNote}
            </p>
          )}
        </div>

        {report.status === "pending" && (
          <button
            onClick={() => onHandle(report)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold rounded-xl hover:bg-blue-100 transition flex-shrink-0"
          >
            <Eye size={13} /> Xử lý
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [handling, setHandling] = useState(null);

  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", status, type, page],
    queryFn: () =>
      adminService
        .getAllReports({
          status: status || undefined,
          type: type || undefined,
          page,
          pageSize,
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const reports = data?.reports || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Flag size={22} className="text-red-500" />
            Quản lý báo cáo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount} báo cáo
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                {pendingCount} chờ xử lý
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="resolved">Đã xử lý</option>
            <option value="dismissed">Bỏ qua</option>
          </select>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả loại</option>
            <option value="user">Người dùng</option>
            <option value="job">Việc làm</option>
            <option value="project">Dự án</option>
            <option value="review">Đánh giá</option>
          </select>
        </div>

        {/* List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
            <Flag size={40} className="mx-auto mb-3 opacity-20" />
            <p>Không có báo cáo nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} onHandle={setHandling} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {handling && (
        <HandleModal
          report={handling}
          onClose={() => setHandling(null)}
          onSuccess={() => queryClient.invalidateQueries(["admin-reports"])}
        />
      )}
    </MainLayout>
  );
}
