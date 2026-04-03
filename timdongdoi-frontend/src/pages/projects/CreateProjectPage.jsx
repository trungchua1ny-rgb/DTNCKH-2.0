import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast"; // ✅ Thêm thư viện toast để báo lỗi/thành công mượt hơn
import MainLayout from "../../components/layout/MainLayout";
import { projectService } from "../../services/projectService";
import {
  PROJECT_TYPES,
  COMPENSATION_TYPES,
  LOCATION_TYPES,
} from "../../utils/constants";

export default function CreateProjectPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "",
    durationMonths: "",
    locationType: "",
    compensationType: "",
    compensationDetails: "",
  });
  const [positions, setPositions] = useState([
    { role: "", quantity: 1, requirements: "" },
  ]);
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: (data) => projectService.createProject(data),
    onSuccess: (res) => {
      toast.success("Tạo dự án thành công! 🎉");
      // ✅ Lấy ID an toàn bất kể backend bọc trong data hay trả trực tiếp
      const projectId = res.data?.data?.id || res.data?.id;
      if (projectId) {
        navigate(`/projects/${projectId}`);
      } else {
        navigate("/projects/manage");
      }
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || "Tạo dự án thất bại";
      setError(errorMsg);
      toast.error(errorMsg);
    },
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePositionChange = (idx, field, value) => {
    setPositions((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)),
    );
  };

  const addPosition = () =>
    setPositions((prev) => [
      ...prev,
      { role: "", quantity: 1, requirements: "" },
    ]);

  const removePosition = (idx) =>
    setPositions((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Vui lòng nhập tên dự án");
      return;
    }
    if (!form.description.trim()) {
      setError("Vui lòng nhập mô tả dự án");
      return;
    }
    if (!form.type) {
      setError("Vui lòng chọn loại dự án");
      return;
    }
    if (!form.compensationType) {
      setError("Vui lòng chọn hình thức thù lao");
      return;
    }
    if (positions.some((p) => !p.role.trim())) {
      setError("Vui lòng nhập tên vị trí cho tất cả các vị trí ứng tuyển");
      return;
    }

    setError("");

    // Ép kiểu dữ liệu an toàn trước khi gửi xuống Backend
    createMutation.mutate({
      ...form,
      durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
      positions: positions.map((p) => ({
        ...p,
        quantity: Number(p.quantity) || 1,
      })),
    });
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tạo dự án mới</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Basic info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Thông tin cơ bản</h2>

            <Field label="Tên dự án *">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="VD: App quản lý công việc cho nhóm startup"
                className={inputCls}
              />
            </Field>

            <Field label="Mô tả dự án *">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Mô tả chi tiết về dự án, mục tiêu, công nghệ sử dụng..."
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Loại dự án *">
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
                  placeholder="VD: 3"
                  min={1}
                  className={inputCls}
                />
              </Field>
              <Field label="Hình thức thù lao *">
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
                placeholder="VD: 5-10 triệu/tháng hoặc 5% cổ phần"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Positions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Vị trí tuyển dụng</h2>
              <button
                type="button"
                onClick={addPosition}
                className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                <Plus size={16} /> Thêm vị trí
              </button>
            </div>

            {positions.map((pos, idx) => (
              <div
                key={idx}
                className="border border-gray-100 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Vị trí {idx + 1}
                  </span>
                  {positions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePosition(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <input
                      value={pos.role}
                      onChange={(e) =>
                        handlePositionChange(idx, "role", e.target.value)
                      }
                      placeholder="Tên vị trí (VD: Backend Dev)"
                      className={inputCls}
                    />
                  </div>
                  <input
                    type="number"
                    value={pos.quantity}
                    onChange={(e) =>
                      handlePositionChange(idx, "quantity", e.target.value)
                    }
                    placeholder="Số lượng"
                    min={1}
                    className={inputCls}
                  />
                </div>
                <textarea
                  value={pos.requirements}
                  onChange={(e) =>
                    handlePositionChange(idx, "requirements", e.target.value)
                  }
                  rows={2}
                  placeholder="Yêu cầu cho vị trí này..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            ))}
          </div>

          {/* Submit */}
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
              disabled={createMutation.isPending}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2 shadow-md"
            >
              {createMutation.isPending && (
                <Loader2 size={18} className="animate-spin" />
              )}
              {createMutation.isPending ? "Đang tạo..." : "Tạo dự án"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

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
