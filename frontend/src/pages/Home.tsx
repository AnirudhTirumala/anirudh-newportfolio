import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Projects, featuredProjects } from "@/components/sections/Projects";
import { Credentials } from "@/components/sections/Credentials";
import { usePortfolio } from "@/hooks/usePortfolio";

export default function Home() {
  // `usePortfolio` always resolves to renderable content: live data when the
  // API answers, the bundled portfolio otherwise. There is deliberately no
  // error screen here - an unreachable backend is a supported state for this
  // site, not a failure the visitor should be shown.
  const { data } = usePortfolio();

  return (
    <>
      <Hero profile={data.profile} hasProjects={featuredProjects(data.projects).length > 0} />
      <About profile={data.profile} />
      <Experience experiences={data.experiences} />
      <Projects projects={data.projects} />
      <Skills categories={data.skill_categories} projects={data.projects} />
      <Credentials education={data.education} certificates={data.certificates} languages={data.languages} />
    </>
  );
}
