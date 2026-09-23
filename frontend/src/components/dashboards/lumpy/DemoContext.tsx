import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  createLumpyMockState,
  getSeedNotifications,
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

/** Owner used for a scan run from the clinical tool, where there is no
 * registered animal behind the photo. Filing those under the demo farmer
 * would put scans a vet ran for themselves into the farmer's own history. */
const UNASSIGNED_FARMER_ID = "UNASSIGNED";
const UNASSIGNED_FARMER_NAME = "Unassigned";

export interface DemoProfile {
  name: string;
  phone: string;
  alerts: boolean;
  smsAlerts: boolean;
}

export interface RunScanOptions {
  positiveBias?: boolean;
  /** Who the resulting case belongs to. Always passed explicitly so the tool
   * that ran the scan decides the owner, rather than the context guessing. */
  owner?: { farmerId: string; farmerName: string };
  /** Free-text identifier a vet typed for an animal that is not on file. */
  subjectLabel?: string;
}

export interface NewCattleInput {
  name: string;
  tag: string;
  breed: string;
  ageMonths: number;
}

const DEFAULT_PROFILES: Record<LumpyRole, DemoProfile> = {
  farmer: { name: CURRENT_FARMER_NAME, phone: "+91 90000 00000", alerts: true, smsAlerts: true },
  doctor: { name: "Dr. Kavitha Nair", phone: "+91 90000 00000", alerts: true, smsAlerts: false },
  admin: { name: "Platform Admin", phone: "+91 90000 00000", alerts: true, smsAlerts: false },
};

interface LumpyDemoState {
  role: LumpyRole;
  setRole: (role: LumpyRole) => void;
  currentFarmerId: string;
  currentFarmerName: string;
  profiles: Record<LumpyRole, DemoProfile>;
  updateProfile: (role: LumpyRole, patch: Partial<DemoProfile>) => void;
  cattle: CattleRecord[];
  cases: ScanCase[];
  users: PlatformUser[];
  models: ModelVersion[];
  notifications: NotificationItem[];
  addCattle: (input: NewCattleInput) => CattleRecord;
  runScan: (cattleId: string, options?: RunScanOptions) => ScanCase;
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
  const [profiles, setProfiles] = useState<Record<LumpyRole, DemoProfile>>(DEFAULT_PROFILES);
  const [cattle, setCattle] = useState<CattleRecord[]>(seed.cattle);
  const [cases, setCases] = useState<ScanCase[]>(seed.cases);
  const [users, setUsers] = useState<PlatformUser[]>(seed.users);
  const [models, setModels] = useState<ModelVersion[]>(seed.models);
  // Every role's notifications live in one store and are filtered on the way
  // out. Rebuilding the list on each role switch used to throw away what the
  // visitor had marked read and, worse, destroyed the alert a scan had just
  // raised - which is exactly the hand-off the demo is meant to show off.
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>(() => getSeedNotifications());

  const notifications = useMemo(() => allNotifications.filter((n) => n.audience.includes(role)), [allNotifications, role]);

  const currentFarmerName = profiles.farmer.name.trim() || CURRENT_FARMER_NAME;

  const updateProfile = useCallback((target: LumpyRole, patch: Partial<DemoProfile>) => {
    setProfiles((prev) => ({ ...prev, [target]: { ...prev[target], ...patch } }));
  }, []);

  const addCattle = useCallback(
    (input: NewCattleInput): CattleRecord => {
      const serial = Math.floor(Math.random() * 100000);
      const record: CattleRecord = {
        id: `CTL-${serial}`,
        tag: input.tag.trim() || `AP-EG-${serial}`,
        name: input.name.trim(),
        breed: input.breed,
        ageMonths: input.ageMonths,
        farmerId: CURRENT_FARMER_ID,
        farmerName: currentFarmerName,
        village: cattle.find((c) => c.farmerId === CURRENT_FARMER_ID)?.village ?? "Kakinada Rural",
        status: "healthy",
      };
      setCattle((prev) => [...prev, record]);
      return record;
    },
    [cattle, currentFarmerName],
  );

  const runScan = useCallback(
    (cattleId: string, options?: RunScanOptions): ScanCase => {
      const cow = cattle.find((c) => c.id === cattleId);
      const seedNum = Math.floor(Math.random() * 100000);
      const rand = mulberry(seedNum);
      const bias = options?.positiveBias;
      const positive = bias === undefined ? rand() > 0.55 : bias ? rand() > 0.15 : rand() > 0.88;
      const label = options?.subjectLabel?.trim() || undefined;
      const newCase: ScanCase = {
        id: `SCAN-${seedNum}`,
        cattleId,
        cattleName: cow?.name ?? label ?? "Unregistered animal",
        farmerId: cow?.farmerId ?? options?.owner?.farmerId ?? UNASSIGNED_FARMER_ID,
        farmerName: cow?.farmerName ?? options?.owner?.farmerName ?? UNASSIGNED_FARMER_NAME,
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
        // A scan that belongs to nobody on the platform is a vet's own test
        // run, so it goes to the reviewers only and never to the farmer.
        const audience: LumpyRole[] =
          newCase.farmerId === CURRENT_FARMER_ID ? ["farmer", "doctor", "admin"] : ["doctor", "admin"];
        setAllNotifications((prev) => [
          {
            id: `n-${seedNum}`,
            title: "New scan needs review",
            body: `${newCase.cattleName} (${newCase.farmerName}) flagged positive at ${(newCase.confidence * 100).toFixed(0)}% confidence.`,
            time: new Date().toISOString(),
            read: false,
            tone: "warn",
            audience,
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
    setAllNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setAllNotifications((prev) => prev.map((n) => (n.audience.includes(role) ? { ...n, read: true } : n)));
  }, [role]);

  const value = useMemo<LumpyDemoState>(
    () => ({
      role,
      setRole,
      currentFarmerId: CURRENT_FARMER_ID,
      currentFarmerName,
      profiles,
      updateProfile,
      cattle,
      cases,
      users,
      models,
      notifications,
      addCattle,
      runScan,
      updateCaseStatus,
      addCaseNote,
      setUserStatus,
      promoteModel,
      archiveModel,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [role, currentFarmerName, profiles, updateProfile, cattle, cases, users, models, notifications, addCattle, runScan, updateCaseStatus, addCaseNote, setUserStatus, promoteModel, archiveModel, markNotificationRead, markAllNotificationsRead],
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
