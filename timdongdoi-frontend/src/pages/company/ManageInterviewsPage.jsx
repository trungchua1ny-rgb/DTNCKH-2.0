import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Video,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  MessageSquare,
  Search,
  User,
  ChevronDown,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import { testService } from "../../services/testService";
import api from "../../services/api";

const STATUS_INFO = {
  scheduled: { label: "Đã lên lịch", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-600" },
};

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputCls =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

// ── Applicant Picker ───────────────────────────────────────────────────────────
function ApplicantPicker({ value, onChange }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState("");

  const { data: jobsData } = useQuery({
    queryKey: ["company-jobs-picker"],
    queryFn: () =>
      api
        .get("/jobs/my", { params: { pageSize: 100 } })
        .then((r) => r.data.Data || r.data.data || []),
  });

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ["job-apps-picker", selectedJobId],
    queryFn: () =>
      api
        .get(`/applications/jobs/${selectedJobId}`, {
          params: { pageSize: 100 },
        })
        .then((r) => r.data.Data || r.data.data || []),
    enabled: !!selectedJobId,
  });

  const jobs = jobsData || [];
  const apps = (appsData || []).filter((a) => {
    const name = (a.user || a.applicant)?.fullName?.toLowerCase() || "";
    return !search || name.includes(search.toLowerCase());
  });

  // Tìm tên ứng viên đã chọn từ tất cả apps
  const selectedApp = apps.find((a) => a.id === value);
  const applicantName = selectedApp
    ? (selectedApp.user || selectedApp.applicant)?.fullName
    : null;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Ứng viên <span className="text-red-500">*</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-sm transition text-left ${
          value
            ? "border-blue-300 bg-blue-50 text-blue-700 font-medium"
            : "border-gray-200 text-gray-400"
        } focus:outline-none`}
      >
        <span className="flex items-center gap-2">
          <User size={15} />
          {applicantName || (value ? `Ứng viên #${value}` : "Chọn ứng viên...")}
        </span>
        <ChevronDown
          size={15}
          className={`transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
            {/* Step 1: Chọn job */}
            <div className="p-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                1. Chọn tin tuyển dụng
              </p>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  setSelectedJobId(e.target.value);
                  setSearch("");
                  onChange(null);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- Chọn tin tuyển dụng --</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Tìm + chọn ứng viên */}
            {selectedJobId && (
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  2. Chọn ứng viên
                </p>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm tên ứng viên..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="max-h-56 overflow-y-auto">
              {!selectedJobId ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  <User size={28} className="mx-auto mb-2 opacity-30" />
                  Chọn tin tuyển dụng để xem danh sách ứng viên
                </div>
              ) : appsLoading ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  Đang tải...
                </div>
              ) : apps.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  {search
                    ? "Không tìm thấy ứng viên"
                    : "Tin này chưa có ứng viên"}
                </div>
              ) : (
                apps.map((app) => {
                  const applicant = app.user || app.applicant;
                  const isSelected = app.id === value;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        onChange(app.id);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-0 ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                        {applicant?.avatar ? (
                          <img
                            src={`http://localhost:5024${applicant.avatar}`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          applicant?.fullName?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {applicant?.fullName || "Ứng viên"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {applicant?.jobTitle || "—"} · Đơn #{app.id}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          app.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : app.status === "pending"
                              ? "bg-yellow-100 text-yellow-600"
                              : app.status === "interview"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {app.status}
                      </span>
                      {isSelected && (
                        <CheckCircle
                          size={16}
                          className="text-blue-500 shrink-0"
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Create Interview Modal ─────────────────────────────────────────────────────
function CreateInterviewModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    applicationId: null,
    title: "",
    description: "",
    scheduledAt: "",
    durationMinutes: 60,
    meetingLink: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.applicationId) {
      setError("Vui lòng chọn ứng viên");
      return;
    }
    if (!form.title.trim()) {
      setError("Vui lòng nhập tiêu đề");
      return;
    }
    if (!form.scheduledAt) {
      setError("Vui lòng chọn thời gian");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await testService.createInterview({
        applicationId: Number(form.applicationId),
        title: form.title,
        description: form.description || null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes) || null,
        meetingLink: form.meetingLink || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Tạo lịch thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Lên lịch phỏng vấn
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Chọn ứng viên từ danh sách đơn ứng tuyển
          </p>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* ✅ Chọn ứng viên trực quan */}
            <ApplicantPicker
              value={form.applicationId}
              onChange={(val) => setForm((p) => ({ ...p, applicationId: val }))}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tiêu đề buổi phỏng vấn <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="VD: Phỏng vấn vòng 1 - Kỹ thuật"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mô tả
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                className={`${inputCls} resize-none`}
                placeholder="Ghi chú về buổi phỏng vấn..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Thời gian <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, scheduledAt: e.target.value }))
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Thời lượng (phút)
                </label>
                <input
                  type="number"
                  min={15}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, durationMinutes: e.target.value }))
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Link phòng họp
              </label>
              <input
                value={form.meetingLink}
                onChange={(e) =>
                  setForm((p) => ({ ...p, meetingLink: e.target.value }))
                }
                placeholder="https://meet.google.com/..."
                className={inputCls}
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Đang tạo..." : "Lên lịch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Feedback Modal ─────────────────────────────────────────────────────────────
function FeedbackModal({ interview, onClose, onSubmit, isPending }) {
  const [feedback, setFeedback] = useState(interview.feedback || "");
  const [status, setStatus] = useState("completed");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">
          Nhận xét phỏng vấn
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {interview.candidateName} — {interview.jobTitle}
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Kết quả
            </label>
            <div className="flex gap-3">
              {[
                {
                  value: "completed",
                  label: "Hoàn thành",
                  icon: CheckCircle,
                  color: "text-green-600 border-green-300 bg-green-50",
                },
                {
                  value: "cancelled",
                  label: "Hủy",
                  icon: XCircle,
                  color: "text-red-600 border-red-300 bg-red-50",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                    status === opt.value
                      ? opt.color
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <opt.icon size={16} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nhận xét
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Nhận xét về ứng viên..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={() => onSubmit({ feedback, status })}
            disabled={isPending}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isPending ? "Đang lưu..." : "Lưu nhận xét"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ManageInterviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatus] = useState("");
  const [searchName, setSearchName] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["company-interviews", page, statusFilter],
    queryFn: () =>
      testService
        .getInterviews({
          page,
          pageSize: 20,
          status: statusFilter || undefined,
        })
        .then((r) => r.data.data),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ id, data }) => testService.submitFeedback(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["company-interviews"]);
      setFeedbackModal(null);
    },
    onError: (err) => alert(err.response?.data?.message || "Thất bại"),
  });

  const allInterviews = data?.interviews || [];
  const interviews = allInterviews.filter(
    (i) =>
      !searchName ||
      i.candidateName?.toLowerCase().includes(searchName.toLowerCase()),
  );
  const totalCount = data?.totalCount || 0;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý phỏng vấn
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {totalCount} buổi phỏng vấn
            </p>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition shadow-md"
          >
            <Plus size={16} /> Lên lịch phỏng vấn
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Tìm tên ứng viên..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "", label: "Tất cả" },
              { value: "scheduled", label: "Đã lên lịch" },
              { value: "completed", label: "Hoàn thành" },
              { value: "cancelled", label: "Đã hủy" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setStatus(f.value);
                  setPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
                  statusFilter === f.value
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : interviews.length === 0 ? (
          <EmptyState
            icon={<Calendar size={64} />}
            title={
              searchName
                ? "Không tìm thấy ứng viên"
                : "Chưa có buổi phỏng vấn nào"
            }
            description={
              searchName
                ? `Không có phỏng vấn nào với "${searchName}"`
                : "Lên lịch phỏng vấn với ứng viên để tiếp tục quy trình tuyển dụng"
            }
          />
        ) : (
          <div className="space-y-3">
            {interviews.map((i) => {
              const statusInfo = STATUS_INFO[i.status] || STATUS_INFO.scheduled;
              const isUpcoming =
                i.status === "scheduled" &&
                new Date(i.scheduledAt) > new Date();
              return (
                <div
                  key={i.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 ${
                    isUpcoming
                      ? "border-blue-200 ring-1 ring-blue-100"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {i.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                        {isUpcoming && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white shrink-0">
                            Sắp tới
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-blue-600 font-medium mb-1">
                        {i.jobTitle}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {i.candidateName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          {i.candidateName}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDateTime(i.scheduledAt)}
                        </span>
                        {i.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {i.durationMinutes} phút
                          </span>
                        )}
                      </div>
                      {i.description && (
                        <p className="text-sm text-gray-500 mt-2">
                          {i.description}
                        </p>
                      )}
                      {i.feedback && (
                        <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-xs font-medium text-gray-500 mb-0.5">
                            Nhận xét:
                          </p>
                          <p className="text-sm text-gray-700">{i.feedback}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {i.meetingLink && (
                        <a
                          href={i.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition"
                        >
                          <Video size={13} /> Vào phòng{" "}
                          <ExternalLink size={11} />
                        </a>
                      )}
                      {i.status === "scheduled" && (
                        <button
                          onClick={() => setFeedbackModal(i)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-200 transition"
                        >
                          <MessageSquare size={13} /> Nhận xét
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          page={page}
          pageSize={20}
          total={totalCount}
          onChange={setPage}
        />
      </div>

      {createModal && (
        <CreateInterviewModal
          onClose={() => setCreateModal(false)}
          onSuccess={() => {
            setCreateModal(false);
            queryClient.invalidateQueries(["company-interviews"]);
          }}
        />
      )}

      {feedbackModal && (
        <FeedbackModal
          interview={feedbackModal}
          onClose={() => setFeedbackModal(null)}
          onSubmit={(data) =>
            feedbackMutation.mutate({ id: feedbackModal.id, data })
          }
          isPending={feedbackMutation.isPending}
        />
      )}
    </MainLayout>
  );
}
