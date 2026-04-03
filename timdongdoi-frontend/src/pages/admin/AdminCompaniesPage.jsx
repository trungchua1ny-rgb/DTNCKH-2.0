import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Search,
  Building2,
  Shield,
  ShieldCheck,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  X,
  Loader2,
  FileText, // Thêm icon FileText để xem tài liệu
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import adminService from "../../services/adminService";
import { formatTimeAgo } from "../../utils/helpers";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5024";

function imgUrl(p) {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `${API_BASE}${p}`;
}

function initials(n = "") {
  return (
    n
      ?.trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

const VERIFY_CONFIG = {
  verified: {
    label: "Đã xác minh",
    color: "bg-green-50 text-green-700",
    icon: ShieldCheck,
  },
  approved: {
    // Backup label trong trường hợp API trả về approved
    label: "Đã xác minh",
    color: "bg-green-50 text-green-700",
    icon: ShieldCheck,
  },
  pending: {
    label: "Chờ duyệt",
    color: "bg-yellow-50 text-yellow-700",
    icon: Shield,
  },
  rejected: {
    label: "Bị từ chối",
    color: "bg-red-50 text-red-600",
    icon: ShieldX,
  },
};

// ─── Verify Modal ─────────────────────────────────────────────────────────────
function VerifyModal({ verification, onClose, onSuccess }) {
  const [action, setAction] = useState("approve");
  const [notes, setNotes] = useState("");

  const verifyMutation = useMutation({
    mutationFn: () =>
      // Truyền TRỰC TIẾP verification.id vào đây, không cần gọi API tìm kiếm vòng vèo nữa
      adminService.processVerification(verification.id, { action, notes }),
    onSuccess: () => {
      toast.success(
        action === "approve" ? "Đã xác minh công ty" : "Đã từ chối xác minh",
      );
      onSuccess();
      onClose();
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.Message || err.message || "Thao tác thất bại",
      ),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Shield size={16} className="text-blue-500" /> Xét duyệt tài liệu
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {verification.companyName}
              </p>
              <p className="text-xs text-gray-500">
                Loại giấy tờ:{" "}
                <span className="font-medium text-gray-700">
                  {verification.documentType || "Không xác định"}
                </span>
              </p>
            </div>
          </div>

          {/* Nút xem tài liệu */}
          {verification.documentUrl && (
            <a
              href={imgUrl(verification.documentUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl transition"
            >
              <FileText size={16} />
              Mở xem tài liệu đính kèm
            </a>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quyết định
            </label>
            <div className="flex gap-2">
              {[
                {
                  value: "approve",
                  label: "Xác minh",
                  icon: CheckCircle,
                  color: "border-green-300 text-green-700 bg-green-50",
                },
                {
                  value: "reject",
                  label: "Từ chối",
                  icon: XCircle,
                  color: "border-red-300 text-red-600 bg-red-50",
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lý do từ chối hoặc ghi chú nội bộ..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium text-sm rounded-xl hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white font-semibold text-sm rounded-xl transition disabled:opacity-50 ${
              action === "approve"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {verifyMutation.isPending && (
              <Loader2 size={14} className="animate-spin" />
            )}
            {action === "approve" ? "Xác minh" : "Từ chối"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminCompaniesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [verifying, setVerifying] = useState(null); // Lưu toàn bộ object verification

  const pageSize = 20;

  // Lấy danh sách các đơn yêu cầu xác minh
  const { data, isLoading } = useQuery({
    queryKey: ["admin-verifications", page],
    queryFn: () =>
      adminService
        .getPendingVerifications({
          page,
          pageSize,
        })
        .then((r) => r.data), // Tùy thuộc vào cấu trúc trả về của API, có thể là r.data.data
    keepPreviousData: true,
  });

  // Xử lý dữ liệu trả về linh hoạt theo nhiều định dạng API
  const verifications = data?.data || data?.Data || [];
  const totalCount =
    data?.pagination?.total || data?.totalCount || verifications.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Duyệt hồ sơ công ty
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các yêu cầu xác minh danh tính từ doanh nghiệp
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <LoadingSpinner />
          ) : verifications.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Shield size={40} className="mx-auto mb-3 opacity-20" />
              <p>Hiện không có yêu cầu xác minh nào</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Công ty
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Loại giấy tờ
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Ngày gửi
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {verifications.map((v) => {
                  const vCfg = VERIFY_CONFIG[v.status] || VERIFY_CONFIG.pending;
                  const VIcon = vCfg.icon;
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-gray-500">
                              {initials(v.companyName)}
                            </span>
                          </div>
                          <div>
                            <Link
                              to={`/companies/${v.companyId}`}
                              className="font-medium text-gray-800 hover:text-blue-600 transition-colors"
                            >
                              {v.companyName}
                            </Link>
                            {v.notes && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                Ghi chú: {v.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-gray-600">
                        {v.documentType || "Không xác định"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${vCfg.color}`}
                        >
                          <VIcon size={12} /> {vCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-400">
                        {formatTimeAgo(v.submittedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {v.status === "pending" && (
                            <button
                              onClick={() => setVerifying(v)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 border border-blue-200 text-xs font-medium rounded-lg hover:bg-blue-50 transition"
                            >
                              <Shield size={12} /> Xem & Duyệt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

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

      {verifying && (
        <VerifyModal
          verification={verifying}
          onClose={() => setVerifying(null)}
          onSuccess={() =>
            queryClient.invalidateQueries(["admin-verifications"])
          }
        />
      )}
    </MainLayout>
  );
}
