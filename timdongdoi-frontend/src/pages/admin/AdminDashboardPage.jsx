import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Briefcase,
  Rocket,
  AlertTriangle,
  Flag,
  FileText,
  CheckCircle,
  ArrowRight,
  Shield,
  BarChart2,
  FolderOpen,
  Star,
  ClipboardList,
  UserPlus,
  Tag,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "react-hot-toast";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import adminService from "../../services/adminService";
import api from "../../services/api";

const API_BASE = "http://localhost:5024";

function imgUrl(p) {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  return `${API_BASE}${p}`;
}

function initials(n = "") {
  return (
    n
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient, to, sub }) {
  const inner = (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="text-3xl font-extrabold mt-1">
            {value?.toLocaleString() ?? "—"}
          </p>
          {sub && (
            <p className="text-xs opacity-80 mt-1.5 font-medium bg-white/10 inline-block px-2 py-0.5 rounded-full">
              {sub}
            </p>
          )}
        </div>
        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shadow-inner shrink-0">
          <Icon size={22} />
        </div>
      </div>
      {to && (
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold opacity-90">
          Xem chi tiết <ArrowRight size={14} />
        </div>
      )}
    </div>
  );
  return to ? (
    <Link to={to} className="block">
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  );
}

function SmallStatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-gray-200 transition-colors">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-extrabold text-gray-800 truncate">
          {value?.toLocaleString() ?? "—"}
        </p>
        <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────
function MonthlyChart({ data }) {
  if (!data?.length) return null;
  const chartData = [...data].reverse();
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 size={18} className="text-blue-500" />
        <h3 className="font-bold text-gray-800">
          Biểu đồ tăng trưởng hệ thống
        </h3>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6"
            />
            <XAxis
              dataKey="monthName"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ fontSize: "13px", fontWeight: 600 }}
              labelStyle={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{
                fontSize: "13px",
                fontWeight: 500,
                paddingTop: "10px",
              }}
            />
            <Area
              type="monotone"
              name="Người dùng mới"
              dataKey="newUsers"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorUsers)"
            />
            <Area
              type="monotone"
              name="Việc làm mới"
              dataKey="newJobs"
              stroke="#8b5cf6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorJobs)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Monthly Table ────────────────────────────────────────────────────────────
