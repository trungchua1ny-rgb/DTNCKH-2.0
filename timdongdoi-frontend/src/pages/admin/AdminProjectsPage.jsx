import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, FolderOpen, Users, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Pagination from "../../components/common/Pagination";
import  adminService  from "../../services/adminService";
import { formatTimeAgo } from "../../utils/helpers";

const PROJECT_STATUS = {
  open: { label: "Đang mở", color: "bg-green-100 text-green-700" },
  in_progress: { label: "Đang thực hiện", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Hoàn thành", color: "bg-purple-100 text-purple-700" },
  closed: { label: "Đã đóng", color: "bg-gray-100 text-gray-500" },
};

const PROJECT_TYPE_LABELS = {
  startup: "Startup",
  freelance: "Freelance",
  research: "Nghiên cứu",
  social: "Xã hội",
  side_project: "Side Project",
  other: "Khác",
};

const COMPENSATION_LABELS = {
  paid: "Có lương",
  equity: "Cổ phần",
  volunteer: "Tình nguyện",
  negotiable: "Thỏa thuận",
};

export default function AdminProjectsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-projects", page, search, status],
    queryFn: () =>
      adminService
        .getProjects({
          page,
          pageSize: 20,
          search: search || undefined,
          status: status || undefined,
        })
        .then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-projects"]);
      toast.success("Đã xóa dự án!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Xóa thất bại"),
  });

  const projects = data?.projects || data?.data || data || [];
  const totalCount = data?.totalCount || data?.total || 0;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Dự án</h1>
          <p className="text-gray-500 text-sm mt-1">
            {totalCount.toLocaleString()} dự án
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px] relative">
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
              placeholder="Tìm tên dự án, tên chủ sở hữu..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="open">Đang mở</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="completed">Hoàn thành</option>
            <option value="closed">Đã đóng</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingSpinner />
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <FolderOpen size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">Không có dự án nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">
                      Tiêu đề / Chủ sở hữu
                    </th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">
                      Loại
                    </th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">
                      Trạng thái
                    </th>
                    <th className="text-center px-5 py-3 text-gray-500 font-medium">
                      Vị trí
                    </th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">
                      <Eye size={14} className="inline mr-1" />
                      Xem
                    </th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">
                      Ngày tạo
                    </th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projects.map((p) => {
                    const statusInfo =
                      PROJECT_STATUS[p.status?.toLowerCase()] ||
                      PROJECT_STATUS.closed;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800 line-clamp-1 max-w-[220px]">
                            {p.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[220px]">
                            bởi {p.ownerName || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                            {PROJECT_TYPE_LABELS[p.type] || p.type || "—"}
                          </span>
                          {p.compensationType && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {COMPENSATION_LABELS[p.compensationType] ||
                                p.compensationType}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-sm font-semibold text-gray-700">
                            {p.openPositions || 0}
                          </span>
                          <span className="text-xs text-gray-400">
                            /{p.totalPositions || 0}
                          </span>
                          <p className="text-xs text-gray-400">trống/tổng</p>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-500">
                          {(p.views || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400">
                          {formatTimeAgo(p.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Xóa dự án "${p.title}"?\nHành động này không thể hoàn tác!`,
                                  )
                                )
                                  deleteMutation.mutate(p.id);
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
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
            </div>
          </div>
        )}

        <Pagination
          page={page}
          pageSize={20}
          total={totalCount}
          onChange={setPage}
        />
      </div>
    </MainLayout>
  );
}
