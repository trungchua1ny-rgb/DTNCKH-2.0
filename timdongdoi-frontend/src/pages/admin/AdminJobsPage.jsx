import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Briefcase,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Eye,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import adminService from "../../services/adminService";
import { formatTimeAgo } from "../../utils/helpers";
import toast from "react-hot-toast";

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteJobModal({ job, onClose, onSuccess }) {
  const [reason, setReason] = useState("");

  const deleteMutation = useMutation({
    mutationFn: () => adminService.deleteJob(job.id, reason),
    onSuccess: () => {
      toast.success(`Đã xóa việc làm "${job.title}"`);
      onSuccess();
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Xóa thất bại"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Trash2 size={16} className="text-red-500" /> Xóa việc làm
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <p className="text-sm font-semibold text-red-700">{job.title}</p>
            <p className="text-xs text-red-500">{job.companyName}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Lý do xóa <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do xóa tin tuyển dụng..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
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
            onClick={() => deleteMutation.mutate()}
            disabled={!reason.trim() || deleteMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition disabled:opacity-50"
          >
            {deleteMutation.isPending && (
              <Loader2 size={14} className="animate-spin" />
            )}
            <Trash2 size={14} /> Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  open: { label: "Đang tuyển", color: "bg-green-50 text-green-600" },
  closed: { label: "Đã đóng", color: "bg-gray-100 text-gray-500" },
  draft: { label: "Nháp", color: "bg-yellow-50 text-yellow-600" },
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminJobsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [delTarget, setDelTarget] = useState(null);

  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-jobs", search, status, page],
    queryFn: () =>
      adminService
        .getJobs({
          search: search || undefined,
          status: status || undefined,
          page,
          pageSize,
        })
        .then((r) => r.data.data),
    keepPreviousData: true,
  });

  // Export CSV
  async function handleExport() {
    try {
      const res = await adminService.exportJobs();
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "text/csv" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `jobs_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã tải xuống file CSV");
    } catch {
      toast.error("Xuất file thất bại");
    }
  }

  const jobs = data?.jobs || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý việc làm
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalCount} tin tuyển dụng
            </p>
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
              placeholder="Tìm tiêu đề việc làm..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="open">Đang tuyển</option>
            <option value="closed">Đã đóng</option>
            <option value="draft">Nháp</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <LoadingSpinner />
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Briefcase size={40} className="mx-auto mb-3 opacity-20" />
              <p>Không có việc làm nào</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left border-b border-gray-100">
                  <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Việc làm
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                    Views
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                    Đơn
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                    Đăng
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((job) => {
                  const sCfg = STATUS_CONFIG[job.status] || {
                    label: job.status,
                    color: "bg-gray-100 text-gray-500",
                  };
                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800 line-clamp-1">
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {job.companyName}
                        </p>
                        {job.location && (
                          <p className="text-xs text-gray-400">
                            {job.location}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          {job.type || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sCfg.color}`}
                        >
                          {sCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-700">
                        {job.views}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-gray-700">
                        {job.applications}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-400">
                        {formatTimeAgo(job.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDelTarget(job)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 border border-red-200 text-xs font-medium rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 size={12} /> Xóa
                          </button>
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

      {delTarget && (
        <DeleteJobModal
          job={delTarget}
          onClose={() => setDelTarget(null)}
          onSuccess={() => queryClient.invalidateQueries(["admin-jobs"])}
        />
      )}
    </MainLayout>
  );
}
