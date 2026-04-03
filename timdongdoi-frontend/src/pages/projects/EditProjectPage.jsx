import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { projectService } from "../../services/projectService";
import {
  PROJECT_TYPES,
  COMPENSATION_TYPES,
  LOCATION_TYPES,
} from "../../utils/constants";

const inputCls =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProjectById(id).then((r) => r.data.data),
  });

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title || "",
        description: project.description || "",
        type: project.type || "",
        durationMonths: project.durationMonths || "",
        locationType: project.locationType || "",
        compensationType: project.compensationType || "",
        compensationDetails: project.compensationDetails || "",
      });
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (data) => projectService.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["project", id]);
      navigate(`/projects/${id}`);
    },
    onError: (err) =>
      setError(err.response?.data?.message || "Cập nhật thất bại"),
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Vui lòng nhập tên dự án");
      return;
    }
    if (!form.description.trim()) {
      setError("Vui lòng nhập mô tả");
      return;
    }
    setError("");
    updateMutation.mutate({
      ...form,
      durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
    });
  };

  if (isLoading || !form)
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Chỉnh sửa dự án
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <Field label="Tên dự án *">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className={inputCls}
              />
            </Field>
            <Field label="Mô tả dự án *">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Loại dự án">
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="">Chọn loại</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hình thức làm việc">
                <select
                  name="locationType"
                  value={form.locationType}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="">Chọn hình thức</option>
                  {LOCATION_TYPES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Thời gian (tháng)">
                <input
                  type="number"
                  name="durationMonths"
                  value={form.durationMonths}
                  onChange={handleChange}
                  min={1}
                  className={inputCls}
                />
              </Field>
              <Field label="Hình thức thù lao">
                <select
                  name="compensationType"
                  value={form.compensationType}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="">Chọn thù lao</option>
                  {COMPENSATION_TYPES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Chi tiết thù lao">
              <input
                name="compensationDetails"
                value={form.compensationDetails}
                onChange={handleChange}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2 shadow-md"
            >
              {updateMutation.isPending && (
                <Loader2 size={18} className="animate-spin" />
              )}
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
