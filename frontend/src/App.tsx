import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { NotFound } from "@/components/sections/NotFound";
import Home from "@/pages/Home";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { PortfolioChangeListener } from "@/hooks/usePortfolio";
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

/**
 * Restores the two scroll behaviours a client-side router takes away.
 *
 * react-router intercepts a `<Link>` click, so the browser performs neither
 * its native fragment scroll nor its reset to the top of a new document:
 * `/#work` only rewrote the address bar, and opening a project from halfway
 * down the home page landed the visitor mid-article. A hash target can belong
 * to a route that has not committed yet, so a miss is retried for a few frames
 * rather than given up on.
 */
function ScrollManager() {
  const { hash, key } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (!hash) {
      // Back and forward keep the browser's own scroll restoration, so
      // returning from a project page puts the visitor back where they were.
      if (navigationType === "POP") return;
      // `instant` overrides the global `scroll-behavior: smooth`, which would
      // otherwise animate the old page away on every navigation.
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    let attempts = 0;
    let frame = 0;
    const scrollToTarget = () => {
      const target = document.getElementById(id);
      if (target) {
        // No explicit `behavior`, so the CSS decides - which is what keeps
        // this honest under `prefers-reduced-motion`.
        target.scrollIntoView({ block: "start" });
      } else if (attempts++ < 20) {
        frame = requestAnimationFrame(scrollToTarget);
      }
    };
    frame = requestAnimationFrame(scrollToTarget);
    return () => cancelAnimationFrame(frame);
  }, [hash, key, navigationType]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PerformancePreferences />
        {/* Mounted above the router so an admin save is applied to this tab
            even while the owner is still inside /admin. */}
        <PortfolioChangeListener />
        <BrowserRouter>
          <ScrollManager />
          {/* SiteLayout carries its own boundary around the routed page, so
              this one only covers the lazy chunks outside it. */}
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/projects/:slug" element={<ProjectDetail />} />
                {/* Vercel rewrites every unknown path to index.html, so a
                    mistyped URL reaches the router instead of the host's own
                    404. Declaring it inside the layout route means it still
                    arrives with the navbar and footer. */}
                <Route path="*" element={<NotFound />} />
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
                {/* An unknown admin path would otherwise render the shell with
                    an empty content area. Send the owner to the overview. */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
