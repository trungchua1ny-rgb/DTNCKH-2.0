import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import ProjectCard from "../../components/project/ProjectCard";
import ProjectFilter from "../../components/project/ProjectFilter";
import Pagination from "../../components/common/Pagination";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { projectService } from "../../services/projectService";
import { useAuth } from "../../contexts/AuthContext";

export default function ProjectListPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ page: 1, pageSize: 12 });

  const { data, isLoading } = useQuery({
    queryKey: ["projects", filters],
    queryFn: () => projectService.getProjects(filters).then((r) => r.data),
  });

  const projects = data?.data || [];
  const totalCount = data?.pagination?.totalCount || 0;
  const page = data?.pagination?.page || filters.page;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Tìm đồng đội
            </h1>
            <p className="text-gray-500 text-sm">
              {totalCount > 0
                ? `${totalCount} dự án đang tìm thành viên`
                : "Khám phá các dự án thú vị"}
            </p>
          </div>
          {user?.role === "user" && (
            <Link
              to="/projects/create"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-md"
            >
              + Tạo dự án
            </Link>
          )}
        </div>

        {/* Filter */}
        <div className="mb-6">
          <ProjectFilter filters={filters} onChange={setFilters} />
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<Users size={64} />}
            title="Không tìm thấy dự án"
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
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            <Pagination
              page={page}
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
