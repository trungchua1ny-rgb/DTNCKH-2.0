import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { testService } from "../../services/testService";

const inputCls =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Question Editor ────────────────────────────────────────────────────────────
function QuestionEditor({ question, onSave, onDelete, isNew }) {
  const [open, setOpen] = useState(isNew);

  // Parse options từ JSON string → array
  const parseOptions = (optStr) => {
    try {
      const parsed = JSON.parse(optStr || "[]");
      return Array.isArray(parsed)
        ? parsed.map((o) =>
            typeof o === "object" ? o.label || o.value || String(o) : String(o),
          )
        : ["", "", "", ""];
    } catch {
      return ["", "", "", ""];
    }
  };

  const [form, setForm] = useState({
    question: question?.question || "",
    type: question?.type || "multiple_choice",
    options: parseOptions(question?.options), // ← array of strings
    correctAnswer: question?.correctAnswer || "",
    points: question?.points || 1,
    orderNum: question?.orderNum || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setOption = (idx, val) =>
    setForm((p) => ({
      ...p,
      options: p.options.map((o, i) => (i === idx ? val : o)),
    }));

  const addOption = () =>
    setForm((p) => ({ ...p, options: [...p.options, ""] }));

  const removeOption = (idx) =>
    setForm((p) => {
      const newOpts = p.options.filter((_, i) => i !== idx);
      // Nếu đáp án đúng bị xóa → reset
      const removed = p.options[idx];
      return {
        ...p,
        options: newOpts,
        correctAnswer: p.correctAnswer === removed ? "" : p.correctAnswer,
      };
    });

  const handleSave = async () => {
    if (!form.question.trim()) {
      setError("Vui lòng nhập câu hỏi");
      return;
    }
    if (form.type === "multiple_choice") {
      const filled = form.options.filter((o) => o.trim());
      if (filled.length < 2) {
        setError("Cần ít nhất 2 đáp án");
        return;
      }
      if (!form.correctAnswer) {
        setError("Vui lòng chọn đáp án đúng");
        return;
      }
    }
    setError("");
    setSaving(true);
    try {
      const optionsJson =
        form.type === "multiple_choice"
          ? JSON.stringify(form.options.filter((o) => o.trim()))
          : null;
      await onSave({
        question: form.question,
        type: form.type,
        options: optionsJson,
        correctAnswer:
          form.type === "multiple_choice" ? form.correctAnswer : null,
        points: Number(form.points) || 1,
        orderNum: Number(form.orderNum) || 0,
      });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <GripVertical size={16} className="text-gray-300 shrink-0" />
        <span className="flex-1 text-sm font-medium text-gray-700 truncate">
          {form.question || "(Câu hỏi chưa có nội dung)"}
        </span>
        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-gray-400">{form.points} điểm</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              form.type === "multiple_choice"
                ? "bg-blue-50 text-blue-600"
                : form.type === "essay"
                  ? "bg-purple-50 text-purple-600"
                  : "bg-green-50 text-green-600"
            }`}
          >
            {form.type === "multiple_choice"
              ? "Trắc nghiệm"
              : form.type === "essay"
                ? "Tự luận"
                : "Lập trình"}
          </span>
          {!isNew && (
            <button
              onClick={() => {
                if (window.confirm("Xóa câu hỏi này?")) onDelete();
              }}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <Field label="Nội dung câu hỏi" required>
            <textarea
              value={form.question}
              onChange={(e) =>
                setForm((p) => ({ ...p, question: e.target.value }))
              }
              rows={2}
              placeholder="Nhập nội dung câu hỏi..."
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Loại câu hỏi">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    type: e.target.value,
                    correctAnswer: "",
                  }))
                }
                className={inputCls}
              >
                <option value="multiple_choice">Trắc nghiệm</option>
                <option value="essay">Tự luận</option>
                <option value="coding">Lập trình</option>
              </select>
            </Field>
            <Field label="Điểm">
              <input
                type="number"
                min={1}
                value={form.points}
                onChange={(e) =>
                  setForm((p) => ({ ...p, points: e.target.value }))
                }
                className={inputCls}
              />
            </Field>
            <Field label="Thứ tự">
              <input
                type="number"
                min={0}
                value={form.orderNum}
                onChange={(e) =>
                  setForm((p) => ({ ...p, orderNum: e.target.value }))
                }
                className={inputCls}
              />
            </Field>
          </div>

          {/* ✅ Multiple choice — UI trực quan */}
          {form.type === "multiple_choice" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đáp án <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 font-normal ml-2">
                  (Click vào ô tròn để chọn đáp án đúng)
                </span>
              </label>
              <div className="space-y-2">
                {form.options.map((opt, i) => {
                  const isCorrect =
                    form.correctAnswer === opt && opt.trim() !== "";
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        isCorrect
                          ? "border-green-400 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Radio — chọn đáp án đúng */}
                      <button
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            correctAnswer: opt.trim() ? opt : "",
                          }))
                        }
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                          isCorrect
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-300 text-gray-400 hover:border-green-400"
                        }`}
                      >
                        {letter}
                      </button>

                      {/* Input đáp án */}
                      <input
                        value={opt}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          // Nếu đây là đáp án đúng đang được sửa → update correctAnswer theo
                          const wasCorrect = form.correctAnswer === opt;
                          setOption(i, newVal);
                          if (wasCorrect)
                            setForm((p) => ({ ...p, correctAnswer: newVal }));
                        }}
                        placeholder={`Đáp án ${letter}...`}
                        className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400 text-gray-700"
                      />

                      {/* Xóa option */}
                      {form.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Thêm đáp án */}
              {form.options.length < 8 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors"
                >
                  <Plus size={15} /> Thêm đáp án
                </button>
              )}

              {/* Hiện đáp án đúng đang chọn */}
              {form.correctAnswer && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <CheckCircle2 size={15} />
                  Đáp án đúng: <strong>"{form.correctAnswer}"</strong>
                </div>
              )}
            </div>
          )}

          {/* Essay / Coding hint */}
          {form.type === "essay" && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-sm text-purple-700">
                💡 Câu tự luận sẽ được chấm thủ công bởi nhà tuyển dụng sau khi
                ứng viên nộp bài.
              </p>
            </div>
          )}
          {form.type === "coding" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-sm text-green-700">
                💡 Câu lập trình — ứng viên sẽ viết code trực tiếp. Nhà tuyển
                dụng chấm điểm thủ công.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            {!isNew && (
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
              >
                Hủy
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-60 transition"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {saving ? "Đang lưu..." : "Lưu câu hỏi"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CreateEditTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 30,
    passingScore: "",
    status: "draft",
  });
  const [questions, setQuestions] = useState([]);
  const [showNewQ, setShowNewQ] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [testId, setTestId] = useState(id ? Number(id) : null);

  const { isLoading } = useQuery({
    queryKey: ["company-test", id],
    queryFn: async () => {
      const [testRes, qRes] = await Promise.all([
        testService.getTestById(id).then((r) => r.data.data),
        testService.getQuestions(id).then((r) => r.data.data),
      ]);
      setForm({
        title: testRes.title || "",
        description: testRes.description || "",
        durationMinutes: testRes.durationMinutes || 30,
        passingScore: testRes.passingScore || "",
        status: testRes.status || "draft",
      });
      setQuestions(qRes || []);
      return testRes;
    },
    enabled: isEdit,
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit && testId
        ? testService.updateTest(testId, data)
        : testService.createTest(data),
    onSuccess: (res) => {
      const newId = res.data.data?.id;
      if (newId && !testId) {
        setTestId(newId);
        window.history.replaceState(null, "", `/company/tests/${newId}/edit`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      queryClient.invalidateQueries(["company-tests"]);
    },
    onError: (err) => setError(err.response?.data?.message || "Lưu thất bại"),
  });

  const handleSaveTest = () => {
    if (!form.title.trim()) {
      setError("Vui lòng nhập tiêu đề bài test");
      return;
    }
    setError("");
    saveMutation.mutate({
      title: form.title,
      description: form.description,
      durationMinutes: Number(form.durationMinutes) || null,
      passingScore: form.passingScore ? Number(form.passingScore) : null,
      status: form.status,
    });
  };

  const ensureTestId = async () => {
    if (testId) return testId;
    const res = await testService.createTest({
      title: form.title || "Bài test mới",
      description: form.description,
      durationMinutes: Number(form.durationMinutes) || null,
      passingScore: form.passingScore ? Number(form.passingScore) : null,
      status: "draft",
    });
    const newId = res.data.data.id;
    setTestId(newId);
    window.history.replaceState(null, "", `/company/tests/${newId}/edit`);
    return newId;
  };

  const handleAddQuestion = async (data) => {
    const tid = await ensureTestId();
    const qRes = await testService.addQuestion(tid, data);
    setQuestions((prev) => [...prev, qRes.data.data]);
    setShowNewQ(false);
  };

  const handleUpdateQuestion = async (questionId, data) => {
    const qRes = await testService.updateQuestion(testId, questionId, data);
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? qRes.data.data : q)),
    );
  };

  const handleDeleteQuestion = async (questionId) => {
    await testService.deleteQuestion(testId, questionId);
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  if (isEdit && isLoading)
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/company/tests")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {isEdit ? "Chỉnh sửa bài test" : "Tạo bài test mới"}
        </h1>

        {/* Test info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 mb-6">
          <h2 className="font-semibold text-gray-800">Thông tin bài test</h2>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <Field label="Tiêu đề" required>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="VD: Bài test kiến thức React"
              className={inputCls}
            />
          </Field>

          <Field label="Mô tả">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={2}
              placeholder="Mô tả ngắn về bài test..."
              className={`${inputCls} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Thời gian (phút)">
              <input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, durationMinutes: e.target.value }))
                }
                className={inputCls}
              />
            </Field>
            <Field label="Điểm đạt">
              <input
                type="number"
                min={0}
                value={form.passingScore}
                onChange={(e) =>
                  setForm((p) => ({ ...p, passingScore: e.target.value }))
                }
                placeholder={`VD: ${Math.round(totalPoints * 0.7)}`}
                className={inputCls}
              />
            </Field>
            <Field label="Trạng thái">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
                className={inputCls}
              >
                <option value="draft">Nháp</option>
                <option value="active">Kích hoạt</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </Field>
          </div>

          <div className="flex items-center justify-between pt-1">
            {questions.length > 0 && (
              <p className="text-sm text-gray-400">
                {questions.length} câu · {totalPoints} điểm tổng
              </p>
            )}
            <button
              onClick={handleSaveTest}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition shadow-md text-sm ml-auto"
            >
              {saveMutation.isPending && (
                <Loader2 size={15} className="animate-spin" />
              )}
              {saved ? (
                <>
                  <CheckCircle2 size={15} /> Đã lưu!
                </>
              ) : (
                "Lưu thông tin"
              )}
            </button>
          </div>
        </div>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">
              Câu hỏi ({questions.length})
              {totalPoints > 0 && (
                <span className="text-gray-400 font-normal text-sm ml-2">
                  · {totalPoints} điểm
                </span>
              )}
            </h2>
            <button
              onClick={() => setShowNewQ(true)}
              disabled={showNewQ}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
            >
              <Plus size={15} /> Thêm câu hỏi
            </button>
          </div>

          <div className="space-y-3">
            {questions.map((q) => (
              <QuestionEditor
                key={q.id}
                question={q}
                isNew={false}
                onSave={(data) => handleUpdateQuestion(q.id, data)}
                onDelete={() => handleDeleteQuestion(q.id)}
              />
            ))}

            {showNewQ && (
              <QuestionEditor
                isNew
                question={null}
                onSave={handleAddQuestion}
                onDelete={() => setShowNewQ(false)}
              />
            )}

            {questions.length === 0 && !showNewQ && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm mb-2">
                  Chưa có câu hỏi nào
                </p>
                <button
                  onClick={() => setShowNewQ(true)}
                  className="text-sm text-blue-500 font-medium hover:underline"
                >
                  + Thêm câu hỏi đầu tiên
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
