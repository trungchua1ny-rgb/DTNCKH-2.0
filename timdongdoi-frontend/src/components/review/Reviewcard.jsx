/**
 * ReviewCard — hiển thị 1 đánh giá
 * Props:
 * review: ReviewDto
 * onDelete?: (id) => void
 * onToggleVisibility?: (id) => void
 * onEdit?: (review) => void
 * isOwnProfile?: boolean
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  Briefcase,
  Rocket,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  MoreVertical,
  Flag, // ✅ Thêm icon Flag cho nút Báo cáo
} from "lucide-react";
import { formatTimeAgo, getAvatarFallback } from "../../utils/helpers";
import ReportModal from "../common/ReportModal"; // ✅ Import Modal báo cáo

const API_BASE = "http://localhost:5024";

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={
            s <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
    </div>
  );
}

export default function ReviewCard({
  review,
  onDelete,
  onToggleVisibility,
  onEdit,
  isOwnProfile, // Truyền prop này để format hiển thị trạng thái Ẩn/Hiện chuẩn hơn
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); // ✅ State quản lý popup báo cáo

  const typeInfo =
    review.type === "job"
      ? {
          icon: <Briefcase size={12} />,
          label: review.jobTitle || "Việc làm",
          color: "bg-blue-50 text-blue-600",
        }
      : {
          icon: <Rocket size={12} />,
          label: review.projectTitle || "Dự án",
          color: "bg-violet-50 text-violet-600",
        };

  const avatarSrc = review.fromUserAvatar
    ? `${API_BASE}${review.fromUserAvatar}`
    : null;

  // ✅ Luôn hiện dấu 3 chấm vì tính năng "Báo cáo" áp dụng cho mọi tài khoản
  const hasActions = true;

  return (
    <div
      className={`bg-white rounded-2xl border p-5 transition-all ${
        review.isVisible
          ? "border-gray-100 shadow-sm"
          : "border-gray-200 opacity-60 bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link to={`/profile/${review.fromUserId}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              getAvatarFallback(review.fromUserName)
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                to={`/profile/${review.fromUserId}`}
                className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors"
              >
                {review.fromUserName}
              </Link>
              {review.fromUserJobTitle && (
                <p className="text-xs text-gray-400">
                  {review.fromUserJobTitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <StarRating rating={review.rating} />
              {hasActions && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 overflow-hidden">
                        {onEdit && review.canEdit && (
                          <button
                            onClick={() => {
                              onEdit(review);
                              setMenuOpen(false);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 size={14} /> Chỉnh sửa
                          </button>
                        )}

                        {onToggleVisibility && (
                          <button
                            onClick={() => {
                              onToggleVisibility(review.id);
                              setMenuOpen(false);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {review.isVisible ? (
                              <>
                                <EyeOff size={14} /> Ẩn đánh giá
                              </>
                            ) : (
                              <>
                                <Eye size={14} /> Hiện đánh giá
                              </>
                            )}
                          </button>
                        )}

                        {onDelete && review.canDelete && (
                          <button
                            onClick={() => {
                              onDelete(review.id);
                              setMenuOpen(false);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        )}

                        {/* ✅ Nút Báo cáo */}
                        <button
                          onClick={() => {
                            setShowReportModal(true);
                            setMenuOpen(false);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 border-t border-gray-50 transition-colors"
                        >
                          <Flag size={14} /> Báo cáo
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Type badge */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}
            >
              {typeInfo.icon} {typeInfo.label}
            </span>
            {review.companyName && (
              <span className="text-xs text-gray-400">
                • {review.companyName}
              </span>
            )}
            {!review.isVisible && (
              <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                <EyeOff size={10} /> Đang bị ẩn
              </span>
            )}
          </div>

          {/* Comment */}
          <p className="text-sm text-gray-700 mt-2 leading-relaxed">
            {review.comment}
          </p>

          {/* Time */}
          <p className="text-xs text-gray-400 mt-2">
            {formatTimeAgo(review.createdAt)}
          </p>
        </div>
      </div>

      {/* ✅ Modal Báo cáo */}
      {showReportModal && (
        <ReportModal
          type="review"
          targetId={review.id}
          targetName={`Đánh giá của ${review.fromUserName}`}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
