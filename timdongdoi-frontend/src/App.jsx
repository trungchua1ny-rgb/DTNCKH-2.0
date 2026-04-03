import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, RoleRoute } from "./components/layout/ProtectedRoute";
import { Toaster } from "react-hot-toast";

// Pages - Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Pages - Public
import HomePage from "./pages/HomePage";
import JobListPage from "./pages/jobs/JobListPage";
import JobDetailPage from "./pages/jobs/JobDetailPage";
import JobSearchPage from "./pages/jobs/JobSearchPage";
import CompanySearchPage from "./pages/company/CompanySearchPage";
import PublicCompanyPage from "./pages/company/PublicCompanyPage";
import ProjectListPage from "./pages/projects/ProjectListPage";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import PublicProfilePage from "./pages/profile/PublicProfilePage";

// Pages - User
import ProfilePage from "./pages/profile/ProfilePage";
import MyApplicationsPage from "./pages/jobs/MyApplicationsPage";
import ApplicationDetailPage from "./pages/jobs/ApplicationDetailPage";
import SavedJobsPage from "./pages/jobs/SavedJobsPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import MessagesPage from "./pages/messages/MessagesPage";
import MyReportsPage from "./pages/reports/MyReportsPage";
import RecommendationsPage from "./pages/recommendations/RecommendationsPage";
import MyInterviewsPage from "./pages/interviews/MyInterviewsPage";
import TakeTestPage from "./pages/tests/TakeTestPage";
import TestResultPage from "./pages/tests/TestResultPage";

// Pages - Projects
import MyProjectApplicationsPage from "./pages/projects/MyProjectApplicationsPage";
import CreateProjectPage from "./pages/projects/CreateProjectPage";
import EditProjectPage from "./pages/projects/EditProjectPage";
import ManageProjectPage from "./pages/projects/ManageProjectPage";

// Pages - Company
import CompanyProfilePage from "./pages/company/CompanyProfilePage";
import ManageJobsPage from "./pages/company/ManageJobsPage";
import PostJobPage from "./pages/company/PostJobPage";
import ManageApplicationsPage from "./pages/company/ManageApplicationsPage";
import ManageTestsPage from "./pages/company/ManageTestsPage";
import CreateEditTestPage from "./pages/company/CreateEditTestPage";
import ManageInterviewsPage from "./pages/company/ManageInterviewsPage";
import CompanyApplicationTestsPage from "./pages/company/CompanyApplicationTestsPage";

// Pages - Admin
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminCompaniesPage from "./pages/admin/AdminCompaniesPage";
import AdminJobsPage from "./pages/admin/AdminJobsPage";
import AdminProjectsPage from "./pages/admin/AdminProjectsPage"; // ← thêm
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage"; // ← thêm
import AdminLogsPage from "./pages/admin/AdminlogsPage";
import AdminSkillsPage from "./pages/admin/AdminSkillsPage";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30 * 1000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" />
        <BrowserRouter>
          <Routes>
            {/* ── PUBLIC ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/jobs" element={<JobListPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/job-search" element={<JobSearchPage />} />
            <Route path="/companies" element={<CompanySearchPage />} />
            <Route path="/companies/:id" element={<PublicCompanyPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/profile/:id" element={<PublicProfilePage />} />

            {/* ── USER ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-applications" element={<MyApplicationsPage />} />
              <Route
                path="/my-applications/:id"
                element={<ApplicationDetailPage />}
              />
              <Route
                path="/my-applications/:applicationId/tests"
                element={<TestResultPage />}
              />
              <Route path="/saved-jobs" element={<SavedJobsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:userId" element={<MessagesPage />} />
              <Route path="/my-reports" element={<MyReportsPage />} />
              <Route
                path="/recommendations"
                element={<RecommendationsPage />}
              />
              <Route path="/my-interviews" element={<MyInterviewsPage />} />
              <Route
                path="/tests/:applicationTestId/take"
                element={<TakeTestPage />}
              />
              <Route
                path="/projects/:id/manage"
                element={<ManageProjectPage />}
              />
              <Route path="/projects/create" element={<CreateProjectPage />} />
              <Route path="/projects/:id/edit" element={<EditProjectPage />} />
              <Route
                path="/my-project-applications"
                element={<MyProjectApplicationsPage />}
              />
            </Route>

            {/* ── COMPANY ── */}
            <Route element={<RoleRoute roles={["company"]} />}>
              <Route path="/company/profile" element={<CompanyProfilePage />} />
              <Route path="/company/jobs" element={<ManageJobsPage />} />
              <Route path="/company/jobs/new" element={<PostJobPage />} />
              <Route path="/company/jobs/:id/edit" element={<PostJobPage />} />
              <Route
                path="/company/applications"
                element={<ManageApplicationsPage />}
              />
              <Route
                path="/company/jobs/:jobId/applications"
                element={<ManageApplicationsPage />}
              />
              <Route
                path="/company/applications/:applicationId/tests"
                element={<CompanyApplicationTestsPage />}
              />
              <Route path="/company/tests" element={<ManageTestsPage />} />
              <Route
                path="/company/tests/new"
                element={<CreateEditTestPage />}
              />
              <Route
                path="/company/tests/:id/edit"
                element={<CreateEditTestPage />}
              />
              <Route
                path="/company/interviews"
                element={<ManageInterviewsPage />}
              />
            </Route>

            {/* ── ADMIN ── */}
            <Route element={<RoleRoute roles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/companies" element={<AdminCompaniesPage />} />
              <Route path="/admin/jobs" element={<AdminJobsPage />} />
              <Route path="/admin/skills" element={<AdminSkillsPage />} />
              <Route
                path="/admin/projects"
                element={<AdminProjectsPage />}
              />{" "}
              {/* ← thêm */}
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route
                path="/admin/reviews"
                element={<AdminReviewsPage />}
              />{" "}
              {/* ← thêm */}
              <Route path="/admin/logs" element={<AdminLogsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
