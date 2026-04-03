import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { APP_NAME } from "../../utils/constants";
import { getAvatarFallback } from "../../utils/helpers";
import NotificationBell from "../common/NotificationBell";
import {
  BriefcaseBusiness,
  Users,
  MessageSquare,
  ChevronDown,
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  Building2,
  Bookmark,
  FolderOpen,
  Flag,
  Sparkles,
  Calendar,
  FileText,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/");
    setUserMenuOpen(false);
    setMobileOpen(false);
  };

  const navLinks = [
    {
      to: "/job-search",
      icon: <BriefcaseBusiness size={18} />,
      label: "Việc làm",
    },
    { to: "/companies", icon: <Building2 size={18} />, label: "Công ty" },
    { to: "/projects", icon: <Users size={18} />, label: "Tìm đồng đội" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
              <Users size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </Link>

          {/* Nav links - desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />

                <Link
                  to="/messages"
                  className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <MessageSquare size={20} />
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={`http://localhost:5024${user.avatar}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getAvatarFallback(user.fullName)
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.fullName}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>

                        {/* Role: user */}
                        {user.role === "user" && (
                          <>
                            <DropdownItem
                              to="/profile"
                              icon={<User size={16} />}
                              label="Hồ sơ của tôi"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/my-applications"
                              icon={<BriefcaseBusiness size={16} />}
                              label="Đơn ứng tuyển việc làm"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/my-interviews"
                              icon={<Calendar size={16} />}
                              label="Lịch phỏng vấn"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/my-project-applications"
                              icon={<FolderOpen size={16} />}
                              label="Đơn ứng tuyển dự án"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/saved-jobs"
                              icon={<Bookmark size={16} />}
                              label="Việc đã lưu"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/recommendations"
                              icon={<Sparkles size={16} />}
                              label="Gợi ý cho tôi"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/my-reports"
                              icon={<Flag size={16} />}
                              label="Báo cáo của tôi"
                              onClick={() => setUserMenuOpen(false)}
                            />
                          </>
                        )}

                        {/* Role: company */}
                        {user.role === "company" && (
                          <>
                            <DropdownItem
                              to="/company/profile"
                              icon={<Building2 size={16} />}
                              label="Hồ sơ công ty"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/company/jobs"
                              icon={<BriefcaseBusiness size={16} />}
                              label="Quản lý tin đăng"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/company/applications"
                              icon={<Users size={16} />}
                              label="Ứng viên"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/company/tests"
                              icon={<FileText size={16} />}
                              label="Quản lý bài test"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/company/interviews"
                              icon={<Calendar size={16} />}
                              label="Lịch phỏng vấn"
                              onClick={() => setUserMenuOpen(false)}
                            />
                            <DropdownItem
                              to="/my-reports"
                              icon={<Flag size={16} />}
                              label="Báo cáo của tôi"
                              onClick={() => setUserMenuOpen(false)}
                            />
                          </>
                        )}

                        {/* Role: admin */}
                        {user.role === "admin" && (
                          <DropdownItem
                            to="/admin"
                            icon={<LayoutDashboard size={16} />}
                            label="Admin Panel"
                            onClick={() => setUserMenuOpen(false)}
                          />
                        )}

                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={16} /> Đăng xuất
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive(link.to)
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.icon} {link.label}
            </Link>
          ))}

          {/* Mobile Links for Role: user */}
          {user?.role === "user" && (
            <>
              <div className="pt-2 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Cá nhân
              </div>
              <MobileNavLink
                to="/profile"
                icon={<User size={18} />}
                label="Hồ sơ của tôi"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/my-applications"
                icon={<BriefcaseBusiness size={18} />}
                label="Đơn ứng tuyển việc làm"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/my-interviews"
                icon={<Calendar size={18} />}
                label="Lịch phỏng vấn"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/my-project-applications"
                icon={<FolderOpen size={18} />}
                label="Đơn ứng tuyển dự án"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/saved-jobs"
                icon={<Bookmark size={18} />}
                label="Việc đã lưu"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/recommendations"
                icon={<Sparkles size={18} />}
                label="Gợi ý cho tôi"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/my-reports"
                icon={<Flag size={18} />}
                label="Báo cáo của tôi"
                onClick={() => setMobileOpen(false)}
              />
            </>
          )}

          {/* Mobile Links for Role: company */}
          {user?.role === "company" && (
            <>
              <div className="pt-2 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Tuyển dụng
              </div>
              <MobileNavLink
                to="/company/profile"
                icon={<Building2 size={18} />}
                label="Hồ sơ công ty"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/company/jobs"
                icon={<BriefcaseBusiness size={18} />}
                label="Quản lý tin đăng"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/company/applications"
                icon={<Users size={18} />}
                label="Ứng viên"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/company/tests"
                icon={<FileText size={18} />}
                label="Quản lý bài test"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/company/interviews"
                icon={<Calendar size={18} />}
                label="Lịch phỏng vấn"
                onClick={() => setMobileOpen(false)}
              />
              <MobileNavLink
                to="/my-reports"
                icon={<Flag size={18} />}
                label="Báo cáo của tôi"
                onClick={() => setMobileOpen(false)}
              />
            </>
          )}

          {!user ? (
            <div className="flex gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-600"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg"
              >
                Đăng ký
              </Link>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

// Helper components
function DropdownItem({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavLink({ to, icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </Link>
  );
}
