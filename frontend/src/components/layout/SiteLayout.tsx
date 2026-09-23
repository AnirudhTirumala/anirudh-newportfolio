import { lazy, Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { featuredProjects } from "@/components/sections/Projects";
import { CanvasErrorBoundary } from "@/components/three/CanvasErrorBoundary";
import { BendingGrid } from "@/components/ui/BendingGrid";
import { PageSpinner } from "@/components/ui/Feedback";
import { PortfolioCacheSync, usePortfolio } from "@/hooks/usePortfolio";

// The WebGL chunk is large and nothing above the fold needs it, so it is kept
// out of the first download entirely.
const SceneBackdrop = lazy(() =>
  import("@/components/three/SceneBackdrop").then((m) => ({ default: m.SceneBackdrop })),
);

export function SiteLayout() {
  const { data } = usePortfolio();

  return (
    // Deliberately not `bg-ink-950`: the 3D world is a fixed layer underneath
    // this tree, so an opaque background here would hide it completely. The
    // page colour comes from `body`, which the backdrop sits on top of, and
    // the content sits on top of the backdrop at `z-10`.
    <div className="relative min-h-screen">
      <PortfolioCacheSync />
      <CanvasErrorBoundary>
        <Suspense fallback={null}>
          <SceneBackdrop />
        </Suspense>
      </CanvasErrorBoundary>
      {/* One grid for the whole page, fixed to the viewport and offset by the
          scroll position. Drawing one per section meant seven canvases and
          nearly twelve megapixels of compositor layer for a graphic that is
          only ever a screenful at a time. */}
      <BendingGrid className="fixed inset-0 z-0" />

      <div className="relative z-10">
        <Navbar
          profile={data.profile}
          hasProjects={featuredProjects(data.projects).length > 0}
          hasExperience={data.experiences.length > 0}
        />
        <main>
          {/* The boundary belongs here, not around the whole router: with it
              above the layout, opening a lazily-loaded project page unmounted
              the navbar and footer too and left the visitor on a bare spinner
              with no navigation until the chunk arrived. */}
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer profile={data.profile} />
      </div>
    </div>
  );
}
