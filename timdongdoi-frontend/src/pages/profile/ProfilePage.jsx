import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import userService from "../../services/userService";
import reviewService from "../../services/reviewService";
import ReviewCard from "../../components/review/ReviewCard";

import {
  User,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
  Search,
  Camera,
  FileText,
  Building2,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Lock,
  Eye,
  EyeOff,
  Star,
  Globe, // ✅ Đã thêm Globe
} from "lucide-react";
import { getAvatarFallback } from "../../utils/helpers";
import toast from "react-hot-toast";

// ============================================
// CONSTANTS
// ============================================
const GENDER_OPTIONS = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Mới bắt đầu" },
  { value: "junior", label: "Junior" },
  { value: "intermediate", label: "Trung bình" },
  { value: "advanced", label: "Nâng cao" },
  { value: "senior", label: "Senior" },
  { value: "expert", label: "Chuyên gia" },
];

const SKILL_LEVEL_COLORS = {
  beginner: "bg-gray-100 text-gray-600",
  intermediate: "bg-blue-50 text-blue-600",
  advanced: "bg-indigo-50 text-indigo-600",
  expert: "bg-purple-50 text-purple-600",
  junior: "bg-green-50 text-green-600",
  senior: "bg-orange-50 text-orange-600",
};

const DEGREE_OPTIONS = [
  "Trung cấp",
  "Cao đẳng",
  "Đại học",
  "Thạc sĩ",
  "Tiến sĩ",
  "Khác",
];

