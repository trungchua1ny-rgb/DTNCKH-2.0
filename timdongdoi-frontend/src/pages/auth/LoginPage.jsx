import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Users, Eye, EyeOff, Loader2 } from "lucide-react";
import { APP_NAME, APP_SLOGAN } from "../../utils/constants";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const user = await login(form.email, form.password);
      // Redirect theo role
      if (user.role === "admin") navigate("/admin", { replace: true });
      else if (user.role === "company")
        navigate("/company/profile", { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Users size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">{APP_NAME}</h1>
          <p className="text-blue-100 text-lg mb-10">{APP_SLOGAN}</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { num: "10K+", label: "Việc làm" },
              { num: "5K+", label: "Doanh nghiệp" },
              { num: "50K+", label: "Ứng viên" },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{item.num}</div>
                <div className="text-blue-200 text-sm mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
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
              Chào mừng trở lại!
            </h2>
            <p className="text-gray-500 text-sm mb-8">Đăng nhập để tiếp tục</p>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-6 text-center text-sm text-gray-500">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-blue-600 font-semibold hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
