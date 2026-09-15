import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  createLumpyMockState,
  getNotificationsFor,
  makeBoxes,
  type CaseStatus,
  type CattleRecord,
  type LumpyRole,
  type ModelVersion,
  type NotificationItem,
  type PlatformUser,
  type ScanCase,
} from "./mockData";

const CURRENT_FARMER_ID = "FRM-0";
const CURRENT_FARMER_NAME = "Ravi Kumar";

interface LumpyDemoState {
  role: LumpyRole;
  setRole: (role: LumpyRole) => void;
  currentFarmerId: string;
  currentFarmerName: string;
  cattle: CattleRecord[];
  cases: ScanCase[];
  users: PlatformUser[];
  models: ModelVersion[];
  notifications: NotificationItem[];
  runScan: (cattleId: string, positiveBias?: boolean) => ScanCase;
  updateCaseStatus: (caseId: string, status: CaseStatus, doctorName?: string) => void;
  addCaseNote: (caseId: string, author: string, text: string) => void;
  setUserStatus: (userId: string, status: PlatformUser["status"]) => void;
  promoteModel: (modelId: string) => void;
  archiveModel: (modelId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const LumpyDemoCtx = createContext<LumpyDemoState | null>(null);

export function LumpyDemoProvider({ children, initialRole = "farmer" }: { children: ReactNode; initialRole?: LumpyRole }) {
  const [role, setRole] = useState<LumpyRole>(initialRole);
  const [seed] = useState(() => createLumpyMockState());
  const [cattle] = useState<CattleRecord[]>(seed.cattle);
  const [cases, setCases] = useState<ScanCase[]>(seed.cases);
  const [users, setUsers] = useState<PlatformUser[]>(seed.users);
  const [models, setModels] = useState<ModelVersion[]>(seed.models);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotificationsFor(initialRole));

  const handleSetRole = useCallback((next: LumpyRole) => {
    setRole(next);
    setNotifications(getNotificationsFor(next));
  }, []);

  const runScan = useCallback(
    (cattleId: string, positiveBias?: boolean): ScanCase => {
      const cow = cattle.find((c) => c.id === cattleId);
      const seedNum = Math.floor(Math.random() * 100000);
      const rand = mulberry(seedNum);
      const positive = positiveBias === undefined ? rand() > 0.55 : positiveBias ? rand() > 0.15 : rand() > 0.88;
      const newCase: ScanCase = {
        id: `SCAN-${seedNum}`,
        cattleId,
        cattleName: cow?.name ?? "Unregistered animal",
        farmerId: cow?.farmerId ?? CURRENT_FARMER_ID,
        farmerName: cow?.farmerName ?? CURRENT_FARMER_NAME,
        village: cow?.village ?? "Kakinada Rural",
        district: "East Godavari",
        capturedAt: new Date().toISOString(),
        verdict: positive ? "positive" : "negative",
        confidence: positive ? 0.66 + rand() * 0.32 : 0.7 + rand() * 0.28,
        severity: positive ? (rand() > 0.7 ? "severe" : rand() > 0.4 ? "moderate" : "mild") : undefined,
        status: positive ? "pending" : "closed",
        notes: [],
        boxes: makeBoxes(rand, positive),
        seed: seedNum,
      };
      setCases((prev) => [newCase, ...prev]);
      if (positive) {
        setNotifications((prev) => [
          {
            id: `n-${seedNum}`,
            title: "New scan needs review",
            body: `${newCase.farmerName}'s ${newCase.cattleName} flagged positive at ${(newCase.confidence * 100).toFixed(0)}% confidence.`,
            time: new Date().toISOString(),
            read: false,
            tone: "warn",
          },
          ...prev,
        ]);
      }
      return newCase;
    },
    [cattle],
  );

  const updateCaseStatus = useCallback((caseId: string, status: CaseStatus, doctorName?: string) => {
    setCases((prev) => prev.map((c) => (c.id === caseId ? { ...c, status, assignedDoctorName: doctorName ?? c.assignedDoctorName } : c)));
  }, []);

  const addCaseNote = useCallback((caseId: string, author: string, text: string) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, notes: [...c.notes, { author, text, at: new Date().toISOString() }] } : c)),
    );
  }, []);

  const setUserStatus = useCallback((userId: string, status: PlatformUser["status"]) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
  }, []);

  const promoteModel = useCallback((modelId: string) => {
    setModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, status: "production" } : m.status === "production" ? { ...m, status: "archived" } : m)));
  }, []);

  const archiveModel = useCallback((modelId: string) => {
    setModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, status: "archived" } : m)));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const value = useMemo<LumpyDemoState>(
    () => ({
      role,
      setRole: handleSetRole,
      currentFarmerId: CURRENT_FARMER_ID,
      currentFarmerName: CURRENT_FARMER_NAME,
      cattle,
      cases,
      users,
      models,
      notifications,
      runScan,
      updateCaseStatus,
      addCaseNote,
      setUserStatus,
      promoteModel,
      archiveModel,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [role, handleSetRole, cattle, cases, users, models, notifications, runScan, updateCaseStatus, addCaseNote, setUserStatus, promoteModel, archiveModel, markNotificationRead, markAllNotificationsRead],
  );

  return <LumpyDemoCtx.Provider value={value}>{children}</LumpyDemoCtx.Provider>;
}

export function useLumpyDemo(): LumpyDemoState {
  const ctx = useContext(LumpyDemoCtx);
  if (!ctx) throw new Error("useLumpyDemo must be used inside LumpyDemoProvider");
  return ctx;
}

function mulberry(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
