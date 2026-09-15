import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  CURRENT_CITIZEN_NAME,
  CURRENT_CITIZEN_WARD,
  createJanSevaMockState,
  type Application,
  type ApplicationStatus,
  type CertificateRequest,
  type CertificateType,
  type IssueCategory,
  type IssueStatus,
  type JanSevaRole,
  type LocalIssue,
  type Member,
  type Scheme,
} from "./mockData";

interface JanSevaDemoState {
  role: JanSevaRole;
  setRole: (role: JanSevaRole) => void;
  citizenName: string;
  citizenWard: string;
  schemes: Scheme[];
  applications: Application[];
  members: Member[];
  issues: LocalIssue[];
  certificates: CertificateRequest[];
  applyToScheme: (schemeId: string) => void;
  reviewApplication: (appId: string, status: ApplicationStatus, remarks: string) => void;
  raiseIssue: (title: string, category: IssueCategory, description: string) => void;
  updateIssueStatus: (issueId: string, status: IssueStatus) => void;
  requestCertificate: (type: CertificateType) => void;
  issueCertificate: (certId: string) => void;
}

const JanSevaDemoCtx = createContext<JanSevaDemoState | null>(null);

export function JanSevaDemoProvider({ children, initialRole = "citizen" }: { children: ReactNode; initialRole?: JanSevaRole }) {
  const [role, setRole] = useState<JanSevaRole>(initialRole);
  const [seed] = useState(() => createJanSevaMockState());
  const [schemes] = useState<Scheme[]>(seed.schemes);
  const [applications, setApplications] = useState<Application[]>(seed.applications);
  const [members] = useState<Member[]>(seed.members);
  const [issues, setIssues] = useState<LocalIssue[]>(seed.issues);
  const [certificates, setCertificates] = useState<CertificateRequest[]>(seed.certificates);

  const applyToScheme = useCallback(
    (schemeId: string) => {
      const scheme = schemes.find((s) => s.id === schemeId);
      if (!scheme) return;
      const id = `APP-${Date.now()}`;
      setApplications((prev) => [
        { id, schemeId, schemeName: scheme.name, citizenName: CURRENT_CITIZEN_NAME, ward: CURRENT_CITIZEN_WARD, submittedAt: new Date().toISOString(), status: "pending" },
        ...prev,
      ]);
    },
    [schemes],
  );

  const reviewApplication = useCallback((appId: string, status: ApplicationStatus, remarks: string) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status, remarks: remarks || a.remarks, reviewedBy: "Staff - K. Ramana" } : a)));
  }, []);

  const raiseIssue = useCallback((title: string, category: IssueCategory, description: string) => {
    const id = `ISS-${Date.now()}`;
    setIssues((prev) => [
      { id, title, category, description, raisedBy: CURRENT_CITIZEN_NAME, ward: CURRENT_CITIZEN_WARD, status: "open", raisedAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const updateIssueStatus = useCallback((issueId: string, status: IssueStatus) => {
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status, resolvedAt: status === "resolved" ? new Date().toISOString() : i.resolvedAt } : i)));
  }, []);

  const requestCertificate = useCallback((type: CertificateType) => {
    const id = `CERT-${Date.now()}`;
    setCertificates((prev) => [{ id, type, citizenName: CURRENT_CITIZEN_NAME, requestedAt: new Date().toISOString(), status: "pending" }, ...prev]);
  }, []);

  const issueCertificate = useCallback((certId: string) => {
    setCertificates((prev) =>
      prev.map((c) => (c.id === certId ? { ...c, status: "issued", certificateNo: `AP/EG/2026/${Math.floor(1000 + Math.random() * 8999)}`, issuedOn: new Date().toISOString() } : c)),
    );
  }, []);

  const value = useMemo<JanSevaDemoState>(
    () => ({
      role,
      setRole,
      citizenName: CURRENT_CITIZEN_NAME,
      citizenWard: CURRENT_CITIZEN_WARD,
      schemes,
      applications,
      members,
      issues,
      certificates,
      applyToScheme,
      reviewApplication,
      raiseIssue,
      updateIssueStatus,
      requestCertificate,
      issueCertificate,
    }),
    [role, schemes, applications, members, issues, certificates, applyToScheme, reviewApplication, raiseIssue, updateIssueStatus, requestCertificate, issueCertificate],
  );

  return <JanSevaDemoCtx.Provider value={value}>{children}</JanSevaDemoCtx.Provider>;
}

export function useJanSevaDemo(): JanSevaDemoState {
  const ctx = useContext(JanSevaDemoCtx);
  if (!ctx) throw new Error("useJanSevaDemo must be used inside JanSevaDemoProvider");
  return ctx;
}
