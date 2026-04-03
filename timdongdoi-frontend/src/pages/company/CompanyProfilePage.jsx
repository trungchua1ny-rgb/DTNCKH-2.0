import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import companyService from "../../services/companyService";
import {
  Building2,
  Globe,
  Users,
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  Plus,
  Trash2,
  Loader2,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

// ============================================
// CONSTANTS
// ============================================
const INDUSTRY_OPTIONS = [
  "Công nghệ thông tin",
  "Tài chính - Ngân hàng",
  "Thương mại điện tử",
  "Giáo dục",
  "Y tế",
  "Sản xuất",
  "Bán lẻ",
  "Truyền thông",
  "Bất động sản",
  "Khác",
];

const SIZE_OPTIONS = [
  { value: "1-10", label: "1 - 10 nhân viên" },
  { value: "11-50", label: "11 - 50 nhân viên" },
  { value: "51-200", label: "51 - 200 nhân viên" },
  { value: "201-500", label: "201 - 500 nhân viên" },
  { value: "501-1000", label: "501 - 1000 nhân viên" },
  { value: "1000+", label: "Trên 1000 nhân viên" },
];

const VERIFICATION_STATUS = {
  verified: {
    label: "Đã xác minh",
    color: "text-green-600 bg-green-50",
    icon: <CheckCircle size={14} />,
  },
  pending: {
    label: "Chờ xác minh",
    color: "text-yellow-600 bg-yellow-50",
    icon: <Clock size={14} />,
  },
  rejected: {
    label: "Bị từ chối",
    color: "text-red-600 bg-red-50",
    icon: <AlertCircle size={14} />,
  },
};

const DOCUMENT_TYPES = [
  "Giấy phép kinh doanh",
  "Giấy chứng nhận đăng ký doanh nghiệp",
  "Mã số thuế",
  "Khác",
];

// ============================================
// HELPERS
// ============================================
const inputCls =
  "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

function Section({ icon, title, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <span className="text-blue-500">{icon}</span> {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

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

// ============================================
// LOCATION MODAL
// ============================================
function LocationModal({ open, onClose, onSave, isSaving, initial }) {
  const [form, setForm] = useState(
    initial || {
      address: "",
      city: "",
      country: "Vietnam",
      isHeadquarter: false,
    },
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">
            {initial ? "Sửa địa điểm" : "Thêm địa điểm"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Địa chỉ">
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="123 Nguyễn Huệ..."
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Thành phố">
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Hà Nội"
                className={inputCls}
              />
            </Field>
            <Field label="Quốc gia">
              <input
                type="text"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="Vietnam"
                className={inputCls}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isHeadquarter}
              onChange={(e) => set("isHeadquarter", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500"
            />
            <span className="text-sm text-gray-700">Trụ sở chính</span>
          </label>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}{" "}
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// VERIFICATION MODAL
// ============================================
function VerificationModal({ open, onClose, onSubmit, isSubmitting }) {
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const handleSubmit = () => {
    if (!file) return toast.error("Vui lòng chọn file tài liệu");
    onSubmit({ documentType: docType, notes }, file);
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
          <h3 className="text-base font-bold text-gray-900">
            Gửi yêu cầu xác minh
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Loại tài liệu">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className={inputCls}
            >
              {DOCUMENT_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ghi chú (tùy chọn)">
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputCls} resize-none`}
              placeholder="Thêm ghi chú nếu cần..."
            />
          </Field>
          <Field label="Tài liệu xác minh *">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition text-center"
            >
              {file ? (
                <p className="text-sm text-blue-600 font-medium">{file.name}</p>
              ) : (
                <>
                  <Upload size={20} className="mx-auto text-gray-300 mb-1" />
                  <p className="text-sm text-gray-400">
                    PDF, JPG, PNG — tối đa 10MB
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileText size={14} />
            )}{" "}
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function CompanyProfilePage() {
  const queryClient = useQueryClient();
  const logoInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({});
  const [locationModal, setLocationModal] = useState({
    open: false,
    data: null,
  });
  const [verificationModal, setVerificationModal] = useState(false);
  const [deletingLocId, setDeletingLocId] = useState(null);

  // ---- QUERIES ----
  const {
    data: company,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["myCompany"],
    queryFn: () =>
      companyService.getMyCompany().then((r) => r.data.Data || r.data.data),
    retry: false,
  });

  const { data: verifications = [] } = useQuery({
    queryKey: ["myVerifications"],
    queryFn: () =>
      companyService
        .getMyVerifications()
        .then((r) => r.data.Data || r.data.data || []),
    enabled: !!company,
  });

  // ---- MUTATIONS ----
  const createMutation = useMutation({
    mutationFn: (data) => companyService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["myCompany"]);
      toast.success("Tạo công ty thành công!");
      setCreating(false);
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.Message ||
          err.response?.data?.message ||
          "Tạo thất bại",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => companyService.updateCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["myCompany"]);
      toast.success("Cập nhật thành công!");
      setEditing(false);
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.Message ||
          err.response?.data?.message ||
          "Cập nhật thất bại",
      ),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file) => companyService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries(["myCompany"]);
      toast.success("Cập nhật logo thành công!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.Message || "Upload thất bại"),
  });

  const addLocationMutation = useMutation({
    mutationFn: (data) => companyService.addLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["myCompany"]);
      toast.success("Đã thêm địa điểm!");
      setLocationModal({ open: false, data: null });
    },
    onError: (err) =>
      toast.error(err.response?.data?.Message || "Thêm thất bại"),
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }) => companyService.updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["myCompany"]);
      toast.success("Đã cập nhật!");
      setLocationModal({ open: false, data: null });
    },
    onError: (err) =>
      toast.error(err.response?.data?.Message || "Cập nhật thất bại"),
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id) => companyService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["myCompany"]);
      toast.success("Đã xóa địa điểm");
      setDeletingLocId(null);
    },
    onError: () => {
      toast.error("Xóa thất bại");
      setDeletingLocId(null);
    },
  });

  const verificationMutation = useMutation({
    mutationFn: ({ data, file }) =>
      companyService.submitVerification(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries(["myVerifications"]);
      toast.success("Đã gửi yêu cầu xác minh!");
      setVerificationModal(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.Message || "Gửi thất bại"),
  });

  // ---- HANDLERS ----
  const handleEdit = () => {
    setForm({
      name: company?.name || "",
      description: company?.description || "",
      website: company?.website || "",
      industry: company?.industry || "",
      size: company?.size || "",
      foundedYear: company?.foundedYear || "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    if (!form.name?.trim())
      return toast.error("Tên công ty không được để trống");
    if (creating) createMutation.mutate(form);
    else updateMutation.mutate(form);
  };

  const handleDeleteLocation = (id) => {
    if (!window.confirm("Xóa địa điểm này?")) return;
    setDeletingLocId(id);
    deleteLocationMutation.mutate(id);
  };

  const latestVerification = verifications[0];
  const verificationInfo =
    VERIFICATION_STATUS[company?.verificationStatus] ||
    VERIFICATION_STATUS.pending;

  if (isLoading)
    return (
      <MainLayout>
        <div className="py-20">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );

  // ---- CHƯA CÓ CÔNG TY ----
  if (isError || !company) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
            <Building2 size={32} className="text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Chưa có thông tin công ty
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Tạo hồ sơ công ty để bắt đầu đăng tuyển dụng và thu hút ứng viên.
          </p>
          {!creating ? (
            <button
              onClick={() => {
                setForm({
                  name: "",
                  description: "",
                  website: "",
                  industry: "",
                  size: "",
                  foundedYear: "",
                });
                setCreating(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-sm"
            >
              <Plus size={16} /> Tạo hồ sơ công ty
            </button>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left">
              <h2 className="text-base font-bold text-gray-800 mb-4">
                Thông tin công ty
              </h2>
              <CompanyForm form={form} setForm={setForm} />
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setCreating(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {createMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}{" "}
                  Tạo công ty
                </button>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* ---- HEADER ---- */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                  {company.logo ? (
                    <img
                      src={`http://localhost:5024${company.logo}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 size={28} className="text-gray-300" />
                  )}
                </div>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadLogoMutation.isPending}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition shadow-md"
                >
                  {uploadLogoMutation.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Camera size={12} />
                  )}
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadLogoMutation.mutate(f);
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    {company.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${verificationInfo.color}`}
                  >
                    {verificationInfo.icon} {verificationInfo.label}
                  </span>
                </div>
                {company.industry && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {company.industry}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {company.size && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Users size={11} /> {company.size}
                    </span>
                  )}
                  {company.foundedYear && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={11} /> {company.foundedYear}
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <Globe size={11} /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {company.verificationStatus !== "verified" && (
                <button
                  onClick={() => setVerificationModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-xs font-medium hover:bg-yellow-100 transition"
                >
                  <Star size={12} /> Xác minh
                </button>
              )}
              {!editing && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  <Edit2 size={14} /> Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-50">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">
                {company.stats?.activeJobs || 0}
              </p>
              <p className="text-xs text-gray-400">Tin đang tuyển</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">
                {company.stats?.totalJobs || 0}
              </p>
              <p className="text-xs text-gray-400">Tổng tin đăng</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">
                {company.stats?.totalLocations || 0}
              </p>
              <p className="text-xs text-gray-400">Địa điểm</p>
            </div>
          </div>
        </div>

        {/* ---- THÔNG TIN CÔNG TY ---- */}
        <Section icon={<Building2 size={16} />} title="Thông tin công ty">
          {editing ? (
            <>
              <CompanyForm form={form} setForm={setForm} />
              <div className="flex gap-3 mt-5">
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
                  )}{" "}
                  Lưu thay đổi
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {company.description && (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {company.description}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <InfoRow
                  icon={<Users size={14} />}
                  label="Quy mô"
                  value={company.size}
                />
                <InfoRow
                  icon={<Calendar size={14} />}
                  label="Năm thành lập"
                  value={company.foundedYear?.toString()}
                />
                <InfoRow
                  icon={<Building2 size={14} />}
                  label="Ngành nghề"
                  value={company.industry}
                />
                <InfoRow
                  icon={<Globe size={14} />}
                  label="Website"
                  value={company.website}
                  isLink
                />
              </div>
            </div>
          )}
        </Section>

        {/* ---- ĐỊA ĐIỂM ---- */}
        <Section
          icon={<MapPin size={16} />}
          title={`Địa điểm (${company.locations?.length || 0})`}
          action={
            <button
              onClick={() => setLocationModal({ open: true, data: null })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
            >
              <Plus size={13} /> Thêm
            </button>
          }
        >
          {!company.locations?.length ? (
            <p className="text-sm text-gray-400 italic">
              Chưa có địa điểm nào.
            </p>
          ) : (
            <div className="space-y-3">
              {company.locations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <MapPin size={14} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {loc.address}
                        {loc.city ? `, ${loc.city}` : ""}
                      </p>
                      <p className="text-xs text-gray-400">{loc.country}</p>
                    </div>
                    {loc.isHeadquarter && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                        Trụ sở chính
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() =>
                        setLocationModal({ open: true, data: loc })
                      }
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      disabled={deletingLocId === loc.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      {deletingLocId === loc.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ---- XÁC MINH ---- */}
        <Section icon={<CheckCircle size={16} />} title="Xác minh doanh nghiệp">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {latestVerification ? (
                <div className="space-y-2">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${VERIFICATION_STATUS[latestVerification.status]?.color || "bg-gray-50 text-gray-600"}`}
                  >
                    {VERIFICATION_STATUS[latestVerification.status]?.icon}
                    {VERIFICATION_STATUS[latestVerification.status]?.label ||
                      latestVerification.status}
                  </div>
                  <p className="text-xs text-gray-400">
                    Gửi lúc:{" "}
                    {new Date(
                      latestVerification.submittedAt,
                    ).toLocaleDateString("vi-VN")}
                    {" · "}
                    {latestVerification.documentType}
                  </p>
                  {latestVerification.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {latestVerification.notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Chưa gửi yêu cầu xác minh.
                </p>
              )}
            </div>
            {company.verificationStatus !== "verified" && (
              <button
                onClick={() => setVerificationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition shadow-sm flex-shrink-0"
              >
                <Upload size={14} /> Gửi tài liệu
              </button>
            )}
          </div>
        </Section>
      </div>

      {/* ---- MODALS ---- */}
      <LocationModal
        open={locationModal.open}
        onClose={() => setLocationModal({ open: false, data: null })}
        initial={locationModal.data}
        onSave={(data) =>
          locationModal.data
            ? updateLocationMutation.mutate({ id: locationModal.data.id, data })
            : addLocationMutation.mutate(data)
        }
        isSaving={
          addLocationMutation.isPending || updateLocationMutation.isPending
        }
      />

      <VerificationModal
        open={verificationModal}
        onClose={() => setVerificationModal(false)}
        onSubmit={(data, file) => verificationMutation.mutate({ data, file })}
        isSubmitting={verificationMutation.isPending}
      />
    </MainLayout>
  );
}

// ============================================
// COMPANY FORM (dùng chung cho create & edit)
// ============================================
function CompanyForm({ form, setForm }) {
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tên công ty *">
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Công ty ABC..."
            className={inputCls}
          />
        </Field>
        <Field label="Website">
          <input
            type="url"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://example.com"
            className={inputCls}
          />
        </Field>
        <Field label="Ngành nghề">
          <select
            value={form.industry}
            onChange={(e) => set("industry", e.target.value)}
            className={inputCls}
          >
            <option value="">-- Chọn ngành nghề --</option>
            {INDUSTRY_OPTIONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quy mô nhân sự">
          <select
            value={form.size}
            onChange={(e) => set("size", e.target.value)}
            className={inputCls}
          >
            <option value="">-- Chọn quy mô --</option>
            {SIZE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Năm thành lập">
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={form.foundedYear}
            onChange={(e) => set("foundedYear", e.target.value)}
            placeholder="2020"
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Mô tả công ty">
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Mô tả về công ty, văn hóa, sản phẩm..."
          className={`${inputCls} resize-none`}
        />
      </Field>
    </div>
  );
}

function InfoRow({ icon, label, value, isLink }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
        <span className="text-gray-300">{icon}</span> {label}
      </p>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          {value}
        </a>
      ) : (
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      )}
    </div>
  );
}
