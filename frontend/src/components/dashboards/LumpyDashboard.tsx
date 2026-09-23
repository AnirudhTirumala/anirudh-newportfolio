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
  // The tab the previous role was on is not necessarily on the new role's
  // sidebar, so the header, the nav highlight and the body all read from one
  // sanitised value. Reading the raw tab in some places and a sanitised one in
  // others used to leave an admin stranded inside a farmer/vet chat that has
  // no entry in the admin sidebar, under a header disagreeing with both.
  const safeTab = LUMPY_TABS[role].some((t) => t.key === tab) ? tab : "dashboard";
  const meta = TAB_META[safeTab] ?? { title: "Overview", subtitle: "" };

  function renderTab() {
    // Keyed by role so a switch while the chat is open starts the conversation
    // over as the new persona instead of keeping the previous role's thread.
    if (safeTab === "chat") return <LumpyChat key={role} persona={role === "farmer" ? "vet" : "farmer"} />;
    if (safeTab === "notifications") return <LumpyNotifications />;
    // Keyed by role so the form reloads the profile of whoever is being
    // previewed rather than keeping the values it mounted with.
    if (safeTab === "settings") return <LumpySettings key={role} role={role} />;
    const View = viewsByRole[safeTab];
    if (View) return <View />;
    const Fallback = viewsByRole["dashboard"];
    return <Fallback />;
  }

  return (
    <LumpyShell
      activeTab={safeTab}
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
