export type JanSevaRole = "citizen" | "staff" | "admin";

export interface Scheme {
  id: string;
  name: string;
  department: string;
  description: string;
  eligibility: string;
  benefit: string;
  applicants: number;
  active: boolean;
}

export type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected";

export interface Application {
  id: string;
  schemeId: string;
  schemeName: string;
  citizenName: string;
  ward: string;
  submittedAt: string;
  status: ApplicationStatus;
  remarks?: string;
  reviewedBy?: string;
}

export interface Member {
  id: string;
  name: string;
  ward: string;
  phone: string;
  category: "BPL" | "APL";
  familySize: number;
  aadhaarLinked: boolean;
  registeredOn: string;
}

export type IssueStatus = "open" | "in_progress" | "resolved";
export type IssueCategory = "Water Supply" | "Roads" | "Electricity" | "Sanitation" | "Streetlights";

export interface LocalIssue {
  id: string;
  title: string;
  category: IssueCategory;
  description: string;
  raisedBy: string;
  ward: string;
  status: IssueStatus;
  raisedAt: string;
  resolvedAt?: string;
}

export type CertificateType = "Income Certificate" | "Residence Certificate" | "Caste Certificate" | "Birth Certificate";
export type CertificateStatus = "pending" | "issued" | "rejected";

export interface CertificateRequest {
  id: string;
  type: CertificateType;
  citizenName: string;
  requestedAt: string;
  status: CertificateStatus;
  certificateNo?: string;
  issuedOn?: string;
}

export interface JsChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

/** The three conversations the demo keeps: the citizen's view of the office
 * thread, the office's view of the citizen thread, and the AI assistant. */
export type JsChatPersona = "citizen" | "office" | "assistant";

const WARDS = ["Ward 3 - Peddapuram", "Ward 7 - Samalkot", "Ward 2 - Tuni", "Ward 5 - Prathipadu", "Ward 1 - Jaggampeta"];
const CITIZEN_NAMES = ["Ramesh Yadav", "Sunitha Devi", "Naveen Kumar", "Lakshmi Prasanna", "Chandra Sekhar", "Aruna Kumari", "Bhaskar Rao", "Divya Sri"];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export const SCHEMES: Scheme[] = [
  {
    id: "SCH-1",
    name: "YSR Pension Kanuka",
    department: "Social Welfare",
    description: "Monthly pension support for elderly, widowed, and differently-abled residents.",
    eligibility: "Age 60+, or widow, or disability certificate holder",
    benefit: "₹3,000 / month",
    applicants: 214,
    active: true,
  },
  {
    id: "SCH-2",
    name: "Jagananna Vidya Kanuka",
    department: "Education",
    description: "School kit assistance (books, uniforms, shoes) for government school students.",
    eligibility: "Enrolled in a government school, class 1-10",
    benefit: "Kit worth ₹1,200",
    applicants: 486,
    active: true,
  },
  {
    id: "SCH-3",
    name: "YSR Sunna Vaddi",
    department: "Rural Development",
    description: "Zero-interest loans for women's self-help groups.",
    eligibility: "Member of a registered SHG",
    benefit: "Interest waiver on loans up to ₹3,00,000",
    applicants: 92,
    active: true,
  },
  {
    id: "SCH-4",
    name: "Rythu Bharosa",
    department: "Agriculture",
    description: "Direct income support for farming families ahead of the cropping season.",
    eligibility: "Landholding farmer family",
    benefit: "₹13,500 / year",
    applicants: 331,
    active: true,
  },
  {
    id: "SCH-5",
    name: "House Site Pattas",
    department: "Housing",
    description: "Free house-site title deeds for landless poor families.",
    eligibility: "Landless, income below ₹1,50,000/year",
    benefit: "House site title deed",
    applicants: 58,
    active: false,
  },
];

function buildApplications(): Application[] {
  const statuses: ApplicationStatus[] = ["pending", "under_review", "approved", "rejected"];
  const apps: Application[] = [];
  CITIZEN_NAMES.forEach((name, i) => {
    const scheme = pick(SCHEMES, i);
    apps.push({
      id: `APP-${5000 + i}`,
      schemeId: scheme.id,
      schemeName: scheme.name,
      citizenName: name,
      ward: pick(WARDS, i),
      submittedAt: daysAgo(2 + i * 3),
      status: i < 2 ? statuses[i] : pick(statuses, i),
      remarks: i >= 4 ? "Documents verified against ration card records." : undefined,
      reviewedBy: i >= 4 ? "Staff - K. Ramana" : undefined,
    });
  });
  return apps;
}