// ============================================
// SECTION WRAPPER
// ============================================
function Section({ icon, title, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <span className="text-blue-500">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ============================================
// ADD SKILL MODAL
// ============================================
function AddSkillModal({ open, onClose, onAdd, isAdding }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [level, setLevel] = useState("beginner");
  const [years, setYears] = useState("");

  const { data: skills = [] } = useQuery({
    queryKey: ["systemSkills", search],
    queryFn: () =>
      search.length >= 1
        ? userService.searchSkills(search).then((r) => r.data.data || [])
        : userService.getAllSkills().then((r) => r.data.data || []),
    enabled: open,
  });

  const handleSubmit = () => {
    if (!selected) return toast.error("Vui lòng chọn một skill");
    onAdd({
      skillId: selected.id,
      level,
      yearsExperience: years ? parseInt(years) : null,
      description: null,
    });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Thêm kỹ năng</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm kỹ năng..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
            }}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg mb-4">
          {skills.slice(0, 20).map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition flex items-center justify-between ${selected?.id === s.id ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"}`}
            >
              <span>{s.name}</span>
              {s.category && (
                <span className="text-xs text-gray-400">{s.category}</span>
              )}
            </button>
          ))}
          {skills.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Không tìm thấy skill
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Cấp độ
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SKILL_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Số năm KN
            </label>
            <input
              type="number"
              min="0"
              max="50"
              placeholder="0"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || isAdding}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAdding ? <Loader2 size={14} className="animate-spin" /> : "Thêm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPERIENCE FORM MODAL
// ============================================
function ExperienceModal({ open, onClose, onSave, isSaving, initial }) {
  const [form, setForm] = useState(
    initial || {
      companyName: "",
      position: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    },
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.companyName?.trim())
      return toast.error("Tên công ty không được để trống");
    if (!form.startDate) return toast.error("Vui lòng chọn ngày bắt đầu");
    onSave(form);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">
            {initial ? "Sửa kinh nghiệm" : "Thêm kinh nghiệm"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Tên công ty *">
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              placeholder="Google, Facebook..."
              className={inputCls}
            />
          </Field>
          <Field label="Vị trí *">
            <input
              type="text"
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              placeholder="Frontend Developer..."
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày bắt đầu *">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Ngày kết thúc">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                disabled={form.isCurrent}
                className={`${inputCls} disabled:opacity-50`}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) => set("isCurrent", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500"
            />
            <span className="text-sm text-gray-700">Đang làm việc tại đây</span>
          </label>
          <Field label="Mô tả">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mô tả công việc, thành tích..."
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EDUCATION FORM MODAL
// ============================================
function EducationModal({ open, onClose, onSave, isSaving, initial }) {
  const [form, setForm] = useState(
    initial || {
      schoolName: "",
      major: "",
      degree: "",
      startYear: "",
      endYear: "",
      description: "",
    },
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.schoolName?.trim())
      return toast.error("Tên trường không được để trống");
    onSave(form);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">
            {initial ? "Sửa học vấn" : "Thêm học vấn"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Tên trường *">
            <input
              type="text"
              value={form.schoolName}
              onChange={(e) => set("schoolName", e.target.value)}
              placeholder="Đại học Bách Khoa..."
              className={inputCls}
            />
          </Field>
          <Field label="Chuyên ngành">
            <input
              type="text"
              value={form.major}
              onChange={(e) => set("major", e.target.value)}
              placeholder="Công nghệ thông tin..."
              className={inputCls}
            />
          </Field>
          <Field label="Bằng cấp">
            <select
              value={form.degree}
              onChange={(e) => set("degree", e.target.value)}
              className={inputCls}
            >
              <option value="">-- Chọn bằng cấp --</option>
              {DEGREE_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Năm bắt đầu">
              <input
                type="number"
                min="1950"
                max="2030"
                value={form.startYear}
                onChange={(e) => set("startYear", e.target.value)}
                placeholder="2018"
                className={inputCls}
              />
            </Field>
            <Field label="Năm tốt nghiệp">
              <input
                type="number"
                min="1950"
                max="2030"
                value={form.endYear}
                onChange={(e) => set("endYear", e.target.value)}
                placeholder="2022"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Mô tả">
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Thành tích, hoạt động ngoại khóa..."
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef(null);
  const cvInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState(null);
  const [expModal, setExpModal] = useState({ open: false, data: null });
  const [eduModal, setEduModal] = useState({ open: false, data: null });
  const [deletingExpId, setDeletingExpId] = useState(null);
  const [deletingEduId, setDeletingEduId] = useState(null);
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // ✅ State cho Ẩn/hiện review
  const [visibleReviews, setVisibleReviews] = useState({});

  // ---- QUERIES ----
  const { data: profile, isLoading } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () =>
      userService.getMyProfile().then((r) => r.data.data || r.data.Data),
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["mySkills"],
    queryFn: () => userService.getMySkills().then((r) => r.data.data || []),
  });

  const { data: experiences = [] } = useQuery({
    queryKey: ["myExperiences"],
    queryFn: () =>
      userService
        .getExperiences()
        .then((r) => r.data.Data || r.data.data || []),
  });

  const { data: educations = [] } = useQuery({
    queryKey: ["myEducations"],
    queryFn: () =>
      userService.getEducations().then((r) => r.data.Data || r.data.data || []),
  });

  // ✅ Lấy danh sách đánh giá
  const { data: reviewsData } = useQuery({
    queryKey: ["myReviews", authUser?.id],
    queryFn: () =>
      reviewService
        .getUserReviews(authUser.id, { page: 1, pageSize: 50 })
        .then((r) => r.data),
    enabled: !!authUser?.id,
  });

  const reviews = reviewsData?.data || [];

  // ✅ Khởi tạo state ẩn/hiện từ dữ liệu reviews
  useEffect(() => {
    if (reviews.length > 0) {
      const initialVisibility = {};
      reviews.forEach((review) => {
        initialVisibility[review.id] = review.isVisible;
      });
      setVisibleReviews(initialVisibility);
    }
  }, [reviews]);

  // ---- MUTATIONS ----
  // ✅ Xử lý Ẩn/Hiện đánh giá
  const handleToggleVisibility = async (reviewId) => {
    try {
      await reviewService.toggleVisibility(reviewId);
      setVisibleReviews((prev) => ({
        ...prev,
        [reviewId]: !prev[reviewId],
      }));
      toast.success("Đã cập nhật trạng thái ẩn/hiện đánh giá");
      queryClient.invalidateQueries(["myReviews"]);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái",
      );
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["myProfile"]);
      if (updateUser)
        updateUser({
          fullName: res.data.data?.fullName || res.data.Data?.fullName,
          avatar: res.data.data?.avatar || res.data.Data?.avatar,
        });
      toast.success("Cập nhật hồ sơ thành công!");
      setEditing(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.Message || "Cập nhật thất bại"),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => userService.uploadAvatar(file),
    onSuccess: async () => {
      const res = await userService.getMyProfile();
      const profile = res.data.data || res.data.Data;
      if (profile?.avatar && updateUser) {
        updateUser({ avatar: profile.avatar });
      }
      queryClient.invalidateQueries(["myProfile"]);
      toast.success("Cập nhật ảnh đại diện thành công!");
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.Message ||
          err.response?.data?.message ||
          "Upload thất bại",
      ),
  });

  const uploadCvMutation = useMutation({
    mutationFn: (file) => userService.uploadCv(file),
    onSuccess: () => {
      queryClient.invalidateQueries(["myProfile"]);
      toast.success("Upload CV thành công!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.Message || "Upload CV thất bại"),
  });

  const addSkillMutation = useMutation({
    mutationFn: (data) => userService.addSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["mySkills"]);
      toast.success("Đã thêm kỹ năng!");
      setShowAddSkill(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thêm thất bại"),
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id) => userService.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["mySkills"]);
      toast.success("Đã xóa kỹ năng");
      setDeletingSkillId(null);
    },
    onError: () => {
      toast.error("Xóa thất bại");
      setDeletingSkillId(null);
    },
  });

  const addExpMutation = useMutation({
    mutationFn: (data) => userService.addExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["myExperiences"]);
      toast.success("Đã thêm kinh nghiệm!");
      setExpModal({ open: false, data: null });
    },
    onError: (err) =>
      toast.error(err.response?.data?.Message || "Thêm thất bại"),
  });

  const updateExpMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["myExperiences"]);
      toast.success("Đã cập nhật!");
      setExpModal({ open: false, data: null });
    },
    onError: (err) =>
      toast.error(err.response?.data?.Message || "Cập nhật thất bại"),
  });

  const deleteExpMutation = useMutation({
    mutationFn: (id) => userService.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["myExperiences"]);
      toast.success("Đã xóa");
      setDeletingExpId(null);
    },
    onError: () => {
      toast.error("Xóa thất bại");
      setDeletingExpId(null);
    },
  });

  const addEduMutation = useMutation({
    mutationFn: (data) => userService.addEducation(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["myEducations"]);
      toast.success("Đã thêm học vấn!");
      setEduModal({ open: false, data: null });
    },
    onError: (err) =>
      toast.error(err.response?.data?.Message || "Thêm thất bại"),
  });

  const updateEduMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateEducation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["myEducations"]);
      toast.success("Đã cập nhật!");
      setEduModal({ open: false, data: null });
    },
    onError: (err) =>
      toast.error(err.response?.data?.Message || "Cập nhật thất bại"),
  });

  const deleteEduMutation = useMutation({
    mutationFn: (id) => userService.deleteEducation(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["myEducations"]);
      toast.success("Đã xóa");
      setDeletingEduId(null);
    },
    onError: () => {
      toast.error("Xóa thất bại");
      setDeletingEduId(null);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => userService.changePassword(data),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Đổi mật khẩu thành công!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.Message ||
          "Đổi mật khẩu thất bại",
      ),
  });

  const handleChangePassword = () => {
    if (!pwForm.currentPassword) return toast.error("Nhập mật khẩu hiện tại");
    if (!pwForm.newPassword) return toast.error("Nhập mật khẩu mới");
    if (pwForm.newPassword.length < 6)
      return toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return toast.error("Mật khẩu xác nhận không khớp");
    changePasswordMutation.mutate(pwForm);
  };
  const handleEdit = () => {
    setForm({
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
      aboutMe: profile?.aboutMe || "",
      address: profile?.address || "",
      jobTitle: profile?.jobTitle || "",
      salaryExpectation: profile?.salaryExpectation || "",
      birthday: profile?.birthday ? profile.birthday.split("T")[0] : "",
      gender: profile?.gender || "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    if (!form.fullName?.trim())
      return toast.error("Họ tên không được để trống");
    updateMutation.mutate(form);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatarMutation.mutate(file);
  };

  const handleCvChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadCvMutation.mutate(file);
  };

  const handleDeleteSkill = (id) => {
    if (!window.confirm("Xóa kỹ năng này?")) return;
    setDeletingSkillId(id);
    deleteSkillMutation.mutate(id);
  };

  const handleDeleteExp = (id) => {
    if (!window.confirm("Xóa kinh nghiệm này?")) return;
    setDeletingExpId(id);
    deleteExpMutation.mutate(id);
  };

  const handleDeleteEdu = (id) => {
    if (!window.confirm("Xóa học vấn này?")) return;
    setDeletingEduId(id);
    deleteEduMutation.mutate(id);
  };

  if (isLoading)
    return (
      <MainLayout>
        <div className="py-20">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* ======== HEADER: AVATAR + TÊN ======== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar với nút upload */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {profile?.avatar ? (
                    <img
                      src={`http://localhost:5024${profile.avatar}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getAvatarFallback(profile?.fullName)
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition shadow-md"
                  title="Đổi ảnh đại diện"
                >
                  {uploadAvatarMutation.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Camera size={12} />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {profile?.fullName}
                </h1>
                <p className="text-sm text-gray-500">{profile?.email}</p>
                {profile?.jobTitle && (
                  <p className="text-sm text-blue-600 font-medium mt-0.5">
                    {profile.jobTitle}
                  </p>
                )}
              </div>
            </div>

            {!editing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm flex-shrink-0"
              >
                <Edit2 size={14} /> Chỉnh sửa
              </button>
            )}
          </div>
        </div>

        {/* ======== THÔNG TIN CƠ BẢN ======== */}
        <Section icon={<User size={16} />} title="Thông tin cá nhân">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Họ và tên *">
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Số điện thoại">
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className={inputCls}
                    placeholder="0912345678"
                  />
                </Field>
                <Field label="Vị trí công việc">
                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(e) =>
                      setForm({ ...form, jobTitle: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Frontend Developer..."
                  />
                </Field>
                <Field label="Lương mong muốn (VNĐ)">
                  <input
                    type="number"
                    value={form.salaryExpectation}
                    onChange={(e) =>
                      setForm({ ...form, salaryExpectation: e.target.value })
                    }
                    className={inputCls}
                    placeholder="15000000"
                  />
                </Field>
                <Field label="Ngày sinh">
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={(e) =>
                      setForm({ ...form, birthday: e.target.value })
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Giới tính">
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value })
                    }
                    className={inputCls}
                  >
                    <option value="">-- Chọn --</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Địa chỉ">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className={inputCls}
                  placeholder="Hà Nội, Việt Nam"
                />
              </Field>
              <Field label="Giới thiệu bản thân">
                <textarea
                  rows={4}
                  value={form.aboutMe}
                  onChange={(e) =>
                    setForm({ ...form, aboutMe: e.target.value })
                  }
                  className={`${inputCls} resize-none`}
                  placeholder="Mô tả về bản thân, kinh nghiệm, mục tiêu..."
                />
              </Field>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {updateMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                icon={<Phone size={14} />}
                label="Điện thoại"
                value={profile?.phone}
              />
              <InfoRow
                icon={<Briefcase size={14} />}
                label="Vị trí"
                value={profile?.jobTitle}
              />
              <InfoRow
                icon={<DollarSign size={14} />}
                label="Lương mong muốn"
                value={
                  profile?.salaryExpectation
                    ? `${Number(profile.salaryExpectation).toLocaleString("vi-VN")} VNĐ`
                    : null
                }
              />
              <InfoRow
                icon={<Calendar size={14} />}
                label="Ngày sinh"
                value={
                  profile?.birthday
                    ? new Date(profile.birthday).toLocaleDateString("vi-VN")
                    : null
                }
              />
              <InfoRow
                icon={<User size={14} />}
                label="Giới tính"
                value={
                  GENDER_OPTIONS.find((g) => g.value === profile?.gender)?.label
                }
              />
              <InfoRow
                icon={<MapPin size={14} />}
                label="Địa chỉ"
                value={profile?.address}
              />
              {profile?.aboutMe && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Giới thiệu</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {profile.aboutMe}
                  </p>
                </div>
              )}
              {!profile?.phone &&
                !profile?.jobTitle &&
                !profile?.aboutMe &&
                !profile?.address && (
                  <p className="sm:col-span-2 text-sm text-gray-400 italic">
                    Chưa có thông tin. Bấm "Chỉnh sửa" để cập nhật.
                  </p>
                )}
            </div>
          )}
        </Section>

        {/* ======== CV ======== */}
        <Section icon={<FileText size={16} />} title="CV / Hồ sơ">
          <div className="flex items-center gap-4">
            {profile?.cvFile ? (
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    CV đã upload
                  </p>
                  <a
                    href={`http://localhost:5024${profile.cvFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Xem CV
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic flex-1">
                Chưa có CV. Upload CV để tăng cơ hội được tuyển dụng.
              </p>
            )}
            <button
              onClick={() => cvInputRef.current?.click()}
              disabled={uploadCvMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition flex-shrink-0 disabled:opacity-50"
            >
              {uploadCvMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              {profile?.cvFile ? "Cập nhật CV" : "Upload CV"}
            </button>
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleCvChange}
            />
          </div>
        </Section>

        {/* ======== KỸ NĂNG ======== */}
        <Section
          icon={<Briefcase size={16} />}
          title={`Kỹ năng (${skills.length})`}
          action={
            <button
              onClick={() => setShowAddSkill(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
            >
              <Plus size={13} /> Thêm
            </button>
          }
        >
          {skills.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Chưa có kỹ năng nào.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => {
                const level = skill.level?.toLowerCase() || "beginner";
                const colorClass =
                  SKILL_LEVEL_COLORS[level] || SKILL_LEVEL_COLORS.beginner;
                const levelLabel =
                  SKILL_LEVELS.find((l) => l.value === level)?.label || level;
                return (
                  <div
                    key={skill.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm group"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {skill.skillName}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}
                    >
                      {levelLabel}
                    </span>
                    {skill.yearsExperience && (
                      <span className="text-xs text-gray-400">
                        {skill.yearsExperience} năm
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteSkill(skill.id)}
                      disabled={
                        deletingSkillId === skill.id &&
                        deleteSkillMutation.isPending
                      }
                      className="ml-1 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    >
                      {deletingSkillId === skill.id &&
                      deleteSkillMutation.isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <X size={12} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* ======== KINH NGHIỆM ======== */}
        <Section
          icon={<Building2 size={16} />}
          title={`Kinh nghiệm làm việc (${experiences.length})`}
          action={
            <button
              onClick={() => setExpModal({ open: true, data: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
            >
              <Plus size={13} /> Thêm
            </button>
          }
        >
          {experiences.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Chưa có kinh nghiệm làm việc.
            </p>
          ) : (
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="flex gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 size={16} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {exp.position}
                        </p>
                        <p className="text-sm text-blue-600">
                          {exp.companyName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {exp.startDate
                            ? new Date(exp.startDate).toLocaleDateString(
                                "vi-VN",
                                { month: "2-digit", year: "numeric" },
                              )
                            : ""}
                          {" → "}
                          {exp.isCurrent
                            ? "Hiện tại"
                            : exp.endDate
                              ? new Date(exp.endDate).toLocaleDateString(
                                  "vi-VN",
                                  { month: "2-digit", year: "numeric" },
                                )
                              : ""}
                          {exp.isCurrent && (
                            <span className="ml-2 px-1.5 py-0.5 bg-green-50 text-green-600 text-xs rounded-full font-medium">
                              Hiện tại
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                        <button
                          onClick={() => setExpModal({ open: true, data: exp })}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteExp(exp.id)}
                          disabled={
                            deletingExpId === exp.id &&
                            deleteExpMutation.isPending
                          }
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          {deletingExpId === exp.id &&
                          deleteExpMutation.isPending ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ======== HỌC VẤN ======== */}
        <Section
          icon={<GraduationCap size={16} />}
          title={`Học vấn (${educations.length})`}
          action={
            <button
              onClick={() => setEduModal({ open: true, data: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
            >
              <Plus size={13} /> Thêm
            </button>
          }
        >
          {educations.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Chưa có thông tin học vấn.
            </p>
          ) : (
            <div className="space-y-4">
              {educations.map((edu) => (
                <div key={edu.id} className="flex gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <GraduationCap size={16} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {edu.schoolName}
                        </p>
                        <p className="text-sm text-indigo-600">
                          {[edu.degree, edu.major].filter(Boolean).join(" - ")}
                        </p>
                        {(edu.startYear || edu.endYear) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {edu.startYear} — {edu.endYear || "Hiện tại"}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                        <button
                          onClick={() => setEduModal({ open: true, data: edu })}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteEdu(edu.id)}
                          disabled={
                            deletingEduId === edu.id &&
                            deleteEduMutation.isPending
                          }
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          {deletingEduId === edu.id &&
                          deleteEduMutation.isPending ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                    {edu.description && (
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ======== ĐÁNH GIÁ CỦA TÔI ======== */}
        <Section
          icon={<Star size={16} />}
          title={`Đánh giá nhận được (${reviews.length})`}
        >
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Chưa có đánh giá nào.
            </p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="flex flex-col gap-2">
                  <ReviewCard review={review} isOwnProfile={true} />

                  {/* Giao diện nút Ẩn/Hiện mới (Trái đất / Ổ khóa) */}
                  <div className="flex items-center justify-between bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-800">
                        Quyền hiển thị
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {visibleReviews[review.id]
                          ? "Mọi người đều có thể thấy đánh giá này trên hồ sơ của bạn."
                          : "Đánh giá này đang bị ẩn. Chỉ bạn mới có thể nhìn thấy."}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleVisibility(review.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border shrink-0 ${
                        visibleReviews[review.id]
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
                      }`}
                    >
                      {visibleReviews[review.id] ? (
                        <>
                          <Globe size={16} className="text-blue-600" />
                          Công khai
                        </>
                      ) : (
                        <>
                          <Lock size={16} className="text-gray-500" />
                          Chỉ mình tôi
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ======== ĐỔI MẬT KHẨU ======== */}
        <Section icon={<Lock size={16} />} title="Đổi mật khẩu">
          <div className="space-y-3 max-w-md">
            {[
              {
                key: "currentPassword",
                label: "Mật khẩu hiện tại",
                show: showPw.current,
                toggle: () => setShowPw((p) => ({ ...p, current: !p.current })),
              },
              {
                key: "newPassword",
                label: "Mật khẩu mới",
                show: showPw.new,
                toggle: () => setShowPw((p) => ({ ...p, new: !p.new })),
              },
              {
                key: "confirmPassword",
                label: "Xác nhận mật khẩu mới",
                show: showPw.confirm,
                toggle: () => setShowPw((p) => ({ ...p, confirm: !p.confirm })),
              },
            ].map(({ key, label, show, toggle }) => (
              <Field key={key} label={label}>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={pwForm[key]}
                    onChange={(e) =>
                      setPwForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className={`${inputCls} pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            ))}
            <button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm disabled:opacity-70"
            >
              {changePasswordMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Lock size={14} />
              )}
              Đổi mật khẩu
            </button>
          </div>
        </Section>
      </div>

      {/* ---- MODALS ---- */}
      <AddSkillModal
        open={showAddSkill}
        onClose={() => setShowAddSkill(false)}
        onAdd={(data) => addSkillMutation.mutate(data)}
        isAdding={addSkillMutation.isPending}
      />

      <ExperienceModal
        open={expModal.open}
        onClose={() => setExpModal({ open: false, data: null })}
        initial={
          expModal.data
            ? {
                companyName: expModal.data.companyName || "",
                position: expModal.data.position || "",
                startDate: expModal.data.startDate
                  ? expModal.data.startDate.split("T")[0]
                  : "",
                endDate: expModal.data.endDate
                  ? expModal.data.endDate.split("T")[0]
                  : "",
                isCurrent: expModal.data.isCurrent || false,
                description: expModal.data.description || "",
              }
            : null
        }
        onSave={(data) =>
          expModal.data
            ? updateExpMutation.mutate({ id: expModal.data.id, data })
            : addExpMutation.mutate(data)
        }
        isSaving={addExpMutation.isPending || updateExpMutation.isPending}
      />

      <EducationModal
        open={eduModal.open}
        onClose={() => setEduModal({ open: false, data: null })}
        initial={
          eduModal.data
            ? {
                schoolName: eduModal.data.schoolName || "",
                major: eduModal.data.major || "",
                degree: eduModal.data.degree || "",
                startYear: eduModal.data.startYear || "",
                endYear: eduModal.data.endYear || "",
                description: eduModal.data.description || "",
              }
            : null
        }
        onSave={(data) =>
          eduModal.data
            ? updateEduMutation.mutate({ id: eduModal.data.id, data })
            : addEduMutation.mutate(data)
        }
        isSaving={addEduMutation.isPending || updateEduMutation.isPending}
      />
    </MainLayout>
  );
}

// ============================================
// HELPERS
// ============================================
const inputCls =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
        <span className="text-gray-300">{icon}</span> {label}
      </p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  );
}
