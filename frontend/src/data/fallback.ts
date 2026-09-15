import type { Certificate, Education, Experience, Language, Portfolio, Project, SkillCategory } from "@/types";

/**
 * Static mirror of `backend/app/seed_data.py`.
 *
 * The site is designed to be deployed as a standalone static frontend as
 * well as alongside its FastAPI backend. When the API is unreachable (no
 * backend deployed, or it's asleep on a free-tier host) the data hooks in
 * `hooks/usePortfolio.ts` fall back to this content instead of showing an
 * error page. When the real API responds, its data is used and this file
 * is never touched. Keep this in sync with `seed_data.py` by hand - there's
 * no build step that generates one from the other.
 */

export const FALLBACK_PROFILE: Portfolio["profile"] = {
  name: "Anirudh Tirumala",
  title: "AI Engineer",
  tagline: "I build systems that see, understand, and respond.",
  bio: "I'm Anirudh Tirumala, an AI engineer based in Kakinada, India. I build applied machine learning systems end to end - from a YOLO model that spots disease in cattle before it spreads, to an LLM-powered assistant that helps citizens navigate local government in their own language. I work comfortably across the stack: PyTorch and OpenCV on one side, FastAPI and React on the other, with a fair amount of RAG and agentic tooling in between.",
  email: "anirudhtirumala@gmail.com",
  phone: "+91 6309279111",
  location: "Kakinada, India",
  github_url: "https://github.com/AnirudhTirumala",
  linkedin_url: "https://linkedin.com/in/anirudhtirumala",
  resume_url: "",
  updated_at: new Date().toISOString(),
};

const JANSEVA = "JanSeva Connect";
const LUMPY = "Lumpy Skin Disease Detection AI";
const SPHERE_GLOBAL = "Sphere Global — AI Engineer Intern";
const BOTH = [JANSEVA, LUMPY];

// Each skill is [name, used_in] - kept in sync with seed_skills() in
// backend/app/seed_data.py by hand.
const SKILL_CATEGORY_SOURCE: [string, [string, string[]][]][] = [
  [
    "Programming",
    [
      ["Python", BOTH],
      ["C", ["Coursework"]],
      ["Java (Basic)", ["Coursework"]],
      ["SQL", BOTH],
    ],
  ],
  [
    "AI & Machine Learning",
    [
      ["Machine Learning", [LUMPY]],
      ["Deep Learning", [LUMPY]],
      ["Computer Vision", [LUMPY]],
      ["YOLO", [LUMPY, SPHERE_GLOBAL]],
      ["PyTorch", [LUMPY]],
      ["OpenCV", [LUMPY]],
      ["Data Preprocessing", [LUMPY]],
      ["EDA", [LUMPY]],
      ["Data Annotation", [LUMPY, SPHERE_GLOBAL]],
      ["Synthetic Data Generation", [SPHERE_GLOBAL]],
    ],
  ],
  [
    "Generative AI",
    [
      ["LLMs", [JANSEVA, SPHERE_GLOBAL]],
      ["Generative AI", [JANSEVA, SPHERE_GLOBAL]],
      ["RAG", [JANSEVA]],
      ["LangChain", [JANSEVA]],
      ["LangGraph", [JANSEVA]],
      ["Agentic AI", [JANSEVA]],
      ["Prompt Engineering", [JANSEVA]],
    ],
  ],
  [
    "Backend & APIs",
    [
      ["FastAPI", [JANSEVA]],
      ["Flask", [LUMPY]],
      ["REST API Development", BOTH],
      ["API Integration", [JANSEVA]],
    ],
  ],
  [
    "Frontend",
    [
      ["React", BOTH],
      ["Next.js", [LUMPY]],
      ["TypeScript", BOTH],
      ["JavaScript", [JANSEVA]],
      ["HTML", BOTH],
      ["CSS", BOTH],
      ["Tailwind CSS", BOTH],
    ],
  ],
  [
    "Databases",
    [
      ["PostgreSQL", [JANSEVA]],
      ["MySQL", ["Coursework"]],
    ],
  ],
  [
    "Tools",
    [
      ["Git", BOTH],
      ["GitHub", BOTH],
      ["Jupyter Notebook", [LUMPY]],
      ["VS Code", BOTH],
      ["Android SDK", ["Coursework"]],
    ],
  ],
  [
    "CS Fundamentals",
    [
      ["OOP", ["Coursework", ...BOTH]],
      ["Data Structures", ["Coursework"]],
      ["SDLC", BOTH],
      ["Debugging", BOTH],
      ["Agile Methodologies", ["Coursework"]],
    ],
  ],
];