function buildMembers(): Member[] {
  return CITIZEN_NAMES.map((name, i) => ({
    id: `MEM-${i}`,
    name,
    ward: pick(WARDS, i),
    phone: `9${(700000000 + i * 137).toString().slice(0, 9)}`,
    category: i % 3 === 0 ? "APL" : "BPL",
    familySize: 2 + (i % 4),
    aadhaarLinked: i !== 3,
    registeredOn: daysAgo(200 + i * 20),
  }));
}

function buildIssues(): LocalIssue[] {
  const categories: IssueCategory[] = ["Water Supply", "Roads", "Electricity", "Sanitation", "Streetlights"];
  const titles = [
    "Overflowing drainage near main road",
    "Streetlight not working for 2 weeks",
    "Irregular water supply timing",
    "Pothole causing accidents",
    "Garbage not collected on schedule",
  ];
  const statuses: IssueStatus[] = ["open", "in_progress", "resolved"];
  return titles.map((title, i) => ({
    id: `ISS-${300 + i}`,
    title,
    category: pick(categories, i),
    description: "Reported by a resident through the citizen portal, awaiting field verification by ward staff.",
    raisedBy: pick(CITIZEN_NAMES, i + 2),
    ward: pick(WARDS, i),
    status: i < 2 ? "open" : statuses[i % statuses.length],
    raisedAt: daysAgo(1 + i * 4),
    resolvedAt: i >= 3 ? daysAgo(i) : undefined,
  }));
}

function buildCertificates(): CertificateRequest[] {
  const types: CertificateType[] = ["Income Certificate", "Residence Certificate", "Caste Certificate", "Birth Certificate"];
  return CITIZEN_NAMES.slice(0, 5).map((name, i) => ({
    id: `CERT-${700 + i}`,
    type: pick(types, i),
    citizenName: name,
    requestedAt: daysAgo(3 + i * 5),
    status: i < 2 ? "pending" : "issued",
    certificateNo: i >= 2 ? `AP/EG/${2026}/${1000 + i}` : undefined,
    issuedOn: i >= 2 ? daysAgo(i) : undefined,
  }));
}

export function createJanSevaMockState() {
  return {
    schemes: SCHEMES,
    applications: buildApplications(),
    members: buildMembers(),
    issues: buildIssues(),
    certificates: buildCertificates(),
  };
}

export const CURRENT_CITIZEN_NAME = "Ramesh Yadav";
export const CURRENT_CITIZEN_WARD = WARDS[0];

export function seedChatThreads(): Record<JsChatPersona, JsChatMessage[]> {
  const time = new Date().toISOString();
  return {
    citizen: [{ id: "c0", from: "them", text: "Namaste! How can we help you today?", time }],
    office: [{ id: "o0", from: "them", text: "Hello, I had a question about my application.", time }],
    assistant: [
      {
        id: "a0",
        from: "them",
        text: "Hi, I'm the JanSeva assistant. Ask me about schemes, certificates, or how to report an issue - in English or Telugu.",
        time,
      },
    ],
  };
}

export const ASSISTANT_QA: { q: string; a: string }[] = [
  { q: "How do I apply for the pension scheme?", a: "Go to Browse Schemes, open \"YSR Pension Kanuka\", and tap Apply. You'll need your Aadhaar number and a recent photo - staff will verify eligibility within 7 working days." },
  { q: "How long does a certificate take?", a: "Most certificates (income, residence, caste) are issued within 5-7 working days after document verification. You can track status under My Certificates." },
  { q: "How do I report a broken streetlight?", a: "Use Raise an Issue, choose the \"Streetlights\" category, add the location, and submit. Ward staff are notified immediately." },
  { q: "Where is the Panchayat office and when is it open?", a: "The Gram Panchayat office is on Main Road, Peddapuram, and is open Monday to Saturday, 10 AM - 5 PM. You can also message the front office from the Chat tab." },
  { q: "నా దరఖాస్తు స్థితి ఏమిటి?", a: "మీ దరఖాస్తుల స్థితిని \"My Applications\" విభాగంలో చూడవచ్చు. ఆమోదం పొందిన వెంటనే మీకు నోటిఫికేషన్ వస్తుంది." },
];

/** Answers of last resort, one per script the assistant claims to speak, so a
 * Telugu question never bottoms out in an English-only dead end. */
export const ASSISTANT_FALLBACK = {
  en: "I can help with schemes, applications, certificates, and local issues - try asking about one of those, or use the quick questions below.",
  te: "నేను పథకాలు, దరఖాస్తులు, ధ్రువీకరణ పత్రాలు మరియు స్థానిక సమస్యల గురించి సహాయం చేయగలను - వీటిలో ఒకదాని గురించి అడగండి, లేదా కింది ప్రశ్నలను ఎంచుకోండి.",
};

export { WARDS, CITIZEN_NAMES };
