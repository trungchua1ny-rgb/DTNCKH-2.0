import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  FileText,
  Trophy,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  AlignLeft,
  Code2,
  CheckCircle,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { testService } from "../../services/testService";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function QuestionTypeBadge({ type }) {
  const map = {
    multiple_choice: {
      icon: <CheckSquare size={11} />,
      label: "Trắc nghiệm",
      cls: "bg-blue-50 text-blue-600",
    },
    essay: {
      icon: <AlignLeft size={11} />,
      label: "Tự luận",
      cls: "bg-purple-50 text-purple-600",
    },
    coding: {
      icon: <Code2 size={11} />,
      label: "Lập trình",
      cls: "bg-green-50 text-green-600",
    },
  };
  const t = map[type] || {
    icon: <FileText size={11} />,
    label: type,
    cls: "bg-gray-50 text-gray-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${t.cls}`}
    >
      {t.icon} {t.label}
    </span>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ q, index, manualScore, manualFeedback, onChange }) {
  const [expanded, setExpanded] = useState(true);
  const isAuto = q.isAutoGraded;

  // parse options
  let opts = [];
  try {
    opts = q.options
      ? typeof q.options === "string"
        ? JSON.parse(q.options)
        : q.options
      : [];
  } catch {}

  const isCorrect =
    isAuto &&
    q.userAnswer?.trim().toLowerCase() ===
      q.correctAnswer?.trim().toLowerCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition select-none"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
            {index + 1}
          </span>
          <QuestionTypeBadge type={q.type} />
          <p className="text-sm font-medium text-gray-800 truncate">
            {q.question}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {isAuto ? (
            isCorrect ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                <CheckCircle size={12} /> +{q.points}đ
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                <XCircle size={12} /> 0/{q.points}đ
              </span>
            )
          ) : (
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
              {manualScore != null
                ? `${manualScore}/${q.points}đ`
                : `?/${q.points}đ`}
            </span>
          )}
          {expanded ? (
            <ChevronUp size={14} className="text-gray-400" />
          ) : (
            <ChevronDown size={14} className="text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-50">
          {/* Question text */}
          <div className="pt-4">
            <p className="text-xs font-medium text-gray-400 mb-1.5">Câu hỏi</p>
            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-xl p-3">
              {q.question}
            </p>
          </div>

          {/* Options (multiple choice) */}
          {q.type === "multiple_choice" && opts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">
                Các lựa chọn
              </p>
              <div className="space-y-1.5">
                {opts.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isCorrectOpt =
                    opt === q.correctAnswer || letter === q.correctAnswer;
                  const isUserOpt =
                    opt === q.userAnswer || letter === q.userAnswer;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                        isCorrectOpt
                          ? "bg-green-50 border-green-200 text-green-800"
                          : isUserOpt
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-white border-gray-100 text-gray-600"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold flex-shrink-0 bg-white">
                        {letter}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrectOpt && (
                        <CheckCircle
                          size={13}
                          className="text-green-600 flex-shrink-0"
                        />
                      )}
                      {isUserOpt && !isCorrectOpt && (
                        <XCircle
                          size={13}
                          className="text-red-500 flex-shrink-0"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Answers */}
          <div
            className={`grid gap-4 ${q.type === "multiple_choice" && q.correctAnswer ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
          >
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">
                Câu trả lời của ứng viên
              </p>
              <div
                className={`text-sm p-3 rounded-xl border min-h-[60px] whitespace-pre-wrap leading-relaxed ${
                  q.type === "multiple_choice"
                    ? isCorrect
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-700"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                } ${q.type === "coding" ? "font-mono text-xs" : ""}`}
              >
                {q.userAnswer || (
                  <span className="text-gray-400 italic">
                    Không có câu trả lời
                  </span>
                )}
              </div>
            </div>
            {q.type === "multiple_choice" && q.correctAnswer && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1.5">
                  Đáp án đúng
                </p>
                <div className="text-sm p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 min-h-[60px]">
                  {q.correctAnswer}
                </div>
              </div>
            )}
          </div>

          {/* Manual grading */}
          {!isAuto && (
            <div className="bg-purple-50 rounded-xl p-4 space-y-3 border border-purple-100">
              <p className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                <Trophy size={14} /> Chấm điểm thủ công
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Điểm (tối đa {q.points})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={q.points}
                    value={manualScore ?? ""}
                    onChange={(e) =>
                      onChange(q.id, "score", Number(e.target.value))
                    }
                    placeholder={`0 - ${q.points}`}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    Nhận xét
                  </label>
                  <input
                    type="text"
                    value={manualFeedback ?? ""}
                    onChange={(e) => onChange(q.id, "feedback", e.target.value)}
                    placeholder="Nhận xét cho câu này..."
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function TestDetailView({ applicationTestId, onBack }) {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState({});
  const [initialized, setInitialized] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["testDetail", applicationTestId],
    queryFn: () =>
      testService
        .getApplicationTestDetail(applicationTestId)
        .then((r) => r.data.data || r.data.Data),
    enabled: !!applicationTestId,
    onSuccess: (d) => {
      if (!initialized) {
        const init = {};
        d?.questions?.forEach((q) => {
          if (!q.isAutoGraded) {
            init[q.id] = {
              score: q.manualScore ?? null,
              feedback: q.feedback ?? "",
            };
          }
        });
        setScores(init);
        setInitialized(true);
      }
    },
  });

  const scoreMutation = useMutation({
    mutationFn: (payload) =>
      testService.scoreManually(applicationTestId, payload),
    onSuccess: () => {
      toast.success("Đã lưu điểm chấm!");
      queryClient.invalidateQueries(["testDetail", applicationTestId]);
      queryClient.invalidateQueries(["company-app-test-results"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Lỗi khi lưu điểm"),
  });

  const handleChange = (questionId, field, value) => {
    setScores((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] || {}), [field]: value },
    }));
  };

  const handleSave = () => {
    const manualQs = data?.questions?.filter((q) => !q.isAutoGraded) || [];
    const payload = manualQs.map((q) => ({
      questionId: q.id,
      score: scores[q.id]?.score ?? 0,
      feedback: scores[q.id]?.feedback ?? "",
    }));
    if (payload.length === 0) {
      toast.error("Không có câu tự luận/lập trình nào cần chấm");
      return;
    }
    scoreMutation.mutate({ scores: payload });
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError || !data)
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-sm text-red-600">
        <AlertCircle size={18} /> Không thể tải chi tiết bài làm
      </div>
    );

  const hasManual = data.questions?.some((q) => !q.isAutoGraded);
  const passed = data.passed;
  const pct =
    data.score != null && data.passingScore != null
      ? Math.min(Math.round((data.score / data.passingScore) * 100), 100)
      : null;

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft size={14} /> Quay lại danh sách bài test
      </button>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {data.testTitle}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Application #{data.applicationId}
            </p>
          </div>
          {data.status === "completed" && passed != null && (
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border ${
                passed
                  ? "bg-green-50 text-green-600 border-green-200"
                  : "bg-red-50 text-red-500 border-red-200"
              }`}
            >
              {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {passed ? "Đạt yêu cầu" : "Không đạt"}
            </span>
          )}
        </div>

        {data.status === "completed" && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              {
                label: "Điểm đạt",
                value: data.score ?? "—",
                cls: "text-gray-900",
              },
              {
                label: "Điểm tối đa",
                value: data.passingScore ?? "—",
                cls: "text-gray-500",
              },
              {
                label: "Tỉ lệ",
                value: pct != null ? `${pct}%` : "—",
                cls: "text-purple-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="text-center p-3 bg-gray-50 rounded-xl"
              >
                <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {pct != null && (
          <div className="mt-4 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${passed ? "bg-green-400" : "bg-red-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-6 mt-4 text-xs text-gray-400">
          {data.startedAt && (
            <span className="flex items-center gap-1">
              <Clock size={11} /> Bắt đầu:{" "}
              {new Date(data.startedAt).toLocaleString("vi-VN")}
            </span>
          )}
          {data.completedAt && (
            <span>
              Hoàn thành: {new Date(data.completedAt).toLocaleString("vi-VN")}
            </span>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            Câu hỏi & Câu trả lời
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({data.questions?.length || 0} câu)
            </span>
          </h3>
          {hasManual && (
            <button
              onClick={handleSave}
              disabled={scoreMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60"
            >
              {scoreMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Lưu điểm
            </button>
          )}
        </div>

        {(data.questions || []).map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={i}
            manualScore={scores[q.id]?.score ?? q.manualScore}
            manualFeedback={scores[q.id]?.feedback ?? q.feedback}
            onChange={handleChange}
          />
        ))}
      </div>

      {hasManual && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={scoreMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition disabled:opacity-60"
          >
            {scoreMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Lưu điểm chấm
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Summary Box ──────────────────────────────────────────────────────────────

function SummaryBox({ label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Test Result Card ─────────────────────────────────────────────────────────

function CompanyTestResultCard({ test: t, onViewDetail }) {
  const completed = t.status === "completed";
  const passed = t.passed;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-6 ${
        !completed
          ? "border-gray-100"
          : passed
            ? "border-green-200"
            : "border-red-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">{t.testTitle}</h3>
          <div className="flex flex-wrap gap-3 mt-1">
            {t.durationMinutes && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} /> {t.durationMinutes} phút
              </span>
            )}
            {t.passingScore && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Target size={11} /> Điểm đạt: {t.passingScore}
              </span>
            )}
          </div>
        </div>
        {completed ? (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shrink-0 ${
              passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
            }`}
          >
            {passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {passed ? "Đạt" : "Không đạt"}
          </div>
        ) : t.status === "in_progress" ? (
          <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 shrink-0">
            Đang làm
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-500 shrink-0 flex items-center gap-1">
            <AlertTriangle size={13} /> Chưa làm
          </span>
        )}
      </div>

      {/* Score bar */}
      {completed && t.score != null && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Điểm số</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-3xl font-extrabold ${passed ? "text-green-600" : "text-red-500"}`}
              >
                {t.score}
              </span>
              {t.passingScore && (
                <span className="text-gray-400 text-sm">
                  / {t.passingScore}
                </span>
              )}
            </div>
          </div>
          {t.passingScore && (
            <>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${passed ? "bg-green-500" : "bg-red-400"}`}
                  style={{
                    width: `${Math.min((t.score / t.passingScore) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {Math.round((t.score / t.passingScore) * 100)}% điểm đạt
              </p>
            </>
          )}
        </div>
      )}

      {/* Time */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-3 border-t border-gray-50">
        {t.startedAt ? (
          <span>Bắt đầu: {new Date(t.startedAt).toLocaleString("vi-VN")}</span>
        ) : (
          <span className="text-orange-400">Chưa bắt đầu</span>
        )}
        {t.completedAt && (
          <span>
            Hoàn thành: {new Date(t.completedAt).toLocaleString("vi-VN")}
          </span>
        )}
      </div>

      {/* View detail button */}
      {completed && (
        <button
          onClick={() => onViewDetail(t.id)}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold rounded-xl transition border border-purple-100"
        >
          <FileText size={14} /> Xem chi tiết bài làm & Chấm điểm
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompanyApplicationTestsPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [selectedTestId, setSelectedTestId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["company-app-test-results", applicationId],
    queryFn: () =>
      testService
        .getApplicationTestResults(applicationId)
        .then((r) => r.data.data || r.data.Data || []),
  });

  const tests = Array.isArray(data) ? data : [];
  const completed = tests.filter((t) => t.status === "completed");
  const passedCount = completed.filter((t) => t.passed).length;
  const passedAll = completed.length > 0 && passedCount === completed.length;

  if (isLoading)
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Detail view */}
        {selectedTestId ? (
          <TestDetailView
            applicationTestId={selectedTestId}
            onBack={() => setSelectedTestId(null)}
          />
        ) : (
          <>
            {/* Header */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>

            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Kết quả bài test ứng viên
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Application #{applicationId}
                </p>
              </div>
              {completed.length > 0 && (
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
                    passedAll
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  <Trophy size={16} />
                  {passedCount}/{completed.length} đạt
                </div>
              )}
            </div>

            {tests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <FileText size={48} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400">Ứng viên chưa có bài test nào</p>
              </div>
            ) : (
              <>
                {completed.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <SummaryBox
                      label="Tổng bài test"
                      value={tests.length}
                      color="text-gray-800"
                      bg="bg-gray-50"
                    />
                    <SummaryBox
                      label="Đã hoàn thành"
                      value={completed.length}
                      color="text-blue-600"
                      bg="bg-blue-50"
                    />
                    <SummaryBox
                      label="Đạt yêu cầu"
                      value={passedCount}
                      color={passedAll ? "text-green-600" : "text-orange-600"}
                      bg={passedAll ? "bg-green-50" : "bg-orange-50"}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  {tests.map((t) => (
                    <CompanyTestResultCard
                      key={t.id}
                      test={t}
                      onViewDetail={setSelectedTestId}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
