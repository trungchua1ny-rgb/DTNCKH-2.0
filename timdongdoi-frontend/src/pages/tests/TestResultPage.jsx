import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Target,
  FileText,
  AlertTriangle,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { testService } from "../../services/testService";

// applicationId từ URL — lấy toàn bộ tests của application đó
export default function TestResultPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["app-test-results", applicationId],
    queryFn: () =>
      testService.getMyApplicationTests(applicationId).then((r) => r.data.data),
  });

  const tests = data || [];
  const completed = tests.filter((t) => t.status === "completed");

  if (isLoading)
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Kết quả bài test
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Tổng quan các bài test trong đơn ứng tuyển của bạn
        </p>

        {tests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <FileText size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">Không có bài test nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((t) => (
              <TestResultCard key={t.id} test={t} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function TestResultCard({ test: t }) {
  const completed = t.status === "completed";
  const percent =
    t.passingScore && t.score !== null
      ? Math.round((t.score / t.passingScore) * 100)
      : null;
  const passed = t.passed;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-6 ${
        completed
          ? passed
            ? "border-green-200"
            : "border-red-200"
          : "border-gray-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-gray-800">{t.testTitle}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {t.durationMinutes && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} />
                {t.durationMinutes} phút
              </span>
            )}
            {t.passingScore && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Target size={11} />
                Điểm đạt: {t.passingScore}
              </span>
            )}
          </div>
        </div>

        {/* Status badge */}
        {completed ? (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shrink-0 ${
              passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
            }`}
          >
            {passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {passed ? "Đạt" : "Chưa đạt"}
          </div>
        ) : t.status === "in_progress" ? (
          <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 shrink-0">
            Đang làm
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 shrink-0">
            Chưa làm
          </span>
        )}
      </div>

      {/* Score section */}
      {completed && t.score !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Điểm của bạn</span>
            <span
              className={`text-2xl font-extrabold ${passed ? "text-green-600" : "text-red-500"}`}
            >
              {t.score}
              {t.passingScore && (
                <span className="text-base font-normal text-gray-400">
                  /{t.passingScore}
                </span>
              )}
            </span>
          </div>
          {t.passingScore && (
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${passed ? "bg-green-500" : "bg-red-400"}`}
                style={{
                  width: `${Math.min((t.score / t.passingScore) * 100, 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Time info */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        {t.startedAt && (
          <span>Bắt đầu: {new Date(t.startedAt).toLocaleString("vi-VN")}</span>
        )}
        {t.completedAt && (
          <span>
            Hoàn thành: {new Date(t.completedAt).toLocaleString("vi-VN")}
          </span>
        )}
      </div>

      {/* CTA nếu chưa làm */}
      {(t.status === "pending" ||
        t.status === "assigned" ||
        t.status === "in_progress") && (
        <Link
          to={`/tests/${t.id}/take`}
          className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-sm text-sm"
        >
          <FileText size={15} />
          {t.status === "in_progress" ? "Tiếp tục làm bài" : "Bắt đầu làm bài"}
        </Link>
      )}
    </div>
  );
}
