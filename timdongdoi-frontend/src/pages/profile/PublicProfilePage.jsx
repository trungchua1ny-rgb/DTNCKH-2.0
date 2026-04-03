import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MainLayout from "../../components/layout/MainLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ReportModal from "../../components/common/ReportModal";
import ReviewCard from "../../components/review/ReviewCard";
import WriteReviewModal from "../../components/review/WriteReviewModal";
import userService from "../../services/userService";
import reviewService from "../../services/reviewService";
import toast from "react-hot-toast";
import {
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  User,
  ArrowLeft,
  MessageSquare,
  Edit2,
  Building2,
  GraduationCap,
  FileText,
  AlertCircle,
  Flag,
  Star,
} from "lucide-react";
import { getAvatarFallback } from "../../utils/helpers";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const GENDER_LABELS = { male: "Nam", female: "Nữ", other: "Khác" };

const SKILL_LEVEL_COLORS = {
  beginner: "bg-gray-100 text-gray-600",
  intermediate: "bg-blue-50 text-blue-600",
  advanced: "bg-indigo-50 text-indigo-600",
  expert: "bg-purple-50 text-purple-600",
  junior: "bg-green-50 text-green-600",
  senior: "bg-orange-50 text-orange-600",
};

const SKILL_LEVEL_LABELS = {
  beginner: "Mới bắt đầu",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
  expert: "Chuyên gia",
  junior: "Junior",
  senior: "Senior",
};

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={
            s <= Math.round(rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
    </div>
  );
}

