import { useState, type ComponentType } from "react";
import "./lumpy/theme.css";
import { LumpyDemoProvider, useLumpyDemo } from "./lumpy/DemoContext";
import { LumpyShell, LUMPY_TABS } from "./lumpy/Shell";
import { FarmerOverview, MyCattle, ScanHistory, Reports } from "./lumpy/FarmerViews";
import { CaseQueue, DoctorOverview, DoctorScanTab, LumpyAnalytics, PatientRecords } from "./lumpy/DoctorViews";
import { AdminOverview, ModelRegistry, UserManagement } from "./lumpy/AdminViews";
import { LumpyChat } from "./lumpy/Chat";
import { OutbreakMap } from "./lumpy/OutbreakMap";
import { LumpyNotifications, LumpySettings } from "./lumpy/SettingsNotifications";

const TAB_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Overview", subtitle: "Your herd and recent activity" },
  "my-cattle": { title: "My Cattle", subtitle: "Every animal registered under your account" },
  "scan-history": { title: "Scan History", subtitle: "Every AI scan you've run, with outcomes" },
  reports: { title: "Reports", subtitle: "Printable field reports for confirmed cases" },
  "case-queue": { title: "Case Queue", subtitle: "Scans waiting on a veterinary review" },
  scan: { title: "AI Scan", subtitle: "Run the detection model against a field photo" },
  patients: { title: "Patient Records", subtitle: "Farmers and herds under your care" },
  analytics: { title: "Analytics", subtitle: "Scan volume and outbreak trends" },
  users: { title: "Users", subtitle: "Farmers and veterinarians on the platform" },
  "model-registry": { title: "Model Registry", subtitle: "Detection model versions and rollout status" },
  chat: { title: "Messages", subtitle: "Direct line between farmer and vet" },
  "outbreak-map": { title: "Outbreak Map", subtitle: "Case density across East Godavari" },
  notifications: { title: "Notifications", subtitle: "Everything that needs your attention" },
  settings: { title: "Settings", subtitle: "Profile and alert preferences" },
};

const FARMER_VIEWS: Record<string, ComponentType> = {
  dashboard: FarmerOverview,
  "my-cattle": MyCattle,
  "scan-history": ScanHistory,
  reports: Reports,
  "outbreak-map": OutbreakMap,
};

const DOCTOR_VIEWS: Record<string, ComponentType> = {
  dashboard: DoctorOverview,
  "case-queue": CaseQueue,
  scan: DoctorScanTab,
  patients: PatientRecords,
  "outbreak-map": OutbreakMap,
  analytics: LumpyAnalytics,
};

const ADMIN_VIEWS: Record<string, ComponentType> = {
  dashboard: AdminOverview,
  users: UserManagement,
  scan: DoctorScanTab,
  analytics: LumpyAnalytics,
  "outbreak-map": OutbreakMap,
  "model-registry": ModelRegistry,
};

function LumpyContent() {
  const { role } = useLumpyDemo();
  const [tab, setTab] = useState("dashboard");
  const viewsByRole = { farmer: FARMER_VIEWS, doctor: DOCTOR_VIEWS, admin: ADMIN_VIEWS }[role];
  const meta = TAB_META[tab] ?? { title: "Overview", subtitle: "" };

  function renderTab() {
    if (tab === "chat") return <LumpyChat persona={role === "farmer" ? "vet" : "farmer"} />;
    if (tab === "notifications") return <LumpyNotifications />;
    if (tab === "settings") return <LumpySettings role={role} />;
    const View = viewsByRole[tab];
    if (View) return <View />;
    const Fallback = viewsByRole["dashboard"];
    return <Fallback />;
  }

  return (
    <LumpyShell
      activeTab={LUMPY_TABS[role].some((t) => t.key === tab) ? tab : "dashboard"}
      onTabChange={(key) => setTab(key)}
      title={meta.title}
      subtitle={meta.subtitle}
    >
      {renderTab()}
    </LumpyShell>
  );
}

/** Public entry point: a self-contained, fully client-side recreation of the
 * Lumpy Disease Detection AI dashboards (farmer / vet / admin), built to
 * work as a live demo for portfolio visitors with no backend required. */
export function LumpyDashboard() {
  return (
    <LumpyDemoProvider initialRole="farmer">
      <LumpyContent />
    </LumpyDemoProvider>
  );
}
