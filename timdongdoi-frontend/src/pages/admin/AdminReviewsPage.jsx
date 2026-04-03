import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Briefcase,
  FolderOpen,
} from "lucide-react";
import { toast } from "react-hot-toast";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Pagination from "../../components/common/Pagination";
import api from "../../services/api";
import { formatTimeAgo } from "../../utils/helpers";

const API_BASE = "http://localhost:5024";

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={
            s <= value
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-600">
        {value}/5
      </span>
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ review, onDelete }) {
  const isJob = review.type === "job";

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 transition-opacity ${
        review.isVisible === false
          ? "opacity-60 border-gray-100"
          : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isJob
                  ? "bg-blue-100 text-blue-700"
                  : "bg-violet-100 text-violet-700"
              }`}
            >
              {isJob ? <Briefcase size={11} /> : <FolderOpen size={11} />}
              {isJob ? "Việc làm" : "Dự án"}
            </span>

            {/* Admin chỉ được XEM trạng thái ẩn/hiện chứ không có nút bấm đổi trạng thái */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                review.isVisible !== false
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {review.isVisible !== false ? (
                <>
                  <Eye size={10} /> Hiển thị
                </>
              ) : (
                <>
                  <EyeOff size={10} /> Đã ẩn
                </>
              )}
            </span>

            <StarRating value={review.rating} />
          </div>

          <div className="flex items-center gap-2 text-sm mb-2">
            <span className="font-semibold text-gray-700">
              {review.fromUserName || `User #${review.fromUserId}`}
            </span>
            <span className="text-gray-400">→</span>
            <span className="font-semibold text-gray-700">
              {review.toUserName || `User #${review.toUserId}`}
            </span>
          </div>

          {review.comment && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mb-2 line-clamp-3">
              {review.comment}
            </p>
          )}

          <p className="text-xs text-gray-400 flex items-center gap-1">
            {formatTimeAgo(review.createdAt)}
          </p>
        </div>

        {/* Cột thao tác của Admin giờ chỉ còn duy nhất nút Xóa */}
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => {
              if (window.confirm("Xóa review này? Không thể hoàn tác!")) {
                onDelete({
                  id: review.id,
                  reason: "Xóa bởi Admin do vi phạm quy định",
                });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
          >
            <Trash2 size={12} /> Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [visFilter, setVisFilter] = useState("");
  const [ratingFilter, setRating] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", page, typeFilter, ratingFilter],
    queryFn: async () => {
      const params = {
        page,
        pageSize: 20,
        type: typeFilter || undefined,
        minRating: ratingFilter || undefined,
        maxRating: ratingFilter || undefined,
      };

      try {
        const response = await api.get("/reviews/admin/all", { params });
        return response.data;
      } catch (error) {
        console.error("=== LỖI GỌI API REVIEWS ===", error);
        return null;
      }
    },
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      api.delete(`/reviews/admin/${id}`, {
        data: JSON.stringify(reason),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-reviews"]);
      toast.success("Đã xóa review!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Xóa thất bại"),
  });

  const rawReviews = data?.data || [];
  const totalCount =
    data?.pagination?.total || data?.totalCount || rawReviews.length;

  const reviews = rawReviews.filter((r) => {
    const matchSearch =
      !search ||
      r.fromUserName?.toLowerCase().includes(search.toLowerCase()) ||
      r.toUserName?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase());

    let matchVis = true;
    if (visFilter === "true") matchVis = r.isVisible === true;
    if (visFilter === "false") matchVis = r.isVisible === false;

    return matchSearch && matchVis;
  });

  const avgRating = rawReviews.length
    ? (
        rawReviews.reduce((s, r) => s + (r.rating || 0), 0) / rawReviews.length
      ).toFixed(1)
    : "—";
  const hiddenCount = rawReviews.filter((r) => r.isVisible === false).length;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý Reviews
            </h1>
            <p className="text-gray-500 text-sm mt-1">{totalCount} đánh giá</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-4 py-2 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-lg font-bold text-yellow-600 flex items-center gap-1">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                {avgRating}
              </p>
              <p className="text-xs text-gray-500">Điểm TB</p>
            </div>
            <div className="text-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-lg font-bold text-gray-600">{hiddenCount}</p>
              <p className="text-xs text-gray-500">Đang ẩn</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên người đánh giá / người nhận..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả loại</option>
            <option value="job">Việc làm</option>
            <option value="project">Dự án</option>
          </select>

          <select
            value={visFilter}
            onChange={(e) => setVisFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hiển thị</option>
            <option value="false">Đang ẩn</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => {
              setRating(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} sao
              </option>
            ))}
          </select>
        </div>

        {/* List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Star size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">Không có review nào phù hợp</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                onDelete={(payload) => deleteMutation.mutate(payload)}
              />
            ))}
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
