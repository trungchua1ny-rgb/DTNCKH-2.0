// =====================================================
// src/hooks/useJobMatch.js
// Hook lấy match score cho 1 job — dùng trong JobCard
// Chỉ fetch khi user đã đăng nhập và role = "user"
// =====================================================
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { recommendationService } from "../services/recommendationService";

export function useJobMatch(jobId) {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["job-match", jobId],
    queryFn: () =>
      recommendationService.getJobMatch(jobId).then((r) => r.data.data),
    enabled: !!user && user.role === "user" && !!jobId,
    staleTime: 10 * 60 * 1000, // cache 10 phút
    retry: false,
  });

  return {
    matchScore: data?.matchScore ?? null,
    matchLevel: data?.matchLevel ?? null,
  };
}

export function useProjectMatch(projectId) {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["project-match", projectId],
    queryFn: () =>
      recommendationService.getProjectMatch(projectId).then((r) => r.data.data),
    enabled: !!user && user.role === "user" && !!projectId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  return {
    matchScore: data?.matchScore ?? null,
    matchLevel: data?.matchLevel ?? null,
  };
}
