import { useState, type ComponentType } from "react";
import "./janseva/theme.css";
import { JanSevaDemoProvider, useJanSevaDemo } from "./janseva/DemoContext";
import { JanSevaShell, JS_TABS } from "./janseva/Shell";
import { BrowseSchemes, CitizenDashboard, CitizenIssues, MyApplications, MyCertificates } from "./janseva/CitizenViews";
import { ApplicationsQueue, CertificatesManage, IssuesManage, MembersDirectory, SchemesManage, StaffDashboard } from "./janseva/StaffAdminViews";
import { AIAssistant, JsChat } from "./janseva/Chat";

const TAB_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Your services at a glance" },
  schemes: { title: "Schemes", subtitle: "Government welfare schemes available through this Panchayat" },
  applications: { title: "Applications", subtitle: "Scheme applications and their status" },
  certificates: { title: "Certificates", subtitle: "Requests for income, residence, caste and birth certificates" },
  issues: { title: "Local Issues", subtitle: "Civic issues reported by residents" },
  members: { title: "Members", subtitle: "Registered households in this Panchayat" },
  chat: { title: "Chat", subtitle: "Direct messages between citizens and the office" },
  assistant: { title: "AI Assistant", subtitle: "Multilingual help for common questions" },
};

const CITIZEN_VIEWS: Record<string, ComponentType> = {
  dashboard: CitizenDashboard,
  schemes: BrowseSchemes,
  applications: MyApplications,
  certificates: MyCertificates,
  issues: CitizenIssues,
};
const OFFICE_VIEWS: Record<string, ComponentType> = {
  schemes: SchemesManage,
  applications: ApplicationsQueue,
  certificates: CertificatesManage,
  issues: IssuesManage,
  members: MembersDirectory,
};

function JanSevaContent() {
  const { role } = useJanSevaDemo();
  const [tab, setTab] = useState("dashboard");
  // Roles do not share a tab list - only the office roles have Members - so the
  // stored tab is clamped to one the current role actually has, and everything
  // on screen is derived from that single clamped value. Clamping only the
  // sidebar highlight used to leave the header naming a tab the role does not
  // have while the body rendered something else entirely.
  const activeTab = JS_TABS[role].some((t) => t.key === tab) ? tab : "dashboard";
  const meta = TAB_META[activeTab] ?? { title: "Dashboard", subtitle: "" };
  const views = role === "citizen" ? CITIZEN_VIEWS : OFFICE_VIEWS;

  function renderTab() {
    if (activeTab === "chat") return <JsChat persona={role === "citizen" ? "citizen" : "office"} />;
    if (activeTab === "assistant") return <AIAssistant />;
    if (activeTab === "dashboard") {
      return role === "citizen" ? <CitizenDashboard /> : <StaffDashboard role={role === "admin" ? "admin" : "staff"} />;
    }
    const View = views[activeTab];
    if (View) return <View />;
    return role === "citizen" ? <CitizenDashboard /> : <StaffDashboard role={role === "admin" ? "admin" : "staff"} />;
  }

  return (
    <JanSevaShell activeTab={activeTab} onTabChange={setTab} title={meta.title} subtitle={meta.subtitle}>
      {renderTab()}
    </JanSevaShell>
  );
}

/** Public entry point: a self-contained, fully client-side recreation of the
 * JanSeva Connect dashboards (citizen / staff / admin), built to work as a
 * live demo for portfolio visitors with no backend required. */
export function JanSevaDashboard() {
  return (
    <JanSevaDemoProvider initialRole="citizen">
      <JanSevaContent />
    </JanSevaDemoProvider>
  );
}
