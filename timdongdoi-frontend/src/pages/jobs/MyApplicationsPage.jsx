  import { useState } from "react";
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import {
    BriefcaseBusiness,
    Trash2,
    ChevronRight,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
  } from "lucide-react";
  import { Link } from "react-router-dom";
  import { toast } from "react-hot-toast";
  import MainLayout from "../../components/layout/MainLayout";
  import LoadingSpinner from "../../components/common/LoadingSpinner";
  import EmptyState from "../../components/common/EmptyState";
  import ConfirmModal from "../../components/common/ConfirmModal";
  import { jobService } from "../../services/jobService";
  import { testService } from "../../services/testService";
  import { formatDate } from "../../utils/helpers";

  // ── Test status info ───────────────────────────────────────────────────────────
  const TEST_STATUS = {
    pending: {
      label: "Chưa làm",
      color: "bg-orange-100 text-orange-700",
      icon: AlertTriangle,
    },
    assigned: {
      label: "Chưa làm",
      color: "bg-orange-100 text-orange-700",
      icon: AlertTriangle,
    },
    in_progress: {
      label: "Đang làm",
      color: "bg-blue-100 text-blue-700",
      icon: Clock,
    },
    completed: {
      label: "Đã hoàn thành",
      color: "bg-green-100 text-green-700",
      icon: CheckCircle2,
    },
  };

  // ── Test Section trong mỗi application ────────────────────────────────────────
  function ApplicationTests({ applicationId }) {
    const [open, setOpen] = useState(false);

    const { data, isLoading } = useQuery({
      queryKey: ["app-tests", applicationId],
      queryFn: () =>
        testService.getMyApplicationTests(applicationId).then((r) => r.data.data),
      enabled: open,
    });

    const tests = data || [];
    const pendingCount = tests.filter(
      (t) =>
        t.status === "pending" ||
        t.status === "assigned" ||
        t.status === "in_progress",
    ).length;

    return (
      <div className="mt-3 border-t border-gray-100 pt-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition font-medium"
        >
          <FileText size={14} />
          Bài test
          {pendingCount > 0 && !open && (
            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
              {pendingCount} chờ làm
            </span>
          )}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {open && (
          <div className="mt-2 space-y-2">
            {isLoading ? (
              <p className="text-xs text-gray-400">Đang tải...</p>
            ) : tests.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Không có bài test nào cho đơn này
              </p>
            ) : (
              tests.map((t) => {
                const statusInfo =
                  TEST_STATUS[t.status?.toLowerCase()] || TEST_STATUS.pending;
                const StatusIcon = statusInfo.icon;
                const canTake =
                  t.status === "pending" ||
                  t.status === "assigned" ||
                  t.status === "in_progress";

                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${
                      canTake
                        ? "border-orange-200 bg-orange-50"
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {t.testTitle}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}
                        >
                          <StatusIcon size={10} />
                          {statusInfo.label}
                        </span>
                        {t.durationMinutes && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            {t.durationMinutes} phút
                          </span>
                        )}
                        {t.score !== null && t.score !== undefined && (
                          <span
                            className={`text-xs font-semibold ${t.passed ? "text-green-600" : "text-red-500"}`}
                          >
                            {t.passed ? "✓" : "✗"} {t.score}/{t.passingScore} điểm
                          </span>
                        )}
                      </div>
                    </div>

                    {canTake && (
                      <Link
                        to={`/tests/${t.id}/take`}
                        className="ml-3 flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition shrink-0"
                      >
                        <FileText size={13} />
                        {t.status === "in_progress" ? "Tiếp tục" : "Làm bài"}
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Main Page ──────────────────────────────────────────────────────────────────
  export default function MyApplicationsPage() {
    const queryClient = useQueryClient();
    const [selectedAppId, setSelectedAppId] = useState(null);

    const { data: response, isLoading } = useQuery({
      queryKey: ["my-applications"],
      queryFn: () => jobService.getMyApplications().then((r) => r.data),
    });

    const withdrawMutation = useMutation({
      mutationFn: (id) => jobService.withdrawApplication(id),
      onSuccess: () => {
        queryClient.invalidateQueries(["my-applications"]);
        toast.success("Đã rút đơn ứng tuyển thành công");
        setSelectedAppId(null);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Không thể rút đơn lúc này");
      },
    });

    const applications = response?.data || [];

    if (isLoading)
      return (
        <MainLayout>
          <LoadingSpinner />
        </MainLayout>
      );

    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Đơn ứng tuyển của tôi
          </h1>

          {applications.length === 0 ? (
            <EmptyState
              icon={<BriefcaseBusiness size={64} className="text-gray-200" />}
              title="Chưa có đơn ứng tuyển"
              description="Bạn chưa nộp đơn vào công việc nào."
              action={
                <Link
                  to="/jobs"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold"
                >
                  Tìm việc ngay
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-4">
                      {/* Logo */}
                      <div className="w-14 h-14 rounded-xl bg-gray-50 border flex items-center justify-center shrink-0">
                        {app.job?.companyLogo ? (
                          <img
                            src={`http://localhost:5024${app.job.companyLogo}`}
                            alt=""
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <BriefcaseBusiness className="text-gray-300" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-800">
                          {app.job?.title || "Vị trí tuyển dụng"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {app.job?.companyName}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-gray-400">
                            Ngày nộp: {formatDate(app.createdAt)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-medium ${getStatusStyle(app.status)}`}
                          >
                            {getStatusLabel(app.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Link
                        to={`/my-applications/${app.id}`}
                        className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        Chi tiết
                      </Link>
                      {app.status?.toLowerCase() === "pending" && (
                        <button
                          onClick={() => setSelectedAppId(app.id)}
                          disabled={withdrawMutation.isPending}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Rút đơn"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <Link
                        to={`/jobs/${app.jobId}`}
                        className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"
                        title="Xem tin tuyển dụng"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </div>
                  </div>

                  {/* ✅ Test section — lazy load khi click */}
                  <ApplicationTests applicationId={app.id} />
                </div>
              ))}
            </div>
          )}

          <ConfirmModal
            isOpen={!!selectedAppId}
            onClose={() => setSelectedAppId(null)}
            onConfirm={() => withdrawMutation.mutate(selectedAppId)}
            title="Xác nhận rút đơn"
            message="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn rút hồ sơ?"
            isLoading={withdrawMutation.isPending}
          />
        </div>
      </MainLayout>
    );
  }

  function getStatusLabel(status) {
    const labels = {
      pending: "Chờ xem xét",
      reviewed: "Đang xem xét",
      accepted: "Đã chấp nhận",
      rejected: "Từ chối",
    };
    return labels[status?.toLowerCase()] || status;
  }

  function getStatusStyle(status) {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-50 text-yellow-600";
      case "reviewed":
        return "bg-blue-50 text-blue-600";
      case "accepted":
        return "bg-green-50 text-green-600";
      case "rejected":
        return "bg-red-50 text-red-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  }
