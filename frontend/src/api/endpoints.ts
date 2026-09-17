import { apiClient } from "./client";
import type {
  CertificateInput,
  ChatReply,
  DetectionResult,
  Experience,
  ExperienceInput,
  Education,
  EducationInput,
  Certificate,
  Language,
  LanguageInput,
  LumpyStats,
  Portfolio,
  PortfolioRevision,
  Profile,
  ProfileUpdate,
  Project,
  ProjectInput,
  ServiceRequest,
  ServiceRequestInput,
  SkillCategory,
} from "@/types";

// --- Aggregate --------------------------------------------------------------
export const getPortfolio = () => apiClient.get<Portfolio>("/api/portfolio").then((r) => r.data);
export const getPortfolioRevision = () =>
  apiClient.get<PortfolioRevision>("/api/portfolio/revision", { headers: { "Cache-Control": "no-cache" } }).then((r) => r.data);

// --- Auth -------------------------------------------------------------------
export async function login(username: string, password: string): Promise<string> {
  const form = new URLSearchParams();
  form.set("username", username);
  form.set("password", password);
  const { data } = await apiClient.post<{ access_token: string }>("/api/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data.access_token;
}

export const getMe = () => apiClient.get<{ username: string }>("/api/auth/me").then((r) => r.data);

// --- Profile ----------------------------------------------------------------
export const getProfile = () => apiClient.get<Profile>("/api/profile").then((r) => r.data);
export const updateProfile = (payload: ProfileUpdate) =>
  apiClient.put<Profile>("/api/profile", payload).then((r) => r.data);

// --- Experience -------------------------------------------------------------
export const getExperiences = () => apiClient.get<Experience[]>("/api/experiences").then((r) => r.data);
export const createExperience = (payload: ExperienceInput) =>
  apiClient.post<Experience>("/api/experiences", payload).then((r) => r.data);
export const updateExperience = (id: number, payload: Partial<ExperienceInput>) =>
  apiClient.put<Experience>(`/api/experiences/${id}`, payload).then((r) => r.data);
export const deleteExperience = (id: number) => apiClient.delete(`/api/experiences/${id}`);

// --- Skills -------------------------------------------------------------------
export const getSkillCategories = () => apiClient.get<SkillCategory[]>("/api/skills").then((r) => r.data);

export const createSkillCategory = (name: string, sort_order = 0) =>
  apiClient.post("/api/skills/categories", { name, sort_order }).then((r) => r.data);

export const updateSkillCategory = (id: number, payload: { name?: string; sort_order?: number }) =>
  apiClient.put(`/api/skills/categories/${id}`, payload).then((r) => r.data);

export const deleteSkillCategory = (id: number) => apiClient.delete(`/api/skills/categories/${id}`);

export const createSkill = (name: string, category_id: number, sort_order = 0, used_in: string[] = []) =>
  apiClient.post("/api/skills", { name, category_id, sort_order, used_in }).then((r) => r.data);

export const updateSkill = (
  id: number,
  payload: { name?: string; category_id?: number; sort_order?: number; used_in?: string[] },
) => apiClient.put(`/api/skills/${id}`, payload).then((r) => r.data);

export const deleteSkill = (id: number) => apiClient.delete(`/api/skills/${id}`);

// --- Projects -----------------------------------------------------------------
export const getProjects = () => apiClient.get<Project[]>("/api/projects").then((r) => r.data);
export const getProject = (slug: string) => apiClient.get<Project>(`/api/projects/${slug}`).then((r) => r.data);
export const createProject = (payload: ProjectInput) =>
  apiClient.post<Project>("/api/projects", payload).then((r) => r.data);
export const updateProject = (id: number, payload: Partial<ProjectInput>) =>
  apiClient.put<Project>(`/api/projects/${id}`, payload).then((r) => r.data);
export const deleteProject = (id: number) => apiClient.delete(`/api/projects/${id}`);

// --- Education / Certificates / Languages --------------------------------
export const getEducation = () => apiClient.get<Education[]>("/api/education").then((r) => r.data);
export const createEducation = (payload: EducationInput) =>
  apiClient.post<Education>("/api/education", payload).then((r) => r.data);
export const updateEducation = (id: number, payload: Partial<EducationInput>) =>
  apiClient.put<Education>(`/api/education/${id}`, payload).then((r) => r.data);
export const deleteEducation = (id: number) => apiClient.delete(`/api/education/${id}`);

export const getCertificates = () => apiClient.get<Certificate[]>("/api/certificates").then((r) => r.data);
export const createCertificate = (payload: CertificateInput) =>
  apiClient.post<Certificate>("/api/certificates", payload).then((r) => r.data);
export const updateCertificate = (id: number, payload: Partial<CertificateInput>) =>
  apiClient.put<Certificate>(`/api/certificates/${id}`, payload).then((r) => r.data);
export const deleteCertificate = (id: number) => apiClient.delete(`/api/certificates/${id}`);

export async function uploadCertificateImage(id: number, file: File): Promise<Certificate> {
  const form = new FormData();
  form.append("file", file);
  // No manual Content-Type here either, for the same reason as detectLumpy
  // below - the browser needs to set its own multipart boundary.
  const { data } = await apiClient.post<Certificate>(`/api/certificates/${id}/image`, form);
  return data;
}

export const deleteCertificateImage = (id: number) =>
  apiClient.delete<Certificate>(`/api/certificates/${id}/image`).then((r) => r.data);

export const getLanguages = () => apiClient.get<Language[]>("/api/languages").then((r) => r.data);
export const createLanguage = (payload: LanguageInput) =>
  apiClient.post<Language>("/api/languages", payload).then((r) => r.data);
export const updateLanguage = (id: number, payload: Partial<LanguageInput>) =>
  apiClient.put<Language>(`/api/languages/${id}`, payload).then((r) => r.data);
export const deleteLanguage = (id: number) => apiClient.delete(`/api/languages/${id}`);

// --- Lumpy Skin Disease dashboard -------------------------------------------
export async function detectLumpy(file: File): Promise<DetectionResult> {
  const form = new FormData();
  form.append("file", file);
  // Deliberately no Content-Type header here - the browser must generate the
  // multipart boundary itself. Setting it manually breaks the upload because
  // the server can't find the boundary it needs to split the body into parts.
  const { data } = await apiClient.post<DetectionResult>("/api/lumpy/detect", form);
  return data;
}

export const getLumpyStats = () => apiClient.get<LumpyStats>("/api/lumpy/stats").then((r) => r.data);

// --- JanSeva Connect dashboard ----------------------------------------------
export const getServiceRequests = () => apiClient.get<ServiceRequest[]>("/api/janseva/requests").then((r) => r.data);
export const createServiceRequest = (payload: ServiceRequestInput) =>
  apiClient.post<ServiceRequest>("/api/janseva/requests", payload).then((r) => r.data);
export const updateServiceRequestStatus = (id: number, status: string) =>
  apiClient.put<ServiceRequest>(`/api/janseva/requests/${id}/status`, { status }).then((r) => r.data);

export const sendJanSevaChat = (message: string, language = "auto") =>
  apiClient.post<ChatReply>("/api/janseva/chat", { message, language }).then((r) => r.data);
