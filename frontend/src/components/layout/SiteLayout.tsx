import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PortfolioCacheSync, usePortfolio } from "@/hooks/usePortfolio";

export function SiteLayout() {
  const { data } = usePortfolio();

  return (
    <div className="min-h-screen bg-ink-950">
      <PortfolioCacheSync />
      <Navbar profile={data?.profile} />
      <main>
        <Outlet />
      </main>
      <Footer profile={data?.profile} />
    </div>
  );
}
