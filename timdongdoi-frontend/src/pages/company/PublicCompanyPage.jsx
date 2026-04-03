import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ReportModal from "../../components/common/ReportModal";
import companyService from "../../services/companyService";
import { jobService } from "../../services/jobService";
import { useAuth } from "../../contexts/AuthContext";
import {
  Building2,
  Globe,
  Users,
  Calendar,
  MapPin,
  CheckCircle,
  ArrowLeft,
  Briefcase,
  Clock,
  AlertCircle,
  Flag,
} from "lucide-react";

const VERIFICATION_STATUS = {
  verified: {
    label: "Đã xác minh",
    color: "text-green-600 bg-green-50",
    icon: <CheckCircle size={13} />,
  },
  pending: {
    label: "Chờ xác minh",
    color: "text-yellow-600 bg-yellow-50",
    icon: <Clock size={13} />,
  },
  rejected: {
    label: "Chưa xác minh",
    color: "text-gray-500 bg-gray-50",
    icon: <AlertCircle size={13} />,
  },
};

export default function PublicCompanyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showReportModal, setShowReportModal] = useState(false); // ← thêm

  const {
    data: company,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["company", id],
    queryFn: () =>
      companyService.getCompanyById(id).then((r) => r.data.Data || r.data.data),
    enabled: !!id,
  });

  const { data: jobsData } = useQuery({
    queryKey: ["companyJobs", id],
    queryFn: () => jobService.getJobsByCompany(id, { page: 1, pageSize: 10 }),
    enabled: !!id,
  });
  const jobs = jobsData?.data?.data || [];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={14} /> Quay lại
        </button>

        {isLoading && <LoadingSpinner />}

        {isError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <AlertCircle size={18} className="flex-shrink-0" />
            Không tìm thấy thông tin công ty.
          </div>
        )}

        {!isLoading && !isError && company && (
          <>
            {/* ---- HEADER ---- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-5">
                {/* Logo */}
                <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
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

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl font-bold text-gray-900">
                          {company.name}
                        </h1>
                        {company.verificationStatus && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${VERIFICATION_STATUS[company.verificationStatus]?.color || ""}`}
                          >
                            {
                              VERIFICATION_STATUS[company.verificationStatus]
                                ?.icon
                            }
                            {
                              VERIFICATION_STATUS[company.verificationStatus]
                                ?.label
                            }
                          </span>
                        )}
                      </div>
                      {company.industry && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {company.industry}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        {company.size && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Users size={12} /> {company.size} nhân viên
                          </span>
                        )}
                        {company.foundedYear && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={12} /> Thành lập{" "}
                            {company.foundedYear}
                          </span>
                        )}
                        {jobs.length > 0 && (
                          <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
                            <Briefcase size={12} /> {jobs.length} vị trí đang
                            tuyển
                          </span>
                        )}
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <Globe size={12} /> {company.website}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* ✅ Nút báo cáo công ty */}
                    {user && (
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium rounded-xl transition-colors shrink-0"
                      >
                        <Flag size={13} /> Báo cáo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ---- MÔ TẢ ---- */}
            {company.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-3">
                  Giới thiệu công ty
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {company.description}
                </p>
              </div>
            )}

            {/* ---- ĐỊA ĐIỂM ---- */}
            {company.locations?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500" /> Địa điểm
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {company.locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <MapPin
                        size={14}
                        className="text-blue-400 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm text-gray-800">
                          {loc.address}
                          {loc.city ? `, ${loc.city}` : ""}
                        </p>
                        <p className="text-xs text-gray-400">{loc.country}</p>
                        {loc.isHeadquarter && (
                          <span className="text-xs text-blue-600 font-medium">
                            Trụ sở chính
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- VIỆC LÀM ĐANG TUYỂN ---- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-500" />
                  Vị trí đang tuyển
                  {jobs.length > 0 && (
                    <span className="text-xs font-normal text-gray-400">
                      ({jobs.length})
                    </span>
                  )}
                </h2>
                <Link
                  to={`/job-search?companyId=${id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Xem tất cả
                </Link>
              </div>

              {jobs.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Hiện tại công ty chưa có vị trí tuyển dụng nào.
                </p>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      to={`/jobs/${job.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">
                          {job.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {job.location && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={10} /> {job.location}
                            </span>
                          )}
                          {job.salaryMin && (
                            <span className="text-xs text-green-600 font-medium">
                              {(job.salaryMin / 1_000_000).toFixed(0)}M
                              {job.salaryMax
                                ? ` - ${(job.salaryMax / 1_000_000).toFixed(0)}M`
                                : "+"}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleDateString("vi-VN")
                          : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ✅ Report Modal */}
      {showReportModal && company && (
        <ReportModal
          type="user"
          targetId={company.userId || Number(id)}
          targetName={company.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </MainLayout>
  );
}
