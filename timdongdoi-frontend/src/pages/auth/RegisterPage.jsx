import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  User,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { APP_NAME } from "../../utils/constants";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("user"); // "user" | "company"
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    // company only
    companyName: "",
    website: "",
    industry: "",
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.fullName || !form.email || !form.password)
      return "Vui lòng nhập đầy đủ thông tin bắt buộc";
    if (form.password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    if (form.password !== form.confirmPassword)
      return "Mật khẩu xác nhận không khớp";
    if (role === "company" && !form.companyName)
      return "Vui lòng nhập tên công ty";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const payload =
        role === "company"
          ? {
              fullName: form.fullName,
              email: form.email,
              password: form.password,
              phone: form.phone,
              companyName: form.companyName,
              website: form.website,
              industry: form.industry,
            }
          : {
              fullName: form.fullName,
              email: form.email,
              password: form.password,
              phone: form.phone,
            };

      await register({ ...payload, role });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <CheckCircle2 size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Đăng ký thành công!
          </h2>
          <p className="text-gray-500">Đang chuyển đến trang đăng nhập...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Users size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Tạo tài khoản
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Tham gia cộng đồng {APP_NAME} ngay hôm nay
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              {
                value: "user",
                icon: <User size={20} />,
                label: "Ứng viên",
                sub: "Tìm việc & đồng đội",
              },
              {
                value: "company",
                icon: <Building2 size={20} />,
                label: "Nhà tuyển dụng",
                sub: "Đăng tin tuyển dụng",
              },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all
                  ${
                    role === r.value
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
              >
                {r.icon}
                <span className="font-semibold text-sm">{r.label}</span>
                <span className="text-xs opacity-70">{r.sub}</span>
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Họ và tên *"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
            />
            <InputField
              label="Email *"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com"
              type="email"
            />
            <InputField
              label="Số điện thoại"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="0912 345 678"
            />

            {/* Company fields */}
            {role === "company" && (
              <>
                <InputField
                  label="Tên công ty *"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Công ty TNHH ABC"
                />
                <InputField
                  label="Website"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://company.com"
                />
                <InputField
                  label="Lĩnh vực"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  placeholder="Công nghệ thông tin"
                />
              </>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu *
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <InputField
              label="Xác nhận mật khẩu *"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              type="password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 shadow-md mt-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
  );
}
