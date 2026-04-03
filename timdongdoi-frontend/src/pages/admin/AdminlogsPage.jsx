import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import adminService from "../../services/adminService";
import { formatTimeAgo } from "../../utils/helpers";

// ─── Action config ────────────────────────────────────────────────────────────
const ACTION_CONFIG = {
  ban_temporary: {
    label: "Khóa tạm thời",
    color: "bg-orange-100 text-orange-700",
  },
  ban_permanent: { label: "Khóa vĩnh viễn", color: "bg-red-100 text-red-700" },
  unban_user: { label: "Gỡ khóa", color: "bg-green-100 text-green-700" },
  delete_job: { label: "Xóa việc làm", color: "bg-blue-100 text-blue-700" },
  delete_project: {
    label: "Xóa dự án",
    color: "bg-violet-100 text-violet-700",
  },
  handle_report_resolved: {
    label: "Xử lý báo cáo",
    color: "bg-teal-100 text-teal-700",
  },
  handle_report_dismissed: {
    label: "Bỏ qua báo cáo",
    color: "bg-gray-100 text-gray-600",
  },
  delete_review: { label: "Xóa đánh giá", color: "bg-pink-100 text-pink-700" },
};

const ACTION_OPTIONS = [
  "ban_temporary",
  "ban_permanent",
  "unban_user",
  "delete_job",
  "delete_project",
  "handle_report_resolved",
  "handle_report_dismissed",
];

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || {
    label: action,
    color: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

const TARGET_TYPE_LABEL = {
  user: "Người dùng",
  job: "Việc làm",
  project: "Dự án",
  report: "Báo cáo",
  review: "Đánh giá",
};

export default function AdminLogsPage() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", action, page],
    queryFn: () =>
      adminService
        .getLogs({
          action: action || undefined,
          page,
          pageSize,
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  const logs = data?.logs || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={22} className="text-blue-500" />
            Nhật ký Admin
          </h1>
          <p className="text-sm text-gray-500 mt-1">{totalCount} bản ghi</p>
        </div>

        {/* Filter */}
        <div className="flex gap-3">
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả hành động</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {ACTION_CONFIG[a]?.label || a}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <LoadingSpinner />
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
              <p>Không có bản ghi nào</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Hành động
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Đối tượng
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Lý do
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Thời gian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      <span className="text-xs text-gray-400">
                        {TARGET_TYPE_LABEL[log.targetType] || log.targetType}
                      </span>{" "}
                      <span className="font-medium text-gray-700">
                        #{log.targetId}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-xs">
                      {log.adminName || `Admin #${log.adminId}`}
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <p className="text-xs text-gray-500 truncate">
                        {log.reason || "—"}
                      </p>
                      {log.metadata && (
                        <p className="text-xs text-gray-400 truncate">
                          {log.metadata}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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
    </MainLayout>
  );
}
