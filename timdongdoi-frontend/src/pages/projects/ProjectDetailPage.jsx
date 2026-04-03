import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  Clock,
  DollarSign,
  Layers,
  CheckCircle2,
  Loader2,
  LogOut,
  Flag,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ReportModal from "../../components/common/ReportModal";
import { projectService } from "../../services/projectService";
import { useAuth } from "../../contexts/AuthContext";
import { formatTimeAgo, getAvatarFallback } from "../../utils/helpers";
import {
  PROJECT_TYPES,
  COMPENSATION_TYPES,
  LOCATION_TYPES,
  PROJECT_STATUSES,
} from "../../utils/constants";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [applyPositionId, setApplyPositionId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false); // ← thêm

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProjectById(id).then((r) => r.data.data),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["project-members", id],
    queryFn: () =>
      projectService.getProjectMembers(id).then((r) => r.data.data),
    enabled: !!id,
  });

  const leaveMutation = useMutation({
    mutationFn: () => projectService.leaveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["project-members", id]);
      queryClient.invalidateQueries(["my-project-applications"]);
      alert("Bạn đã rời dự án thành công!");
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Không thể rời dự án");
    },
  });

  if (isLoading)
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  if (!project)
    return (
      <MainLayout>
        <div className="text-center py-20 text-gray-500">
          Không tìm thấy dự án
        </div>
      </MainLayout>
    );

  const isOwner = user?.id === project.userId;
  const isMember = members.some(
    (m) => m.userId === user?.id && m.status === "active",
  );
  const statusInfo = PROJECT_STATUSES[project.status] || {
    label: project.status,
    color: "bg-gray-100 text-gray-600",
  };
  const projectType = PROJECT_TYPES.find(
    (t) => t.value === project.type,
  )?.label;
  const compType = COMPENSATION_TYPES.find(
    (c) => c.value === project.compensationType,
  )?.label;
  const locType = LOCATION_TYPES.find(
    (l) => l.value === project.locationType,
  )?.label;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        {/* Banner: dự án của mình */}
        {isOwner && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700">
              <Layers size={16} />
              <span className="text-sm font-medium">Đây là dự án của bạn</span>
            </div>
            <Link
              to={`/projects/${id}/manage`}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
            >
              Quản lý ngay →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== MAIN ===== */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-xl font-bold text-gray-800 flex-1">
                  {project.title}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              {/* Owner */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  {project.owner?.avatar ? (
                    <img
                      src={`http://localhost:5024${project.owner.avatar}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getAvatarFallback(project.owner?.fullName)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-700">
                      {project.owner?.fullName}
                    </p>
                    {isOwner && (
                      <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-medium">
                        Bạn
                      </span>
                    )}
                  </div>
                  {project.owner?.jobTitle && (
                    <p className="text-xs text-gray-500">
                      {project.owner.jobTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {projectType && <Tag color="indigo">{projectType}</Tag>}
                {locType && <Tag color="blue">{locType}</Tag>}
                {compType && <Tag color="green">{compType}</Tag>}
                {project.durationMonths && (
                  <Tag color="orange">{project.durationMonths} tháng</Tag>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatBox
                  icon={<Users size={16} />}
                  label="Vị trí mở"
                  value={
                    project.positions?.filter((p) => p.status === "open")
                      .length || 0
                  }
                />
                <StatBox
                  icon={<Clock size={16} />}
                  label="Đã đăng"
                  value={formatTimeAgo(project.createdAt)}
                />
                <StatBox
                  icon={<Layers size={16} />}
                  label="Lượt xem"
                  value={project.views || 0}
                />
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-3">
                Mô tả dự án
              </h2>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {project.description}
              </div>
            </div>

            {/* Positions */}
            {project.positions?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4">
                  Vị trí đang tuyển (
                  {project.positions.filter((p) => p.status === "open").length})
                </h2>
                <div className="space-y-3">
                  {project.positions.map((pos) => (
                    <div
                      key={pos.id}
                      className={`border rounded-xl p-4 transition-colors ${
                        pos.status === "open"
                          ? "border-blue-100 bg-blue-50/30"
                          : "border-gray-100 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800">
                              {pos.role}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                pos.status === "open"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {pos.status === "open" ? "Đang tuyển" : "Đã đủ"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {pos.currentMembers || 0}/{pos.quantity} thành viên
                          </p>
                          {pos.requirements && (
                            <p className="text-sm text-gray-600 mb-2">
                              {pos.requirements}
                            </p>
                          )}
                          {pos.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {pos.skills.map((s) => (
                                <span
                                  key={s.skillId}
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    s.isRequired
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {s.skillName}
                                  {s.isRequired && " *"}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {user?.role === "user" &&
                          !isOwner &&
                          !isMember &&
                          pos.status === "open" &&
                          project.status === "open" && (
                            <button
                              onClick={() => setApplyPositionId(pos.id)}
                              className="shrink-0 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                            >
                              Apply
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            {members.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4">
                  Thành viên (
                  {members.filter((m) => m.status === "active").length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {members
                    .filter((m) => m.status === "active")
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                          {member.avatar ? (
                            <img
                              src={`http://localhost:5024${member.avatar}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getAvatarFallback(member.fullName)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {member.fullName}
                            </p>
                            {member.userId === user?.id && (
                              <span className="text-xs text-indigo-500 font-medium shrink-0">
                                (Bạn)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== SIDEBAR ===== */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-20">
              {!user && (
                <Link
                  to="/login"
                  className="block w-full py-2.5 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md mb-3 text-sm"
                >
                  Đăng nhập để tham gia
                </Link>
              )}

              {user?.role === "user" &&
                !isOwner &&
                !isMember &&
                project.status === "open" && (
                  <div className="p-3 bg-blue-50 rounded-xl text-center mb-3">
                    <p className="text-sm text-blue-600 font-medium">
                      👆 Chọn vị trí bên trái để apply
                    </p>
                  </div>
                )}

              {isMember && (
                <button
                  onClick={() => {
                    if (window.confirm("Bạn có chắc muốn rời dự án này?")) {
                      leaveMutation.mutate();
                    }
                  }}
                  disabled={leaveMutation.isPending}
                  className="w-full py-2.5 border-2 border-red-200 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-2 mb-3"
                >
                  {leaveMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Đang xử
                      lý...
                    </>
                  ) : (
                    <>
                      <LogOut size={16} /> Rời dự án
                    </>
                  )}
                </button>
              )}

              {isOwner && (
                <div className="space-y-2 mb-3">
                  <Link
                    to={`/projects/${id}/manage`}
                    className="block w-full py-2.5 text-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md text-sm"
                  >
                    Quản lý dự án
                  </Link>
                  <Link
                    to={`/projects/${id}/edit`}
                    className="block w-full py-2.5 text-center border-2 border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    Chỉnh sửa
                  </Link>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 space-y-3">
                {project.compensationDetails && (
                  <div className="flex items-start gap-2 text-sm">
                    <DollarSign
                      size={16}
                      className="text-green-500 shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-xs text-gray-400">Thù lao</p>
                      <p className="font-medium text-gray-700">
                        {project.compensationDetails}
                      </p>
                    </div>
                  </div>
                )}
                {project.durationMonths && (
                  <div className="flex items-start gap-2 text-sm">
                    <Clock
                      size={16}
                      className="text-blue-500 shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-xs text-gray-400">Thời gian</p>
                      <p className="font-medium text-gray-700">
                        {project.durationMonths} tháng
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Nút báo cáo — chỉ hiện khi đăng nhập và không phải owner */}
              {user && !isOwner && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full mt-3 pt-3 border-t border-gray-100 py-2 text-xs text-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Flag size={13} /> Báo cáo dự án
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyPositionId && (
        <ApplyModal
          project={project}
          positionId={applyPositionId}
          onClose={() => setApplyPositionId(null)}
          onSuccess={() => {
            setApplyPositionId(null);
            queryClient.invalidateQueries(["my-project-applications"]);
          }}
        />
      )}

      {/* ✅ Report Modal */}
      {showReportModal && (
        <ReportModal
          type="project"
          targetId={project.id}
          targetName={project.title}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </MainLayout>
  );
}

// ==================== Apply Modal ====================
function ApplyModal({ project, positionId, onClose, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const position = project.positions?.find((p) => p.id === positionId);
  const charCount = coverLetter.trim().length;
  const minChars = 20;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim()) {
      setError("Vui lòng nhập phần giới thiệu bản thân");
      return;
    }
    if (charCount < minChars) {
      setError(
        `Phần giới thiệu quá ngắn (${charCount}/${minChars} ký tự tối thiểu). Hãy mô tả kinh nghiệm và lý do bạn phù hợp với vị trí này.`,
      );
      return;
    }
    if (portfolioLink && !portfolioLink.startsWith("http")) {
      setError("Link portfolio phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await projectService.applyToProject(project.id, {
        positionId,
        coverLetter: coverLetter.trim(),
        portfolioLink: portfolioLink || null,
      });
      setSuccess(true);
      setTimeout(onSuccess, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Apply thất bại, vui lòng thử lại",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Apply vị trí: {position?.role}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{project.title}</p>
        </div>

        {success ? (
          <div className="p-10 text-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">Apply thành công!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Giới thiệu bản thân <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tại sao bạn phù hợp với vị trí này? Kinh nghiệm liên quan?"
                className={`w-full px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 transition ${
                  charCount > 0 && charCount < minChars
                    ? "border-red-300 focus:ring-red-400"
                    : "border-gray-200 focus:ring-blue-500"
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {charCount > 0 && charCount < minChars ? (
                  <p className="text-xs text-red-400">
                    Cần thêm {minChars - charCount} ký tự nữa
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    {charCount >= minChars
                      ? "✓ Đủ độ dài"
                      : `Tối thiểu ${minChars} ký tự`}
                  </p>
                )}
                <p
                  className={`text-xs font-medium ${charCount >= minChars ? "text-green-500" : "text-gray-400"}`}
                >
                  {charCount}/{minChars}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Portfolio / GitHub (tùy chọn)
              </label>
              <input
                type="text"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Đang gửi..." : "Gửi Apply"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ==================== Helpers ====================
function Tag({ color, children }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[color]}`}
    >
      {children}
    </span>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="flex justify-center text-blue-500 mb-1">{icon}</div>
      <p className="text-sm font-semibold text-gray-700">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
