import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import notificationService from "../../services/notificationService";
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  BriefcaseBusiness,
  Users,
  MessageSquare,
  Star,
  Info,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

// ============================================
// CONSTANTS
// ============================================
const TYPE_CONFIG = {
  job_application: {
    icon: <BriefcaseBusiness size={16} />,
    color: "bg-blue-50 text-blue-500",
  },
  application_status: {
    icon: <BriefcaseBusiness size={16} />,
    color: "bg-green-50 text-green-500",
  },
  project_application: {
    icon: <Users size={16} />,
    color: "bg-indigo-50 text-indigo-500",
  },
  project_status: {
    icon: <Users size={16} />,
    color: "bg-purple-50 text-purple-500",
  },
  message: {
    icon: <MessageSquare size={16} />,
    color: "bg-yellow-50 text-yellow-500",
  },
  review: { icon: <Star size={16} />, color: "bg-orange-50 text-orange-500" },
  system: { icon: <Info size={16} />, color: "bg-gray-100 text-gray-500" },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.system;
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Date.now() - d;
  if (diff < 60000) return "Vừa xong";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

// ============================================
// NOTIFICATION ITEM
// ============================================
function NotificationItem({ notif, onRead, onDelete, isDeleting }) {
  const cfg = getTypeConfig(notif.type);
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-2xl border transition group cursor-pointer
        ${notif.isRead ? "bg-white border-gray-100" : "bg-blue-50/40 border-blue-100"}`}
      onClick={() => !notif.isRead && onRead(notif.id)}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p
              className={`text-sm ${notif.isRead ? "text-gray-700" : "text-gray-900 font-semibold"}`}
            >
              {notif.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {notif.content}
            </p>
          </div>
          {!notif.isRead && (
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {formatTime(notif.createdAt)}
        </p>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notif.id);
        }}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition flex-shrink-0"
      >
        {isDeleting ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Trash2 size={13} />
        )}
      </button>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page, unreadOnly],
    queryFn: () =>
      notificationService
        .getNotifications({
          page,
          pageSize: 20,
          unreadOnly: unreadOnly || undefined,
        })
        .then((r) => r.data.data),
  });

  const notifications = data?.notifications || [];
  const totalCount = data?.totalCount || 0;
  const unreadCount = data?.unreadCount || 0;
  const hasMore = page * 20 < totalCount;

  const invalidate = () => {
    queryClient.invalidateQueries(["notifications"]);
    queryClient.invalidateQueries(["unreadCount"]);
  };

  const readMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: invalidate,
  });

  const readAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      invalidate();
      toast.success("Đã đánh dấu tất cả là đã đọc");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.deleteNotification(id),
    onSuccess: () => {
      invalidate();
      setDeletingId(null);
    },
    onError: () => {
      toast.error("Xóa thất bại");
      setDeletingId(null);
    },
  });

  const handleDelete = (id) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Thông báo</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => readAllMutation.mutate()}
                disabled={readAllMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
              >
                {readAllMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCheck size={13} />
                )}
                Đọc tất cả
              </button>
            )}
            <button
              onClick={() => {
                setUnreadOnly((v) => !v);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition border ${
                unreadOnly
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Filter size={13} /> Chưa đọc
            </button>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Bell size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              {unreadOnly
                ? "Không có thông báo chưa đọc"
                : "Chưa có thông báo nào"}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onRead={(id) => readMutation.mutate(id)}
                  onDelete={handleDelete}
                  isDeleting={deletingId === notif.id}
                />
              ))}
            </div>

            {hasMore && (
              <button
                onClick={() => setPage((p) => p + 1)}
                className="w-full py-3 text-sm text-blue-600 hover:text-blue-700 font-medium bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition shadow-sm"
              >
                Xem thêm
              </button>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
