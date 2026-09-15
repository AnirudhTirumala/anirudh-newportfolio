import { Link } from "react-router-dom";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useLumpyStats } from "@/hooks/useLumpyDashboard";
import { useServiceRequests } from "@/hooks/useJanSevaDashboard";

export default function AdminOverview() {
  const { data } = usePortfolio();
  const { data: lumpyStats } = useLumpyStats();
  const { data: requests } = useServiceRequests();

  const cards = [
    { label: "Projects", value: data?.projects.length ?? "—", to: "/admin/projects" },
    { label: "Experience entries", value: data?.experiences.length ?? "—", to: "/admin/experience" },
    { label: "Skill categories", value: data?.skill_categories.length ?? "—", to: "/admin/skills" },
    { label: "Education entries", value: data?.education.length ?? "—", to: "/admin/credentials" },
    { label: "Certificates", value: data?.certificates.length ?? "—", to: "/admin/credentials" },
    { label: "Lumpy scans logged", value: lumpyStats?.total_scans ?? "—", to: "/" },
    { label: "JanSeva requests", value: requests?.length ?? "—", to: "/" },
  ];

  return (
    <div>
      <p className="font-display text-sm text-scope">Overview</p>
      <h1 className="mt-2 font-display text-3xl text-bone">Welcome back</h1>
      <p className="mt-2 max-w-xl text-sm text-bone-dim">
        Everything here edits the live site directly — changes show up as soon as you save.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className="border border-ink-700 p-5 transition-colors hover:border-scope/60">
            <p className="font-display text-2xl text-bone">{card.value}</p>
            <p className="mt-1 text-xs text-bone-faint">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
