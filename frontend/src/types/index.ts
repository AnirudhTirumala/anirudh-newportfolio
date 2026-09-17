export interface Profile {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  github_url: string;
  linkedin_url: string;
  resume_url: string;
  updated_at: string;
}

export type ProfileUpdate = Omit<Profile, "updated_at">;

export interface Experience {
  id: number;
  company: string;
  role: string;
  location: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
  highlights: string[];
  sort_order: number;
}

export type ExperienceInput = Omit<Experience, "id">;

export interface Skill {
  id: number;
  name: string;
  sort_order: number;
  used_in: string[];
}

export interface SkillCategory {
  id: number;
  name: string;
  sort_order: number;
  skills: Skill[];
}

export type DashboardKey = "lumpy" | "janseva" | "none";

export interface Project {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  tech_stack: string[];
  github_url: string;
  live_url: string;
  dashboard_key: DashboardKey;
  cover_note: string;
  featured: boolean;
  sort_order: number;
}

export type ProjectInput = Omit<Project, "id">;

export interface Education {
  id: number;
  institution: string;
  degree: string;
  field: string;
  location: string;
  start_year: string;
  end_year: string;
  score: string;
  sort_order: number;
}

export type EducationInput = Omit<Education, "id">;

export interface Certificate {
  id: number;
  name: string;
  issuer: string;
  issued_on: string;
  url: string;
  image_url: string;
  sort_order: number;
}

export type CertificateInput = Omit<Certificate, "id">;

export interface Language {
  id: number;
  name: string;
  proficiency: string;
  sort_order: number;
}

export type LanguageInput = Omit<Language, "id">;

export interface Portfolio {
  profile: Profile;
  experiences: Experience[];
  skill_categories: SkillCategory[];
  projects: Project[];
  education: Education[];
  certificates: Certificate[];
  languages: Language[];
}

/** A lightweight content marker used to refresh open public tabs on change. */
export interface PortfolioRevision {
  revision: string;
}

// --- Lumpy Skin Disease dashboard -----------------------------------------
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface DetectionResult {
  result: "positive" | "negative";
  confidence: number;
  boxes: BoundingBox[];
  is_demo: boolean;
  note: string;
}

export interface DetectionLogEntry {
  id: number;
  filename: string;
  result: "positive" | "negative";
  confidence: number;
  is_demo: boolean;
  created_at: string;
}

export interface LumpyStats {
  total_scans: number;
  positive_count: number;
  negative_count: number;
  positive_rate: number;
  model_loaded: boolean;
  recent: DetectionLogEntry[];
}

// --- JanSeva Connect dashboard ---------------------------------------------
export type RequestStatus = "submitted" | "in_review" | "resolved";

export interface ServiceRequest {
  id: number;
  reference_code: string;
  citizen_name: string;
  category: string;
  village: string;
  description: string;
  language: string;
  status: RequestStatus;
  created_at: string;
}

export interface ServiceRequestInput {
  citizen_name: string;
  category: string;
  village: string;
  description: string;
  language: string;
}

export interface ChatReply {
  reply: string;
  detected_language: string;
  is_demo: boolean;
}
