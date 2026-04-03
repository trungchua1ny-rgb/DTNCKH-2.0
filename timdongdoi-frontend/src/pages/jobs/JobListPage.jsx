import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { BriefcaseBusiness } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import JobCard from "../../components/job/JobCard";
import JobFilter from "../../components/job/JobFilter";
import Pagination from "../../components/common/Pagination";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { jobService } from "../../services/jobService";
import { useAuth } from "../../contexts/AuthContext";

export default function JobListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Đọc query params từ URL khi mới vào trang
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 12,
    search:       searchParams.get("search")       || "",
    type:         searchParams.get("type")         || "",
    level:        searchParams.get("level")        || "",
    locationType: searchParams.get("locationType") || "",
  });

  // Fetch jobs
  const { data, isLoading } = useQuery({
    queryKey: ["jobs", filters],
    queryFn: () => jobService.getJobs(filters).then((r) => r.data),
  });

  // Fetch saved jobs (chỉ khi đăng nhập)
  const { data: savedData } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => jobService.getSavedJobs().then((r) => r.data),
    enabled: !!user && user.role === "user",
  });

  const savedJobList = Array.isArray(savedData?.data)
    ? savedData.data
    : Array.isArray(savedData)
      ? savedData
      : [];
  const savedJobIds = new Set(savedJobList.map((j) => j.jobId || j.id));

  const saveMutation = useMutation({
    mutationFn: (jobId) =>
      savedJobIds.has(jobId)
        ? jobService.unsaveJob(jobId)
        : jobService.saveJob(jobId),
    onSuccess: () => queryClient.invalidateQueries(["saved-jobs"]),
  });

  const jobs       = data?.data  || [];
  const totalCount = data?.total || 0;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Tìm kiếm việc làm
          </h1>
          <p className="text-gray-500 text-sm">
            {totalCount > 0
              ? `${totalCount} việc làm đang tuyển dụng`
              : "Khám phá cơ hội nghề nghiệp"}
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <JobFilter filters={filters} onChange={setFilters} />
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<BriefcaseBusiness size={64} />}
            title="Không tìm thấy việc làm"
            description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
            action={
              <button
                onClick={() => setFilters({ page: 1, pageSize: 12 })}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Xóa bộ lọc
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedJobIds.has(job.id)}
                  onSave={
                    user?.role === "user"
                      ? (id) => saveMutation.mutate(id)
                      : null
                  }
                />
              ))}
            </div>

            <Pagination
              page={filters.page}
              pageSize={filters.pageSize}
              total={totalCount}
              onChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}