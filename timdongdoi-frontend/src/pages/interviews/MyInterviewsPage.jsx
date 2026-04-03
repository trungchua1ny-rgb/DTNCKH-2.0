import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { testService } from "../../services/testService";

const STATUS_INFO = {
  scheduled: {
    label: "Đã lên lịch",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-600",
    icon: XCircle,
  },
};

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isUpcoming(dateStr) {
  return dateStr && new Date(dateStr) > new Date();
}

export default function MyInterviewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-interviews"],
    queryFn: () => testService.getMyInterviews().then((r) => r.data.data),
  });

  const interviews = data || [];
  const upcoming = interviews.filter(
    (i) => i.status === "scheduled" && isUpcoming(i.scheduledAt),
  );
  const past = interviews.filter(
    (i) => i.status !== "scheduled" || !isUpcoming(i.scheduledAt),
  );

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Lịch phỏng vấn</h1>
          <p className="text-gray-500 text-sm mt-1">
            Danh sách các buổi phỏng vấn của bạn
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : interviews.length === 0 ? (
          <EmptyState
            icon={<Calendar size={64} />}
            title="Chưa có lịch phỏng vấn"
            description="Khi công ty mời bạn phỏng vấn, lịch sẽ hiển thị ở đây."
          />
        ) : (
          <div className="space-y-6">
            {/* Sắp tới */}
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle size={14} className="text-blue-500" /> Sắp tới (
                  {upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((i) => (
                    <InterviewCard key={i.id} interview={i} highlight />
                  ))}
                </div>
              </div>
            )}

            {/* Đã qua */}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Đã qua ({past.length})
                </h2>
                <div className="space-y-3">
                  {past.map((i) => (
                    <InterviewCard key={i.id} interview={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function InterviewCard({ interview: i, highlight }) {
  const statusInfo = STATUS_INFO[i.status] || STATUS_INFO.scheduled;
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-5 ${
        highlight ? "border-blue-200 ring-1 ring-blue-100" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">{i.title}</h3>
          <p className="text-sm text-blue-600 font-medium">{i.jobTitle}</p>
        </div>
        <span
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusInfo.color}`}
        >
          <StatusIcon size={12} />
          {statusInfo.label}
        </span>
      </div>

      {i.description && (
        <p className="text-sm text-gray-600 mb-3">{i.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
          <Calendar size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-400">Thời gian</p>
            <p className="text-sm font-medium text-gray-700">
              {formatDateTime(i.scheduledAt)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
          <Clock size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-400">Thời lượng</p>
            <p className="text-sm font-medium text-gray-700">
              {i.durationMinutes || "—"} phút
            </p>
          </div>
        </div>
      </div>

      {i.meetingLink && i.status === "scheduled" && (
        <a
          href={i.meetingLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition justify-center mb-3"
        >
          <Video size={16} /> Tham gia phỏng vấn
          <ExternalLink size={13} />
        </a>
      )}

      {i.feedback && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-green-700 mb-1">
            Nhận xét từ nhà tuyển dụng:
          </p>
          <p className="text-sm text-green-700">{i.feedback}</p>
        </div>
      )}
    </div>
  );
}
