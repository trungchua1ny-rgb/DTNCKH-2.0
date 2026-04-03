import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import notificationService from "../../services/notificationService";
import { useAuth } from "../../contexts/AuthContext";

export default function NotificationBell() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: () =>
      notificationService
        .getUnreadCount()
        .then((r) => r.data.data?.unreadCount || 0),
    enabled: !!user,
    refetchInterval: 30000, // Poll 30 giây
  });

  const count = data || 0;

  return (
    <Link
      to="/notifications"
      className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
    >
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
