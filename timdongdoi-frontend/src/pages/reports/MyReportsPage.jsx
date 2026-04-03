import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { reportService } from "../../services/reportService";
import { formatTimeAgo } from "../../utils/helpers";

const STATUS_INFO = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  resolved: {
    label: "Đã xử lý",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  dismissed: {
    label: "Từ chối",
    color: "bg-gray-100 text-gray-500",
    icon: XCircle,
  },
};

const TYPE_LABEL = {
  user: "Người dùng",
  job: "Tin tuyển dụng",
  project: "Dự án",
  review: "Đánh giá",
};

export default function MyReportsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["my-reports", page],
    queryFn: () =>
      reportService
        .getMyReports({ page, pageSize: 10 })
        .then((r) => r.data.data),
  });

  const reports = data?.reports || [];
  const totalCount = data?.totalCount || 0;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo của tôi</h1>
          <p className="text-gray-500 text-sm mt-1">
            Lịch sử các báo cáo bạn đã gửi
          </p>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle size={64} />}
            title="Chưa có báo cáo nào"
            description="Bạn chưa gửi báo cáo nào. Nếu phát hiện nội dung vi phạm, hãy báo cáo để chúng tôi xử lý."
          />
        ) : (
          <>
            <div className="space-y-3">
              {reports.map((r) => {
                const statusInfo = STATUS_INFO[r.status] || STATUS_INFO.pending;
                const StatusIcon = statusInfo.icon;
                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {TYPE_LABEL[r.type] || r.type}
                          </span>
                          <span
                            className={
                              "text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 " +
                              statusInfo.color
                            }
                          >
                            <StatusIcon size={11} />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{r.reason}</p>
                        {r.adminNote && (
                          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mt-2">
                            <span className="font-medium">
                              Phản hồi từ admin:
                            </span>{" "}
                            {r.adminNote}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Clock size={11} /> Gửi {formatTimeAgo(r.createdAt)}
                          {r.resolvedAt &&
                            " · Xử lý " + formatTimeAgo(r.resolvedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              page={page}
              pageSize={10}
              total={totalCount}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}