function MonthlyTable({ data }) {
  if (!data?.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <FileText size={18} className="text-gray-500" />
        <h3 className="font-bold text-gray-800">Chi tiết số liệu theo tháng</h3>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 text-left border-b border-gray-100">
              <th className="px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Tháng
              </th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                Users mới
              </th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                Việc làm mới
              </th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                Dự án mới
              </th>
              <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">
                Đơn ứng tuyển
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...data].reverse().map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3.5 font-medium text-gray-700">
                  {row.monthName}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-blue-600 bg-blue-50/30">
                  {row.newUsers}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-indigo-600">
                  {row.newJobs}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-violet-600 bg-violet-50/30">
                  {row.newProjects}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                  {row.newApplications}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopCompaniesTable({ data }) {
  if (!data?.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Building2 size={18} className="text-orange-500" />
        <h3 className="font-bold text-gray-800">Top công ty thu hút nhất</h3>
      </div>
      <div className="divide-y divide-gray-50 flex-1">
        {data.map((c, i) => (
          <div
            key={c.id}
            className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/50 transition-colors"
          >
            <span
              className={`text-xs font-extrabold w-5 text-center ${i < 3 ? "text-orange-500" : "text-gray-400"}`}
            >
              #{i + 1}
            </span>
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0">
              {c.logo ? (
                <img
                  src={imgUrl(c.logo)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-gray-400">
                  {initials(c.name)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link
                to={`/companies/${c.id}`}
                className="text-sm font-bold text-gray-800 hover:text-blue-600 truncate block transition-colors"
              >
                {c.name}
              </Link>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {c.industry || "Chưa cập nhật"}
              </p>
            </div>
            <div className="text-right bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 shrink-0">
              <p className="text-sm font-extrabold text-orange-600">
                {c.totalApplications}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-orange-400">
                Đơn
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopJobsTable({ data }) {
  if (!data?.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Briefcase size={18} className="text-blue-500" />
        <h3 className="font-bold text-gray-800">Top việc làm quan tâm nhiều</h3>
      </div>
      <div className="divide-y divide-gray-50 flex-1">
        {data.map((j, i) => (
          <div
            key={j.id}
            className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50/50 transition-colors"
          >
            <span
              className={`text-xs font-extrabold w-5 text-center ${i < 3 ? "text-blue-500" : "text-gray-400"}`}
            >
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <Link
                to={`/jobs/${j.id}`}
                className="text-sm font-bold text-gray-800 hover:text-blue-600 truncate block transition-colors"
              >
                {j.title}
              </Link>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {j.companyName}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-extrabold text-blue-600">{j.views}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                Lượt xem
              </p>
            </div>
            <div className="text-right pl-3 border-l border-gray-100 shrink-0">
              <p className="text-sm font-extrabold text-emerald-600">
                {j.applications}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                Ứng tuyển
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Create Admin Form ────────────────────────────────────────────────────────
function CreateAdminForm() {
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    password: "",
  });
  const [showPass, setShow] = useState(false);
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.fullName || !form.password) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    if (form.password.length < 6) {
      setError("Mật khẩu phải từ 6 ký tự");
      return;
    }
    setError("");
    setLoad(true);
    try {
      await api.post("/auth/register/admin", form);
      setForm({ email: "", fullName: "", phone: "", password: "" });
      toast.success(`Đã tạo tài khoản admin "${form.fullName}"!`);
    } catch (err) {
      setError(
        err.response?.data?.Message ||
          err.response?.data?.message ||
          "Tạo admin thất bại",
      );
    } finally {
      setLoad(false);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";

  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
          <UserPlus size={18} className="text-red-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Tạo tài khoản Admin mới</h3>
          <p className="text-xs text-gray-400">
            Chỉ admin hiện tại mới có quyền này
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value }))
              }
              placeholder="Nguyễn Văn A"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="admin@timdongdoi.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Số điện thoại
            </label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="0912345678"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                placeholder="Tối thiểu 6 ký tự"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShow(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-sm text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <UserPlus size={15} />
                Tạo tài khoản Admin
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Quick Add Skill Form ─────────────────────────────────────────────────────
function QuickAddSkillForm({ skillNames }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [cat, setCat] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState("");

  const isDup = name.trim() && skillNames?.has(name.trim().toLowerCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên skill");
      return;
    }
    if (isDup) {
      setError(`Skill "${name.trim()}" đã tồn tại`);
      return;
    }
    setError("");
    setLoad(true);
    try {
      await api.post("/Skills", {
        name: name.trim(),
        category: cat.trim() || null,
        icon: icon.trim() || null,
      });
      setName("");
      setCat("");
      setIcon("");
      toast.success(`Đã thêm skill "${name.trim()}"!`);
      queryClient.invalidateQueries(["admin-skills"]);
    } catch (err) {
      setError(err.response?.data?.message || "Thêm skill thất bại");
    } finally {
      setLoad(false);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent";

  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
          <Tag size={18} className="text-green-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Thêm Skill mới</h3>
          <p className="text-xs text-gray-400">
            Skill sẽ hiển thị cho tất cả người dùng
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tên skill <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="VD: React, Python..."
              className={`${inputCls} ${isDup ? "border-red-300 focus:ring-red-400" : ""}`}
            />
            {isDup && (
              <p className="text-xs text-red-400 mt-1">Skill đã tồn tại!</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Danh mục
            </label>
            <input
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              placeholder="VD: Frontend, Design..."
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Icon <span className="text-gray-400">(emoji)</span>
            </label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="⚛️"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Link
            to="/admin/skills"
            className="text-sm text-green-600 hover:underline font-medium flex items-center gap-1"
          >
            <Tag size={14} /> Xem tất cả skills →
          </Link>
          <button
            type="submit"
            disabled={loading || !name.trim() || isDup}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-sm text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang thêm...
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                Thêm skill
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { data: dashRes, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminService.getDashboard().then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
  });

  // Lấy danh sách skills để check duplicate
  const { data: skillsRaw } = useQuery({
    queryKey: ["admin-skills"],
    queryFn: () =>
      api
        .get("/Skills")
        .then((r) => r.data.data || r.data.Data || r.data || []),
    staleTime: 60 * 1000,
  });
  const skillNames = new Set(
    (Array.isArray(skillsRaw) ? skillsRaw : []).map((s) =>
      s.name?.toLowerCase(),
    ),
  );

  if (isLoading)
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );

  const overall = dashRes?.overall || {};
  const monthly = dashRes?.monthlyStats || [];
  const appStats = dashRes?.applicationStats || {};
  const topCos = dashRes?.topCompanies || [];
  const topJobs = dashRes?.topJobs || [];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Tổng quan hệ thống TimĐồngĐội
          </p>
        </div>

        {/* 4 Stat cards lớn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={Users}
            label="Tổng Người Dùng"
            value={overall.totalUsers}
            gradient="from-blue-500 to-indigo-600"
            to="/admin/users"
            sub={`${overall.activeUsers ?? 0} đang hoạt động`}
          />
          <StatCard
            icon={Building2}
            label="Doanh Nghiệp"
            value={overall.totalCompanies}
            gradient="from-indigo-500 to-violet-600"
            to="/admin/companies"
            sub={`${overall.verifiedCompanies ?? "—"} đã xác minh`}
          />
          <StatCard
            icon={Briefcase}
            label="Việc Làm"
            value={overall.totalJobs}
            gradient="from-violet-500 to-purple-600"
            to="/admin/jobs"
            sub={`${overall.openJobs ?? 0} đang mở tuyển`}
          />
          <StatCard
            icon={Rocket}
            label="Dự Án Khởi Nghiệp"
            value={overall.totalProjects}
            gradient="from-emerald-500 to-teal-600"
            to="/admin/projects"
            sub={`${overall.openProjects ?? 0} dự án đang mở`}
          />
        </div>

        {/* Small stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SmallStatCard
            icon={AlertTriangle}
            label="Xác minh chờ duyệt"
            value={overall.pendingVerifications}
            color="bg-orange-50 text-orange-600"
          />
          <SmallStatCard
            icon={Flag}
            label="Báo cáo vi phạm"
            value={overall.pendingReports}
            color="bg-red-50 text-red-600"
          />
          <SmallStatCard
            icon={FileText}
            label="Tổng đơn ứng tuyển"
            value={appStats.total}
            color="bg-blue-50 text-blue-600"
          />
          <SmallStatCard
            icon={CheckCircle}
            label="Tỷ lệ trúng tuyển"
            value={appStats.successRate ? `${appStats.successRate}%` : "—"}
            color="bg-green-50 text-green-600"
          />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            {
              to: "/admin/companies",
              icon: Shield,
              label: "Duyệt công ty",
              color:
                "border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100",
            },
            {
              to: "/admin/reports",
              icon: Flag,
              label: "Xử lý báo cáo",
              color: "border-red-200 text-red-700 bg-red-50 hover:bg-red-100",
            },
            {
              to: "/admin/users",
              icon: Users,
              label: "Quản lý users",
              color:
                "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100",
            },
            {
              to: "/admin/jobs",
              icon: Briefcase,
              label: "Quản lý jobs",
              color:
                "border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100",
            },
            {
              to: "/admin/projects",
              icon: FolderOpen,
              label: "Quản lý dự án",
              color:
                "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
            },
            {
              to: "/admin/reviews",
              icon: Star,
              label: "Quản lý reviews",
              color:
                "border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100",
            },
            {
              to: "/admin/logs",
              icon: ClipboardList,
              label: "Nhật ký hệ thống",
              color:
                "border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 border-dashed",
            },
          ].map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className={`flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-2xl border-2 font-semibold text-xs transition-all transform hover:-translate-y-1 hover:shadow-md ${q.color}`}
            >
              <q.icon size={20} className="shrink-0 mb-1 opacity-80" />
              <span className="text-center w-full truncate px-1">
                {q.label}
              </span>
            </Link>
          ))}
        </div>

        {/* ✅ Tạo Admin + Thêm Skill — 2 cột */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CreateAdminForm />
          <QuickAddSkillForm skillNames={skillNames} />
        </div>

        {/* Chart */}
        <MonthlyChart data={monthly} />

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <MonthlyTable data={monthly} />
          </div>
          <div className="lg:col-span-1">
            <TopCompaniesTable data={topCos} />
          </div>
          <div className="lg:col-span-2">
            <TopJobsTable data={topJobs} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
