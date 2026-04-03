import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import {
  Users,
  Briefcase,
  Rocket,
  Building2,
  Mail,
  Github,
  Facebook,
  Linkedin,
  Heart,
} from "lucide-react";

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow">
                <Users size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">TimĐồngĐội</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Nền tảng kết nối ứng viên với nhà tuyển dụng và tìm đồng đội cho
              các dự án startup, freelance tại Việt Nam.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {[
                { icon: <Facebook size={16} />, href: "#" },
                { icon: <Linkedin size={16} />, href: "#" },
                { icon: <Github size={16} />, href: "#" },
                { icon: <Mail size={16} />, href: "#" },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-blue-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Việc làm */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Việc làm
              </h3>
            </div>
            <div className="flex flex-col gap-2.5">
              <FooterLink to="/job-search">Tìm việc làm</FooterLink>
              <FooterLink to="/job-search?type=full-time">
                Toàn thời gian
              </FooterLink>
              <FooterLink to="/job-search?type=part-time">
                Bán thời gian
              </FooterLink>
              <FooterLink to="/job-search?type=internship">
                Thực tập sinh
              </FooterLink>
              <FooterLink to="/job-search?locationType=remote">
                Làm việc Remote
              </FooterLink>
              <FooterLink to="/saved-jobs">Việc đã lưu</FooterLink>
            </div>
          </div>

          {/* Dự án */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Rocket size={16} className="text-violet-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Tìm đồng đội
              </h3>
            </div>
            <div className="flex flex-col gap-2.5">
              <FooterLink to="/projects">Khám phá dự án</FooterLink>
              <FooterLink to="/projects?type=startup">Startup</FooterLink>
              <FooterLink to="/projects?type=freelance">Freelance</FooterLink>
              <FooterLink to="/projects?type=open_source">
                Open Source
              </FooterLink>
              <FooterLink to="/projects/create">Đăng dự án</FooterLink>
            </div>
          </div>

          {/* Công ty & Tài khoản */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Nhà tuyển dụng
              </h3>
            </div>
            <div className="flex flex-col gap-2.5">
              <FooterLink to="/companies">Khám phá công ty</FooterLink>
              <FooterLink to="/register">Đăng ký tuyển dụng</FooterLink>
              <FooterLink to="/company/profile">Quản lý công ty</FooterLink>
              <FooterLink to="/company/jobs">Quản lý tin đăng</FooterLink>
              <FooterLink to="/company/applications">Xem ứng viên</FooterLink>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs flex items-center gap-1">
            © 2025 TimĐồngĐội. Made with{" "}
            <Heart size={11} className="text-red-400 fill-red-400 inline" /> tại
            Việt Nam.
          </p>
          <div className="flex items-center gap-4">
            <FooterLink to="#">Điều khoản sử dụng</FooterLink>
            <FooterLink to="#">Chính sách bảo mật</FooterLink>
            <FooterLink to="#">Liên hệ</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
