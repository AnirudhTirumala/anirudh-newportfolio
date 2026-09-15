import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Home from "@/pages/Home";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PageSpinner } from "@/components/ui/Feedback";

// Public visitors do not need the admin forms or project-demo runtime in
// their first download. Load each route only when it is actually visited.
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
const Login = lazy(() => import("@/pages/Login"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminOverview = lazy(() => import("@/pages/admin/AdminOverview"));
const ProfileEditor = lazy(() => import("@/pages/admin/ProfileEditor"));
const ExperienceEditor = lazy(() => import("@/pages/admin/ExperienceEditor"));
const ProjectsEditor = lazy(() => import("@/pages/admin/ProjectsEditor"));
const SkillsEditor = lazy(() => import("@/pages/admin/SkillsEditor"));
const CredentialsEditor = lazy(() => import("@/pages/admin/CredentialsEditor"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PerformancePreferences() {
  const reduced = useReducedMotion();

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [reduced]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PerformancePreferences />
        <BrowserRouter>
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/projects/:slug" element={<ProjectDetail />} />
              </Route>

              <Route path="/login" element={<Login />} />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="profile" element={<ProfileEditor />} />
                <Route path="experience" element={<ExperienceEditor />} />
                <Route path="projects" element={<ProjectsEditor />} />
                <Route path="skills" element={<SkillsEditor />} />
                <Route path="credentials" element={<CredentialsEditor />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
