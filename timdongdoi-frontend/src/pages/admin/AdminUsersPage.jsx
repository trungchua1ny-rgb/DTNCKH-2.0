import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Search,
  Download,
  UserX,
  UserCheck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  AlertTriangle,
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

// ─── Role Badge ───────────────────────────────────────────────────────────────
const ROLE_BADGE = {
  user: "bg-blue-50 text-blue-600",
  company: "bg-indigo-50 text-indigo-600",
  admin: "bg-purple-50 text-purple-700",
};
const ROLE_LABEL = { user: "Ứng viên", company: "Công ty", admin: "Admin" };

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
        status === "banned"
          ? "bg-red-50 text-red-600"
          : "bg-green-50 text-green-600"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${status === "banned" ? "bg-red-500" : "bg-green-500"}`}
      />
      {status === "banned" ? "Bị khóa" : "Hoạt động"}
    </span>
  );
}

// ─── Ban Modal ────────────────────────────────────────────────────────────────
function BanModal({ user, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("");
  const [isPerm, setIsPerm] = useState(false);

  const banMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Tạo report
      const reportRes = await adminService.createReport({
        type: "user",
        reportedUserId: user.id,
        reason: `Ban by admin: ${reason}`,
      });
      const reportId = reportRes.data?.data?.id;
      if (!reportId) throw new Error("Không tạo được report");

      // Step 2: Handle report với ban action
      await adminService.handleReport(reportId, {
        status: "resolved",
        adminNote: reason,
        banAction: {
          type: isPerm ? "permanent" : "temporary",
          durationDays: isPerm ? undefined : Number(days),
          reason,
        },
      });
    },
    onSuccess: () => {
      toast.success(`Đã khóa tài khoản ${user.fullName}`);
      onSuccess();
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  const isValid =
    reason.trim().length >= 5 && (isPerm || (days && Number(days) > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UserX size={18} className="text-red-500" />
            <h3 className="font-bold text-gray-900">Khóa tài khoản</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                {user.fullName}
              </p>
              <p className="text-xs text-red-500">{user.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Lý do khóa <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do khóa tài khoản (tối thiểu 5 ký tự)..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Thời hạn khóa
            </label>
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPerm}
                  onChange={(e) => setIsPerm(e.target.checked)}
                  className="w-4 h-4 text-red-500 rounded"
                />
                <span className="text-sm text-gray-700">Vĩnh viễn</span>
              </label>
            </div>
            {!isPerm && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="Số ngày"
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <span className="text-sm text-gray-500">ngày</span>
              </div>
            )}
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
            onClick={() => banMutation.mutate()}
            disabled={!isValid || banMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition disabled:opacity-50"
          >
            {banMutation.isPending && (
              <Loader2 size={14} className="animate-spin" />
            )}
            <UserX size={14} /> Khóa tài khoản
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [banTarget, setBanTarget] = useState(null);

  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, role, status, page],
    queryFn: () =>
      adminService
        .getUsers({
          search: search || undefined,
          role: role || undefined,
          status: status || undefined,
          page,
          pageSize,
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const users = data?.users || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const unbanMutation = useMutation({
    mutationFn: (userId) => adminService.unbanUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("Đã gỡ khóa tài khoản");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  // Export CSV helper
  async function handleExport() {
    try {
      const res = await adminService.exportUsers();
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "text/csv" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã tải xuống file CSV");
    } catch {
      toast.error("Xuất file thất bại");
    }
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý người dùng
            </h1>
            <p className="text-sm text-gray-500 mt-1">{totalCount} tài khoản</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 font-semibold text-sm rounded-xl hover:bg-green-100 transition"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm tên, email..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả vai trò</option>
            <option value="user">Ứng viên</option>
            <option value="company">Công ty</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="banned">Bị khóa</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <LoadingSpinner />
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-20" />
              <p>Không có người dùng nào</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Đăng ký
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* User info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={imgUrl(user.avatar)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            initials(user.fullName)
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/profile/${user.id}`}
                            className="font-medium text-gray-800 hover:text-blue-600 transition-colors"
                          >
                            {user.fullName || "(Chưa đặt tên)"}
                          </Link>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_BADGE[user.role] || "bg-gray-100 text-gray-500"}`}
                      >
                        {ROLE_LABEL[user.role] || user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <StatusBadge status={user.status} />
                    </td>

                    {/* Created at */}
                    <td className="px-4 py-4 text-xs text-gray-400">
                      {formatTimeAgo(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === "active" && user.role !== "admin" && (
                          <button
                            onClick={() => setBanTarget(user)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 border border-red-200 text-xs font-medium rounded-lg hover:bg-red-50 transition"
                          >
                            <UserX size={13} /> Khóa
                          </button>
                        )}
                        {user.status === "banned" && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Gỡ khóa tài khoản "${user.fullName}"?`,
                                )
                              )
                                unbanMutation.mutate(user.id);
                            }}
                            disabled={unbanMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-green-600 border border-green-200 text-xs font-medium rounded-lg hover:bg-green-50 transition disabled:opacity-50"
                          >
                            <UserCheck size={13} /> Gỡ khóa
                          </button>
                        )}
                        {user.role === "admin" && (
                          <span className="flex items-center gap-1 text-xs text-purple-600">
                            <Shield size={13} /> Admin
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Trang {page}/{totalPages} · {totalCount} người dùng
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      p === page
                        ? "bg-blue-500 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {banTarget && (
        <BanModal
          user={banTarget}
          onClose={() => setBanTarget(null)}
          onSuccess={() => queryClient.invalidateQueries(["admin-users"])}
        />
      )}
    </MainLayout>
  );
}
