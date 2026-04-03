import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Save,
  ArrowLeft,
  Loader2,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// ============================================
// CONSTANTS
// ============================================
const JOB_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "freelance",
];
const JOB_TYPE_LABELS = {
  "full-time": "Toàn thời gian",
  "part-time": "Bán thời gian",
  contract: "Hợp đồng",
  internship: "Thực tập",
  freelance: "Freelance",
};
const JOB_LEVELS = ["intern", "junior", "middle", "senior", "lead", "manager"];
const JOB_LEVEL_LABELS = {
  intern: "Intern",
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
  lead: "Lead",
  manager: "Manager",
};
const WORK_MODES = ["onsite", "remote", "hybrid"];
const WORK_MODE_LABELS = {
  onsite: "Tại văn phòng",
  remote: "Từ xa",
  hybrid: "Kết hợp",
};

const inputCls =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const jobService = {
  getMyJob: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post("/jobs", data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  publishJob: (id) => api.put(`/jobs/${id}/publish`),
};

export default function PostJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    benefits: "",
    location: "",
    type: "full-time",
    level: "junior",
    workMode: "onsite",
    salaryMin: "",
    salaryMax: "",
    currency: "VND",
    openings: 1,
    deadline: "",
    status: "draft",
  });

  const { data: jobData, isLoading: loadingJob } = useQuery({
    queryKey: ["editJob", id],
    queryFn: () =>
      jobService.getMyJob(id).then((r) => r.data.Data || r.data.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (jobData) {
      setForm({
        title: jobData.title || "",
        description: jobData.description || "",
        requirements: jobData.requirements || "",
        benefits: jobData.benefits || "",
        location: jobData.location || "",
        type: jobData.type || "full-time",
        level: jobData.level || "junior",
        workMode: jobData.workMode || "onsite",
        salaryMin: jobData.salaryMin || "",
        salaryMax: jobData.salaryMax || "",
        currency: jobData.currency || "VND",
        openings: jobData.openings || 1,
        deadline: jobData.deadline ? jobData.deadline.split("T")[0] : "",
        status: jobData.status || "draft",
      });
    }
  }, [jobData]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ✅ HÀM XỬ LÝ LỖI TRỰC QUAN (Dịch lỗi hệ thống sang tiếng Việt)
  const handleError = (err) => {
    const data = err.response?.data;

    if (data?.errors) {
      // Bắt các lỗi JSON conversion từ Backend (image_522e4e, image_53811c)
      const errorEntries = Object.entries(data.errors);
      errorEntries.forEach(([field, messages]) => {
        const fieldName = field.toLowerCase();
        if (fieldName.includes("salary")) {
          toast.error("Mức lương phải là số nguyên (VD: 10000000)");
        } else if (fieldName.includes("deadline")) {
          toast.error("Vui lòng chọn ngày hạn nộp hồ sơ hợp lệ");
        } else if (fieldName.includes("opening")) {
          toast.error("Số lượng tuyển dụng phải là số");
        } else {
          toast.error(messages[0]);
        }
      });
    } else {
      // Lỗi logic nghiệp vụ (Ví dụ: Chưa được phê duyệt)
      toast.error(data?.message || data?.Message || "Thao tác thất bại");
    }
  };

  // ✅ HÀM LÀM SẠCH DỮ LIỆU (Tránh gửi chuỗi rỗng "" cho trường Số/Ngày tháng)
  const getSanitizedData = (statusOverride) => {
    return {
      ...form,
      status: statusOverride || form.status,
      // Ép kiểu hoặc về null để Backend không báo lỗi JSON
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      openings: form.openings ? Number(form.openings) : 1,
      deadline: form.deadline ? form.deadline : null,
    };
  };

  const saveMutation = useMutation({
    mutationFn: (data) =>
      isEdit ? jobService.updateJob(id, data) : jobService.createJob(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["myJobs"]);
      const job = res.data.Data || res.data.data;
      toast.success(isEdit ? "Cập nhật thành công!" : "Đã lưu nháp!");
      if (!isEdit && job?.id) navigate(`/company/jobs/${job.id}/edit`);
    },
    onError: handleError,
  });

  const publishMutation = useMutation({
    mutationFn: async (sanitizedData) => {
      if (!isEdit) {
        const res = await jobService.createJob(sanitizedData);
        const job = res.data.Data || res.data.data;
        await jobService.publishJob(job.id);
        return job;
      } else {
        await jobService.updateJob(id, sanitizedData);
        if (jobData?.status === "draft") await jobService.publishJob(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["myJobs"]);
      toast.success("Tin tuyển dụng đã được đăng công khai! 🚀");
      navigate("/company/jobs");
    },
    onError: handleError,
  });

  const validate = () => {
    if (!form.title?.trim())
      return (toast.error("Vui lòng nhập tiêu đề"), false);
    if (!form.description?.trim())
      return (toast.error("Vui lòng nhập mô tả"), false);
    if (!form.location?.trim())
      return (toast.error("Vui lòng nhập địa điểm"), false);
    return true;
  };

  if (isEdit && loadingJob)
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/company/jobs")}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? "Chỉnh sửa tin" : "Đăng tin mới"}
          </h1>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <Field label="Tiêu đề công việc" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Loại hình">
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className={inputCls}
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {JOB_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cấp bậc">
                <select
                  value={form.level}
                  onChange={(e) => set("level", e.target.value)}
                  className={inputCls}
                >
                  {JOB_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {JOB_LEVEL_LABELS[l]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hình thức">
                <select
                  value={form.workMode}
                  onChange={(e) => set("workMode", e.target.value)}
                  className={inputCls}
                >
                  {WORK_MODES.map((m) => (
                    <option key={m} value={m}>
                      {WORK_MODE_LABELS[m]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Địa điểm" required>
              <div className="relative">
                <MapPin
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  className={`${inputCls} pl-8`}
                />
              </div>
            </Field>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Lương tối thiểu">
                <input
                  type="number"
                  value={form.salaryMin}
                  onChange={(e) => set("salaryMin", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Lương tối đa">
                <input
                  type="number"
                  value={form.salaryMax}
                  onChange={(e) => set("salaryMax", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Đơn vị">
                <select
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  className={inputCls}
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </Field>
              <Field label="Số vị trí">
                <input
                  type="number"
                  value={form.openings}
                  onChange={(e) => set("openings", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Hạn nộp hồ sơ">
              <div className="relative">
                <Calendar
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                  className={`${inputCls} pl-8`}
                />
              </div>
            </Field>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <Field label="Mô tả công việc" required>
              <textarea
                rows={6}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </Field>
            <Field label="Yêu cầu">
              <textarea
                rows={5}
                value={form.requirements}
                onChange={(e) => set("requirements", e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </Field>
            <Field label="Quyền lợi">
              <textarea
                rows={4}
                value={form.benefits}
                onChange={(e) => set("benefits", e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                validate() && saveMutation.mutate(getSanitizedData("draft"))
              }
              disabled={saveMutation.isPending || publishMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}{" "}
              Lưu nháp
            </button>
            <button
              onClick={() =>
                validate() && publishMutation.mutate(getSanitizedData())
              }
              disabled={saveMutation.isPending || publishMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm disabled:opacity-70"
            >
              {publishMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Eye size={14} />
              )}{" "}
              {isEdit && jobData?.status !== "draft"
                ? "Cập nhật tin"
                : "Đăng tin ngay"}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
