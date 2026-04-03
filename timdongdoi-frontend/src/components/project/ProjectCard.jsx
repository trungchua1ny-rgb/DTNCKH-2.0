import { Link } from "react-router-dom";
import { Users, Clock } from "lucide-react";
import { formatTimeAgo, truncate } from "../../utils/helpers";
import {
  PROJECT_TYPES,
  COMPENSATION_TYPES,
  LOCATION_TYPES,
} from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";

export default function ProjectCard({ project }) {
  const { user } = useAuth();
  const isOwner = user?.id === project.owner?.id;

  const projectType =
    PROJECT_TYPES.find((t) => t.value === project.type)?.label || project.type;
  const compensationType =
    COMPENSATION_TYPES.find((c) => c.value === project.compensationType)
      ?.label || project.compensationType;
  const locationType =
    LOCATION_TYPES.find((l) => l.value === project.locationType)?.label ||
    project.locationType;

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col ${
        isOwner ? "border-indigo-200 ring-1 ring-indigo-100" : "border-gray-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <Link
          to={`/projects/${project.id}`}
          className="font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-2 flex-1"
        >
          {project.title}
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOwner ? (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
              Của tôi
            </span>
          ) : project.status === "open" ? (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Đang tuyển
            </span>
          ) : null}
        </div>
      </div>

      {/* Owner */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
          {project.owner?.avatar ? (
            <img
              src={`http://localhost:5024${project.owner.avatar}`}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            project.owner?.fullName?.[0] || "?"
          )}
        </div>
        <span className="text-xs text-gray-500 truncate">
          {project.owner?.fullName}
          {isOwner && (
            <span className="text-indigo-500 font-medium"> (Bạn)</span>
          )}
        </span>
        {project.owner?.jobTitle && (
          <span className="text-xs text-gray-400 truncate hidden sm:inline">
            · {project.owner.jobTitle}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 line-clamp-2 mb-3 flex-1">
        {truncate(project.description, 120)}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {projectType && (
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
            {projectType}
          </span>
        )}
        {locationType && (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
            {locationType}
          </span>
        )}
        {compensationType && (
          <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs font-medium rounded-full">
            {compensationType}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {project.openPositions || 0} vị trí
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatTimeAgo(project.createdAt)}
          </span>
        </div>
        <Link
          to={`/projects/${project.id}`}
          className={`text-xs font-semibold transition-colors ${
            isOwner
              ? "text-indigo-600 hover:text-indigo-700"
              : "text-blue-600 hover:text-blue-700"
          }`}
        >
          {isOwner ? "Quản lý →" : "Xem chi tiết →"}
        </Link>
      </div>
    </div>
  );
}