// ─── Review Stats Bar ─────────────────────────────────────────────────────────
function ReviewStatsBar({ stats }) {
  if (!stats || stats.totalReviews === 0) return null;
  const bars = [
    { stars: 5, count: stats.fiveStars },
    { stars: 4, count: stats.fourStars },
    { stars: 3, count: stats.threeStars },
    { stars: 2, count: stats.twoStars },
    { stars: 1, count: stats.oneStar },
  ];
  return (
    <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-2xl">
      <div className="text-center flex-shrink-0">
        <p className="text-4xl font-extrabold text-gray-800">
          {stats.averageRating.toFixed(1)}
        </p>
        <StarRow rating={stats.averageRating} size={16} />
        <p className="text-xs text-gray-400 mt-1">
          {stats.totalReviews} đánh giá
        </p>
      </div>
      <div className="flex-1 space-y-1.5">
        {bars.map(({ stars, count }) => (
          <div key={stars} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-4 text-right">
              {stars}
            </span>
            <Star
              size={11}
              className="text-yellow-400 fill-yellow-400 flex-shrink-0"
            />
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{
                  width: stats.totalReviews
                    ? `${(count / stats.totalReviews) * 100}%`
                    : "0%",
                }}
              />
            </div>
            <span className="text-xs text-gray-400 w-4">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PublicProfilePage() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Theo rule Frontend của bạn: user không thể tự vào PublicProfilePage của chính mình
  const isOwnProfile = false;

  const [showReportModal, setShowReportModal] = useState(false);
  const [reviewModal, setReviewModal] = useState({
    open: false,
    type: "job",
    applicationId: null,
    projectMemberId: null,
  });
  const [editingReview, setEditingReview] = useState(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTypeFilter, setReviewTypeFilter] = useState("");

  // ── Profile ────────────────────────────────────────────────────────────────
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["publicProfile", id],
    queryFn: () =>
      userService.getPublicProfile(id).then((r) => r.data.data || r.data.Data),
    enabled: !!id,
  });

  // ── Fetch shared application (để lấy applicationId cho review) ────────────
  const { data: sharedAppData } = useQuery({
    queryKey: ["sharedApplication", authUser?.id, id],
    queryFn: () =>
      api.get("/applications/my", { params: { pageSize: 100 } }).then((r) => {
        const apps = r.data?.data || r.data?.Data || [];
        return (
          apps.find(
            (a) =>
              a.status?.toLowerCase() === "accepted" &&
              (a.job?.company?.userId === Number(id) ||
                a.userId === Number(id)),
          ) || null
        );
      }),
    enabled: !!authUser && !isOwnProfile && authUser.role === "user",
  });

  const { data: companySharedApp } = useQuery({
    queryKey: ["companySharedApp", authUser?.id, id],
    queryFn: () =>
      api
        .get("/applications/my-accepted", { params: { toUserId: id } })
        .then((r) => r.data?.data?.[0] || null)
        .catch(() => null),
    enabled: !!authUser && !isOwnProfile && authUser.role === "company",
  });

  const sharedApplication = sharedAppData || companySharedApp || null;
  const canWriteReview = !!authUser && !isOwnProfile && !!sharedApplication;

  // ── Reviews ────────────────────────────────────────────────────────────────
  const { data: reviewStatsData } = useQuery({
    queryKey: ["reviewStats", id],
    queryFn: () =>
      reviewService.getUserReviewStats(id).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["userReviews", id, reviewPage, reviewTypeFilter],
    queryFn: () =>
      reviewService
        .getUserReviews(id, {
          page: reviewPage,
          pageSize: 5,
          type: reviewTypeFilter || undefined,
        })
        .then((r) => r.data),
    enabled: !!id,
  });

  const reviews = reviewsData?.data || [];
  const reviewPages = reviewsData?.pagination?.totalPages || 1;
  const reviewStats = reviewStatsData;

  // ── Mutations ──────────────────────────────────────────────────────────────
  function invalidateReviews() {
    queryClient.invalidateQueries(["userReviews", id]);
    queryClient.invalidateQueries(["reviewStats", id]);
  }

  const deleteMutation = useMutation({
    mutationFn: (reviewId) => reviewService.deleteReview(reviewId),
    onSuccess: () => {
      invalidateReviews();
      toast.success("Đã xóa đánh giá");
    },
    onError: () => toast.error("Xóa thất bại"),
  });

  // ── Open review modal ──────────────────────────────────────────────────────
  function openReviewModal() {
    if (!sharedApplication) {
      toast.error("Bạn chưa có lần hợp tác nào được chấp nhận với người này");
      return;
    }
    setReviewModal({
      open: true,
      type: "job",
      applicationId: sharedApplication.id,
      projectMemberId: null,
    });
  }

  const displaySkills = profile?.skills || [];
  const displayExperiences = profile?.experiences || [];
  const displayEducations = profile?.educations || [];

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
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
            Không tìm thấy hồ sơ người dùng này.
          </div>
        )}

        {!isLoading && !isError && profile && (
          <>
            {/* ─── HEADER ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
                    {profile.avatar ? (
                      <img
                        src={`http://localhost:5024${profile.avatar}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getAvatarFallback(profile.fullName)
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {profile.fullName}
                    </h1>
                    {profile.jobTitle && (
                      <p className="text-sm text-blue-600 font-medium mt-0.5">
                        {profile.jobTitle}
                      </p>
                    )}
                    {profile.address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin size={11} /> {profile.address}
                      </p>
                    )}
                    {reviewStats && reviewStats.totalReviews > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star
                          size={13}
                          className="text-yellow-400 fill-yellow-400"
                        />
                        <span className="text-sm font-semibold text-gray-700">
                          {reviewStats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({reviewStats.totalReviews} đánh giá)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {authUser && (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/messages/${id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition shadow-sm"
                      >
                        <MessageSquare size={14} /> Nhắn tin
                      </Link>
                      {/* Báo cáo Hồ sơ người dùng */}
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 text-sm rounded-xl transition-colors"
                      >
                        <Flag size={14} /> Báo cáo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── GIỚI THIỆU ─────────────────────────────────────────── */}
            {profile.aboutMe && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-3">
                  Giới thiệu
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {profile.aboutMe}
                </p>
              </div>
            )}

            {/* ─── THÔNG TIN ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User size={16} className="text-blue-500" /> Thông tin
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={<Briefcase size={14} />}
                  label="Vị trí"
                  value={profile.jobTitle}
                />
                <InfoRow
                  icon={<DollarSign size={14} />}
                  label="Lương mong muốn"
                  value={
                    profile.salaryExpectation
                      ? `${Number(profile.salaryExpectation).toLocaleString("vi-VN")} VNĐ`
                      : null
                  }
                />
                <InfoRow
                  icon={<Calendar size={14} />}
                  label="Ngày sinh"
                  value={
                    profile.birthday
                      ? new Date(profile.birthday).toLocaleDateString("vi-VN")
                      : null
                  }
                />
                <InfoRow
                  icon={<User size={14} />}
                  label="Giới tính"
                  value={GENDER_LABELS[profile.gender]}
                />
                <InfoRow
                  icon={<MapPin size={14} />}
                  label="Địa chỉ"
                  value={profile.address}
                />
                {profile.cvFile && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                      <span className="text-gray-300">
                        <FileText size={14} />
                      </span>{" "}
                      CV
                    </p>
                    <a
                      href={`http://localhost:5024${profile.cvFile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      Xem CV
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* ─── KỸ NĂNG ────────────────────────────────────────────── */}
            {displaySkills.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-500" /> Kỹ năng
                </h2>
                <div className="flex flex-wrap gap-2">
                  {displaySkills.map((skill) => {
                    const level = skill.level?.toLowerCase() || "beginner";
                    return (
                      <div
                        key={skill.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-sm"
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {skill.skillName}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${SKILL_LEVEL_COLORS[level] || "bg-gray-100 text-gray-600"}`}
                        >
                          {SKILL_LEVEL_LABELS[level] || level}
                        </span>
                        {skill.yearsExperience && (
                          <span className="text-xs text-gray-400">
                            {skill.yearsExperience} năm
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── KINH NGHIỆM ────────────────────────────────────────── */}
            {displayExperiences.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" /> Kinh nghiệm
                  làm việc
                </h2>
                <div className="space-y-4">
                  {displayExperiences.map((exp) => (
                    <div key={exp.id} className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Building2 size={16} className="text-blue-500" />
                      </div>
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
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── HỌC VẤN ────────────────────────────────────────────── */}
            {displayEducations.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <GraduationCap size={16} className="text-indigo-500" /> Học
                  vấn
                </h2>
                <div className="space-y-4">
                  {displayEducations.map((edu) => (
                    <div key={edu.id} className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GraduationCap size={16} className="text-indigo-500" />
                      </div>
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
                        {edu.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── ĐÁNH GIÁ ───────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Star size={16} className="text-yellow-500" />
                  Đánh giá
                  {reviewStats?.totalReviews > 0 && (
                    <span className="text-sm font-normal text-gray-400">
                      ({reviewStats.totalReviews})
                    </span>
                  )}
                </h2>
                {/* Nút viết đánh giá */}
                {canWriteReview && (
                  <button
                    onClick={openReviewModal}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition border border-yellow-200"
                  >
                    <Star
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    Viết đánh giá
                  </button>
                )}
                {/* Yêu cầu hợp tác để đánh giá */}
                {authUser && !canWriteReview && !sharedAppData && (
                  <span className="text-xs text-gray-400 italic">
                    Cần có lần hợp tác được chấp nhận để đánh giá
                  </span>
                )}
              </div>

              <ReviewStatsBar stats={reviewStats} />

              {/* Filter tabs */}
              {reviewStats?.totalReviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  {[
                    { value: "", label: "Tất cả" },
                    { value: "job", label: "Việc làm" },
                    { value: "project", label: "Dự án" },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setReviewTypeFilter(tab.value);
                        setReviewPage(1);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
                        reviewTypeFilter === tab.value
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {reviewsLoading ? (
                <LoadingSpinner />
              ) : reviews.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Star size={36} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Chưa có đánh giá nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isOwnProfile={false} // ✅ Báo cho ReviewCard biết đây là trang Public
                      onDelete={
                        review.canDelete
                          ? (rid) => {
                              if (window.confirm("Xóa đánh giá này?"))
                                deleteMutation.mutate(rid);
                            }
                          : undefined
                      }
                      // ❌ KHÔNG TRUYỀN onToggleVisibility VÀO ĐÂY
                      onEdit={
                        review.canEdit ? (r) => setEditingReview(r) : undefined
                      }
                    />
                  ))}
                </div>
              )}

              {reviewPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  <button
                    onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                    disabled={reviewPage === 1}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    ← Trước
                  </button>
                  <span className="text-xs text-gray-500">
                    {reviewPage} / {reviewPages}
                  </span>
                  <button
                    onClick={() =>
                      setReviewPage((p) => Math.min(reviewPages, p + 1))
                    }
                    disabled={reviewPage === reviewPages}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────────── */}
      {/* Modal báo cáo cho Hồ sơ User */}
      {showReportModal && profile && (
        <ReportModal
          type="user"
          targetId={Number(id)}
          targetName={profile.fullName}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {reviewModal.open && profile && (
        <WriteReviewModal
          type={reviewModal.type}
          applicationId={reviewModal.applicationId}
          projectMemberId={reviewModal.projectMemberId}
          toUserId={Number(id)}
          toUserName={profile.fullName}
          onClose={() =>
            setReviewModal({
              open: false,
              type: "job",
              applicationId: null,
              projectMemberId: null,
            })
          }
          onSuccess={invalidateReviews}
        />
      )}

      {editingReview && (
        <WriteReviewModal
          type={editingReview.type}
          toUserId={editingReview.toUserId}
          toUserName={editingReview.toUserName}
          existingReview={editingReview}
          onClose={() => setEditingReview(null)}
          onSuccess={invalidateReviews}
        />
      )}
    </MainLayout>
  );

  function invalidateReviews() {
    queryClient.invalidateQueries(["userReviews", id]);
    queryClient.invalidateQueries(["reviewStats", id]);
  }
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
