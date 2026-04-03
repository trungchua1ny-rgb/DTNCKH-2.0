import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  UserMinus,
  Star,
} from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import WriteReviewModal from "../../components/review/WriteReviewModal";
import { projectService } from "../../services/projectService";
import { formatTimeAgo, getAvatarFallback } from "../../utils/helpers";
import toast from "react-hot-toast";

export default function ManageProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("applications");

  // ── Review modal state ──────────────────────────────────────────────────────
  const [reviewModal, setReviewModal] = useState({
    open: false,
    projectMemberId: null,
    toUserId: null,
    toUserName: "",
  });

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () =>
      projectService.getProjectById(id).then((r) => r.data.data || r.data),
  });

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ["project-applications", id],
    queryFn: () =>
      projectService
        .getProjectApplications(id, { pageSize: 50 })
        .then((r) => r.data.data || r.data),
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["project-members", id],
    queryFn: () =>
      projectService.getProjectMembers(id).then((r) => r.data.data || r.data),
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const acceptMutation = useMutation({
    mutationFn: (appId) => projectService.acceptApplication(appId),
    onSuccess: () => {
      queryClient.invalidateQueries(["project-applications", id]);
      queryClient.invalidateQueries(["project-members", id]);
      toast.success("Đã chấp nhận thành viên!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  const rejectMutation = useMutation({
    mutationFn: (appId) => projectService.rejectApplication(appId),
    onSuccess: () => {
      queryClient.invalidateQueries(["project-applications", id]);
      toast.success("Đã từ chối đơn");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => projectService.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries(["project-members", id]);
      toast.success("Đã xóa thành viên");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Thao tác thất bại"),
  });

  if (projectLoading)
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );

  const applications = appsData?.applications || appsData || [];
  const pendingApps = Array.isArray(applications)
    ? applications.filter((a) => {
        const s = a.status?.toLowerCase();
        return s === "pending" || !s;
      })
    : [];

  const members = Array.isArray(membersData)
    ? membersData
    : membersData?.members || [];
  const activeMembers = members.filter((m) => m.status === "active");

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý dự án</h1>
            <p className="text-gray-500 text-sm mt-0.5">{project?.title}</p>
          </div>
          <Link
            to={`/projects/${id}/edit`}
            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Chỉnh sửa
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {[
            {
              key: "applications",
              label: `Đơn chờ duyệt (${pendingApps.length})`,
            },
            { key: "members", label: `Thành viên (${activeMembers.length})` },
            { key: "status", label: "Trạng thái dự án" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Applications ── */}
        {activeTab === "applications" && (
          <div className="space-y-3">
            {appsLoading ? (
              <LoadingSpinner />
            ) : pendingApps.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-400 text-sm">
                  Không có đơn nào đang chờ duyệt
                </p>
              </div>
            ) : (
              pendingApps.map((app) => {
                const applicantName =
                  app.applicant?.fullName || "Ứng viên ẩn danh";
                const applicantAvatar = app.applicant?.avatar;
                const positionRole = app.position?.role || "Vị trí";

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                        {applicantAvatar ? (
                          <img
                            src={`http://localhost:5024${applicantAvatar}`}
                            alt=""
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          getAvatarFallback(applicantName)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800">
                          {applicantName}
                        </p>
                        <p className="text-sm text-blue-600 font-medium">
                          {positionRole}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTimeAgo(app.appliedAt)}
                        </p>
                        {app.coverLetter && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2 bg-gray-50 rounded-lg p-2">
                            {app.coverLetter}
                          </p>
                        )}
                        {app.portfolioLink && (
                          <a
                            href={app.portfolioLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-500 hover:underline mt-1.5 block"
                          >
                            🔗 {app.portfolioLink}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Nhận ${applicantName} vào vị trí "${positionRole}"?`,
                            )
                          )
                            acceptMutation.mutate(app.id);
                        }}
                        disabled={
                          acceptMutation.isPending || rejectMutation.isPending
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60"
                      >
                        <CheckCircle2 size={16} /> Chấp nhận
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(`Từ chối đơn của ${applicantName}?`)
                          )
                            rejectMutation.mutate(app.id);
                        }}
                        disabled={
                          acceptMutation.isPending || rejectMutation.isPending
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-60"
                      >
                        <XCircle size={16} /> Từ chối
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Tab: Members ── */}
        {activeTab === "members" && (
          <div className="space-y-3">
            {membersLoading ? (
              <LoadingSpinner />
            ) : activeMembers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-400 text-sm">Chưa có thành viên nào</p>
              </div>
            ) : (
              activeMembers.map((member) => {
                const memberName =
                  member.user?.fullName || "Thành viên ẩn danh";
                const memberAvatar = member.user?.avatar;
                const memberRole =
                  member.position?.role || member.roleType || "Thành viên";
                const isFounder = member.roleType === "founder";

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                      {memberAvatar ? (
                        <img
                          src={`http://localhost:5024${memberAvatar}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getAvatarFallback(memberName)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800">
                          {memberName}
                        </p>
                        {isFounder && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                            Founder
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{memberRole}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* ✅ Nút viết review — chỉ hiện cho non-founder members */}
                      {!isFounder && member.user?.id && (
                        <button
                          onClick={() =>
                            setReviewModal({
                              open: true,
                              projectMemberId: member.id,
                              toUserId: member.user.id,
                              toUserName: memberName,
                            })
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-yellow-600 border border-yellow-200 text-xs font-medium rounded-lg hover:bg-yellow-50 transition-colors"
                          title="Viết đánh giá thành viên"
                        >
                          <Star
                            size={13}
                            className="fill-yellow-400 text-yellow-400"
                          />
                          Đánh giá
                        </button>
                      )}

                      {/* Nút xóa thành viên */}
                      {!isFounder && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Xóa ${memberName} khỏi dự án?`))
                              removeMutation.mutate(member.id);
                          }}
                          disabled={removeMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 border border-red-200 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                          <UserMinus size={14} /> Xóa
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Tab: Status ── */}
        {activeTab === "status" && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              Cập nhật trạng thái dự án
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              Trạng thái hiện tại:{" "}
              <span className="font-medium text-gray-600">
                {project?.status}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Mở lại tuyển dụng",
                  fn: () => projectService.reopenProject(id),
                  color: "green",
                },
                {
                  label: "Đang thực hiện",
                  fn: () => projectService.markInProgress(id),
                  color: "blue",
                },
                {
                  label: "Hoàn thành",
                  fn: () => projectService.markCompleted(id),
                  color: "purple",
                },
                {
                  label: "Đóng dự án",
                  fn: () => projectService.closeProject(id),
                  color: "red",
                },
              ].map((btn) => {
                const colorMap = {
                  green: "border-green-200 text-green-600 hover:bg-green-50",
                  blue: "border-blue-200 text-blue-600 hover:bg-blue-50",
                  purple:
                    "border-purple-200 text-purple-600 hover:bg-purple-50",
                  red: "border-red-200 text-red-600 hover:bg-red-50",
                };
                return (
                  <button
                    key={btn.label}
                    onClick={async () => {
                      if (
                        window.confirm(`Chuyển trạng thái sang "${btn.label}"?`)
                      ) {
                        try {
                          await btn.fn();
                          queryClient.invalidateQueries(["project", id]);
                          toast.success("Cập nhật thành công!");
                        } catch (err) {
                          toast.error(
                            err.response?.data?.message || "Thao tác thất bại",
                          );
                        }
                      }
                    }}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${colorMap[btn.color]}`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Write Review Modal ── */}
      {reviewModal.open && (
        <WriteReviewModal
          type="project"
          projectMemberId={reviewModal.projectMemberId}
          toUserId={reviewModal.toUserId}
          toUserName={reviewModal.toUserName}
          onClose={() =>
            setReviewModal({
              open: false,
              projectMemberId: null,
              toUserId: null,
              toUserName: "",
            })
          }
          onSuccess={() => toast.success("Đã gửi đánh giá!")}
        />
      )}
    </MainLayout>
  );
}
