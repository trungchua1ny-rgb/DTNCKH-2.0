import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Send,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { testService } from "../../services/testService";

// applicationTestId lấy từ URL
export default function TakeTestPage() {
  const { applicationTestId } = useParams();
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [testData, setTestData] = useState(null);
  const [answers, setAnswers] = useState({}); // { questionId: "answer" }
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Start test mutation
  const startMutation = useMutation({
    mutationFn: () => testService.startTest(applicationTestId),
    onSuccess: (res) => {
      const data = res.data.data;
      setTestData(data);
      setTimeLeft((data.durationMinutes || 60) * 60); // seconds
      setStarted(true);
    },
    onError: (err) =>
      setError(err.response?.data?.message || "Không thể bắt đầu bài test"),
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (answersJson) =>
      testService.submitTest(applicationTestId, { answers: answersJson }),
    onSuccess: (res) => {
      setResult(res.data.data);
    },
    onError: (err) =>
      setError(err.response?.data?.message || "Nộp bài thất bại"),
  });

  // Countdown timer
  useEffect(() => {
    if (!started || timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, result]);

  const handleSubmit = useCallback(() => {
    const answersJson = JSON.stringify(answers);
    submitMutation.mutate(answersJson);
  }, [answers]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const questions = testData?.questions || [];
  const progress =
    questions.length > 0
      ? Math.round((Object.keys(answers).length / questions.length) * 100)
      : 0;

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result) {
    const passed = result.passed;
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
              passed ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {passed ? (
              <CheckCircle2 size={40} className="text-green-500" />
            ) : (
              <AlertTriangle size={40} className="text-red-500" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">
            {passed ? "Chúc mừng! Bạn đã qua bài test 🎉" : "Chưa đạt yêu cầu"}
          </h1>
          <p className="text-gray-500 mb-6">
            {passed
              ? "Kết quả sẽ được gửi tới nhà tuyển dụng."
              : "Đừng nản lòng, hãy tiếp tục cố gắng!"}
          </p>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 text-left">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-extrabold text-blue-600">
                  {result.score}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Điểm của bạn</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-gray-600">
                  {result.totalPoints}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Tổng điểm</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-orange-500">
                  {result.passingScore ?? "—"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Điểm đạt</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Tỷ lệ đúng</span>
                <span>
                  {result.totalPoints > 0
                    ? Math.round((result.score / result.totalPoints) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${passed ? "bg-green-500" : "bg-red-400"}`}
                  style={{
                    width: `${result.totalPoints > 0 ? (result.score / result.totalPoints) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-md"
          >
            Quay về trang ứng tuyển
          </button>
        </div>
      </MainLayout>
    );
  }

  // ── Before start screen ────────────────────────────────────────────────────
  if (!started) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
            <Clock size={32} className="text-blue-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">
            Sẵn sàng làm bài test?
          </h1>
          <p className="text-gray-500 mb-6">
            Đọc kỹ hướng dẫn trước khi bắt đầu
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left mb-6 space-y-3">
            <InfoRow
              icon="⏱️"
              label="Lưu ý"
              value="Bài test có thời gian giới hạn, không thể tạm dừng sau khi bắt đầu"
            />
            <InfoRow
              icon="📝"
              label="Trả lời"
              value="Chọn đáp án cho câu hỏi trắc nghiệm, nhập text cho câu tự luận"
            />
            <InfoRow
              icon="🚫"
              label="Không thoát"
              value="Nếu thoát giữa chừng, bài sẽ tự nộp khi hết giờ"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Quay lại
            </button>
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-md flex items-center justify-center gap-2"
            >
              {startMutation.isPending && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Bắt đầu làm bài
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Test screen ────────────────────────────────────────────────────────────
  const q = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const isFirst = currentQ === 0;
  const timeWarning = timeLeft !== null && timeLeft < 300; // < 5 phút

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div
        className={`sticky top-0 z-40 border-b shadow-sm ${timeWarning ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {testData?.testTitle}
            </p>
            <p className="text-xs text-gray-400">
              {questions.length} câu · {progress}% hoàn thành
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 font-mono text-lg font-bold px-3 py-1.5 rounded-xl ${
              timeWarning
                ? "bg-red-100 text-red-600"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            <Clock size={16} />
            {timeLeft !== null ? formatTime(timeLeft) : "—"}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Question nav dots */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                i === currentQ
                  ? "bg-blue-500 text-white shadow-sm"
                  : answers[questions[i]?.id?.toString()]
                    ? "bg-green-100 text-green-700"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-blue-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        {q && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-400 mb-1 block">
                  Câu {currentQ + 1}/{questions.length}
                  {q.type === "multiple_choice" && (
                    <span className="ml-2 text-blue-500">Trắc nghiệm</span>
                  )}
                  {q.type === "essay" && (
                    <span className="ml-2 text-purple-500">Tự luận</span>
                  )}
                  {q.type === "coding" && (
                    <span className="ml-2 text-green-500">Lập trình</span>
                  )}
                </span>
                <h2 className="text-base font-semibold text-gray-800 leading-relaxed">
                  {q.question}
                </h2>
              </div>
              <span className="shrink-0 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-full">
                {q.points} điểm
              </span>
            </div>

            {/* Multiple choice */}
            {q.type === "multiple_choice" &&
              (() => {
                let options = [];
                try {
                  options = JSON.parse(q.options || "[]");
                } catch {
                  options = [];
                }
                return (
                  <div className="space-y-2">
                    {options.map((opt, oi) => {
                      const val =
                        typeof opt === "object"
                          ? opt.value || opt.label || opt
                          : opt;
                      const label =
                        typeof opt === "object"
                          ? opt.label || opt.value || opt
                          : opt;
                      const selected = answers[q.id?.toString()] === val;
                      return (
                        <button
                          key={oi}
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [q.id.toString()]: val,
                            }))
                          }
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                            selected
                              ? "border-blue-400 bg-blue-50 text-blue-700 font-medium"
                              : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 text-gray-700"
                          }`}
                        >
                          <span
                            className={`inline-flex w-6 h-6 rounded-full border mr-2 items-center justify-center text-xs font-bold transition-colors ${
                              selected
                                ? "border-blue-500 bg-blue-500 text-white"
                                : "border-gray-300 text-gray-400"
                            }`}
                          >
                            {String.fromCharCode(65 + oi)}
                          </span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

            {/* Essay / Coding */}
            {(q.type === "essay" || q.type === "coding") && (
              <textarea
                rows={q.type === "coding" ? 8 : 5}
                value={answers[q.id?.toString()] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [q.id.toString()]: e.target.value,
                  }))
                }
                placeholder={
                  q.type === "coding"
                    ? "// Viết code của bạn ở đây..."
                    : "Nhập câu trả lời của bạn..."
                }
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  q.type === "coding"
                    ? "font-mono bg-gray-900 text-green-400 border-gray-700"
                    : ""
                }`}
              />
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentQ((q) => q - 1)}
            disabled={isFirst}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-40 transition text-sm"
          >
            <ArrowLeft size={16} /> Câu trước
          </button>

          {isLast ? (
            <button
              onClick={() => {
                const unanswered = questions.filter(
                  (q) => !answers[q.id?.toString()],
                );
                if (unanswered.length > 0) {
                  if (
                    !window.confirm(
                      `Còn ${unanswered.length} câu chưa trả lời. Bạn có chắc muốn nộp bài?`,
                    )
                  )
                    return;
                }
                handleSubmit();
              }}
              disabled={submitMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-md text-sm"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang nộp...
                </>
              ) : (
                <>
                  <Send size={16} /> Nộp bài
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQ((q) => q + 1)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition text-sm"
            >
              Câu tiếp <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Đã trả lời</span>
            <span className="font-semibold text-gray-700">
              {Object.keys(answers).length}/{questions.length} câu
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        <p className="text-sm text-gray-500">{value}</p>
      </div>
    </div>
  );
}