export const FALLBACK_SKILL_CATEGORIES: SkillCategory[] = SKILL_CATEGORY_SOURCE.map(([name, skills], catIndex) => ({
  id: catIndex + 1,
  name,
  sort_order: catIndex,
  skills: skills.map(([skillName, used_in], skillIndex) => ({
    id: catIndex * 100 + skillIndex + 1,
    name: skillName,
    sort_order: skillIndex,
    used_in,
  })),
}));

export const FALLBACK_EXPERIENCES: Experience[] = [
  {
    id: 1,
    company: "Sphere Global",
    role: "AI Engineer Intern",
    location: "Hyderabad, India",
    start_date: "",
    end_date: "",
    current: true,
    description: "Annotating image datasets and generating synthetic damage data with LLMs and generative AI, then using YOLO to train detection models for visual-damage detection.",
    highlights: ["Image annotation", "Synthetic damage data with LLMs & GenAI", "YOLO detection-model training"],
    sort_order: 0,
  },
];

export const FALLBACK_PROJECTS: Project[] = [
  {
    id: 1,
    slug: "janseva-connect",
    title: JANSEVA,
    summary: "An AI-powered Gram Panchayat portal that connects citizens and local government through one web app.",
    description:
      "A full-stack Gram Panchayat management portal with secure, role-based access and digital citizen services. An AI assistant gives multilingual, context-aware answers so residents can navigate local government without needing to know how the bureaucracy behind it works. The backend exposes scalable REST APIs over PostgreSQL; the frontend is a responsive React and TypeScript dashboard for both citizens and Panchayat staff.",
    tech_stack: ["Python", "FastAPI", "PostgreSQL", "React", "TypeScript", "Tailwind CSS", "JavaScript", "Grok API"],
    github_url: "",
    live_url: "",
    dashboard_key: "janseva",
    cover_note: "Citizen services, connected",
    featured: true,
    sort_order: 0,
  },
  {
    id: 2,
    slug: "lumpy-skin-disease-detection",
    title: LUMPY,
    summary: "A YOLO-based computer vision app that flags Lumpy Skin Disease in cattle from a single photo.",
    description:
      "A full-stack AI application for detecting Lumpy Skin Disease (LSD) in cattle. A YOLO (Ultralytics) model trained for real-time disease detection runs behind an inference API, so a photo taken in the field can return a diagnosis in seconds - no vet visit required to get a first read. Farmers, veterinarians and platform admins each get a dashboard scoped to what they need: scan and track a herd, triage and confirm incoming cases, or watch outbreak trends across a region.",
    tech_stack: ["Python", "Flask", "YOLO (Ultralytics)", "PyTorch", "OpenCV", "React", "Next.js", "TypeScript", "Tailwind CSS", "SQL"],
    github_url: "",
    live_url: "",
    dashboard_key: "lumpy",
    cover_note: "Field diagnosis in seconds",
    featured: true,
    sort_order: 1,
  },
];

export const FALLBACK_EDUCATION: Education[] = [
  {
    id: 1,
    institution: "Koneru Lakshmaiah Education Foundation (KLEF)",
    degree: "B.Tech",
    field: "Computer Science Engineering",
    location: "Vijayawada, India",
    start_year: "2021",
    end_year: "2025",
    score: "CGPA 7.75",
    sort_order: 0,
  },
];

export const FALLBACK_CERTIFICATES: Certificate[] = [
  { id: 1, name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", issued_on: "", url: "", image_url: "", sort_order: 0 },
  { id: 2, name: "Salesforce Certified AI Associate", issuer: "Salesforce", issued_on: "", url: "", image_url: "", sort_order: 1 },
];

export const FALLBACK_LANGUAGES: Language[] = [
  { id: 1, name: "English", proficiency: "", sort_order: 0 },
  { id: 2, name: "Hindi", proficiency: "", sort_order: 1 },
  { id: 3, name: "Telugu", proficiency: "", sort_order: 2 },
];

export const FALLBACK_PORTFOLIO: Portfolio = {
  profile: FALLBACK_PROFILE,
  experiences: FALLBACK_EXPERIENCES,
  skill_categories: FALLBACK_SKILL_CATEGORIES,
  projects: FALLBACK_PROJECTS,
  education: FALLBACK_EDUCATION,
  certificates: FALLBACK_CERTIFICATES,
  languages: FALLBACK_LANGUAGES,
};

export function findFallbackProject(slug: string): Project | undefined {
  return FALLBACK_PROJECTS.find((p) => p.slug === slug);
}
