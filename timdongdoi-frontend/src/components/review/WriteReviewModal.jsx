/**
 * WriteReviewModal — modal viết/sửa đánh giá
 * Props:
 *   type: "job" | "project"
 *   applicationId?: number  (nếu type=job)
 *   projectMemberId?: number (nếu type=project)
 *   toUserId: number
 *   toUserName: string
 *   existingReview?: ReviewDto (nếu đang sửa)
 *   onClose: () => void
 *   onSuccess: () => void
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star, X, Briefcase, Rocket, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import reviewService from "../../services/reviewService";

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={
              s <= (hover || value)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-200 fill-gray-200"
            }
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-semibold text-gray-600">
        {hover || value
          ? ["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Xuất sắc"][
              hover || value
            ]
          : "Chọn số sao"}
      </span>
    </div>
  );
}

const RATING_LABELS = ["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Xuất sắc"];

export default function WriteReviewModal({
  type,
  applicationId,
  projectMemberId,
  toUserId,
  toUserName,
  existingReview,
  onClose,
  onSuccess,
}) {
  const isEditing = !!existingReview;
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");

  const MIN_COMMENT = 20;
  const MAX_COMMENT = 2000;
  const commentLen = comment.trim().length;
  const isValid =
    rating > 0 && commentLen >= MIN_COMMENT && commentLen <= MAX_COMMENT;

  const createMutation = useMutation({
    mutationFn: () =>
      type === "job"
        ? reviewService.createJobReview({
            applicationId,
            toUserId,
            rating,
            comment,
          })
        : reviewService.createProjectReview({
            projectMemberId,
            toUserId,
            rating,
            comment,
          }),
    onSuccess: () => {
      toast.success("Đánh giá thành công!");
      onSuccess();
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Đánh giá thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      reviewService.updateReview(existingReview.id, { rating, comment }),
    onSuccess: () => {
      toast.success("Đã cập nhật đánh giá!");
      onSuccess();
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Cập nhật thất bại"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    if (isEditing) updateMutation.mutate();
    else createMutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {type === "job" ? (
              <Briefcase size={18} className="text-blue-500" />
            ) : (
              <Rocket size={18} className="text-violet-500" />
            )}
            <h2 className="text-base font-bold text-gray-800">
              {isEditing ? "Sửa đánh giá" : "Viết đánh giá"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Recipient */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            <span className="text-sm text-gray-500">Đánh giá:</span>
            <span className="text-sm font-semibold text-gray-800">
              {toUserName}
            </span>
            <span
              className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                type === "job"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-violet-50 text-violet-600"
              }`}
            >
              {type === "job" ? "Việc làm" : "Dự án"}
            </span>
          </div>

          {/* Stars */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Đánh giá <span className="text-red-500">*</span>
            </label>
            <StarPicker value={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {RATING_LABELS[rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nhận xét <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về người này... (tối thiểu 20 ký tự)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              {commentLen < MIN_COMMENT && commentLen > 0 ? (
                <p className="text-xs text-red-400">
                  Cần thêm {MIN_COMMENT - commentLen} ký tự nữa
                </p>
              ) : (
                <span />
              )}
              <p
                className={`text-xs ml-auto ${commentLen > MAX_COMMENT ? "text-red-400" : "text-gray-400"}`}
              >
                {commentLen}/{MAX_COMMENT}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium text-sm rounded-xl hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isValid || isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isPending && <Loader2 size={15} className="animate-spin" />}
              {isEditing ? "Cập nhật" : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
