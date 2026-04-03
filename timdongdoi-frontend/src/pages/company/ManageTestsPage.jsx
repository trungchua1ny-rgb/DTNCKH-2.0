import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Search,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { testService } from "../../services/testService";
import { formatTimeAgo } from "../../utils/helpers";

const STATUS_INFO = {
  draft: { label: "Nháp", color: "bg-gray-100 text-gray-600", icon: FileText },
  active: {
    label: "Đang dùng",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  inactive: {
    label: "Tạm dừng",
    color: "bg-yellow-100 text-yellow-600",
    icon: Clock,
  },
};

export default function ManageTestsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["company-tests", page],
    queryFn: () =>
      testService.getMyTests({ page, pageSize: 20 }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => testService.deleteTest(id),
    onSuccess: () => queryClient.invalidateQueries(["company-tests"]),
    onError: (err) => alert(err.response?.data?.message || "Xóa thất bại"),
  });

  const tests = (data?.tests || []).filter(
    (t) => !search || t.title.toLowerCase().includes(search.toLowerCase()),
  );
  const totalCount = data?.totalCount || 0;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý bài test
            </h1>
            <p className="text-gray-500 text-sm mt-1">{totalCount} bài test</p>
          </div>
          <Link
            to="/company/tests/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition shadow-md"
          >
            <Plus size={16} /> Tạo bài test
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm bài test..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : tests.length === 0 ? (
          <EmptyState
            icon={<FileText size={64} />}
            title="Chưa có bài test nào"
            description="Tạo bài test để sàng lọc ứng viên hiệu quả hơn"
            action={
              <Link
                to="/company/tests/new"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl text-sm shadow-md hover:opacity-90 transition"
              >
                Tạo bài test đầu tiên
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {tests.map((test) => {
              const statusInfo = STATUS_INFO[test.status] || STATUS_INFO.draft;
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {test.title}
                        </h3>
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusInfo.color}`}
                        >
                          <StatusIcon size={11} />
                          {statusInfo.label}
                        </span>
                      </div>
                      {test.description && (
                        <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                          {test.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span>{test.totalQuestions} câu hỏi</span>
                        <span>{test.totalPoints} điểm</span>
                        {test.durationMinutes && (
                          <span>{test.durationMinutes} phút</span>
                        )}
                        {test.passingScore && (
                          <span>Đạt: {test.passingScore} điểm</span>
                        )}
                        <span>{formatTimeAgo(test.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/company/tests/${test.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/company/tests/${test.id}/edit`}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => {
                          if (window.confirm(`Xóa bài test "${test.title}"?`))
                            deleteMutation.mutate(test.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
