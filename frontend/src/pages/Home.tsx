import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { Credentials } from "@/components/sections/Credentials";
import { PageSpinner } from "@/components/ui/Feedback";
import { usePortfolio } from "@/hooks/usePortfolio";

export default function Home() {
  const { data, isLoading, isError } = usePortfolio();

  if (isLoading) return <PageSpinner />;

  if (isError || !data) {
    // With `usePortfolio` falling back to bundled content on any API error,
    // this should be unreachable in practice - kept only as a last resort.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-xl text-bone">Something went wrong loading this page.</p>
        <p className="max-w-sm text-sm text-bone-dim">Try refreshing - if it keeps happening, that's on me, not you.</p>
      </div>
    );
  }

  return (
    <>
      <Hero profile={data.profile} />
      <About profile={data.profile} />
      <Experience experiences={data.experiences} />
      <Projects projects={data.projects} />
      <Skills categories={data.skill_categories} projects={data.projects} />
      <Credentials education={data.education} certificates={data.certificates} languages={data.languages} />
    </>
  );
}
