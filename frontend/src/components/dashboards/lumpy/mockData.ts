export type LumpyRole = "farmer" | "doctor" | "admin";

export interface DetectionBox {
  x: number; // percent, top-left
  y: number;
  w: number;
  h: number;
  confidence: number;
}

export interface CattleRecord {
  id: string;
  tag: string;
  name: string;
  breed: string;
  ageMonths: number;
  farmerId: string;
  farmerName: string;
  village: string;
  status: "healthy" | "monitoring" | "under_treatment";
  lastScanId?: string;
}

export type CaseStatus = "pending" | "in_review" | "confirmed" | "flagged" | "closed";
export type CaseSeverity = "mild" | "moderate" | "severe";

export interface ScanCase {
  id: string;
  cattleId: string;
  cattleName: string;
  farmerId: string;
  farmerName: string;
  village: string;
  district: string;
  capturedAt: string;
  verdict: "positive" | "negative";
  confidence: number;
  severity?: CaseSeverity;
  status: CaseStatus;
  assignedDoctorName?: string;
  notes: { author: string; text: string; at: string }[];
  boxes: DetectionBox[];
  seed: number;
}

export interface PlatformUser {
  id: string;
  name: string;
  role: "farmer" | "doctor";
  place: string;
  status: "pending" | "approved" | "suspended";
  joinedAt: string;
  meta: string;
}

export interface ModelVersion {
  id: string;
  version: string;
  map50: number;
  precision: number;
  recall: number;
  status: "production" | "staging" | "archived";
  datasetImages: number;
  trainedOn: string;
  notes: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  tone: "info" | "warn" | "bad" | "ok";
  /** Roles this item is addressed to. One store is kept for the whole demo and
   * filtered by the active role, so switching roles cannot discard what the
   * visitor has already read or an alert raised during the session. */
  audience: LumpyRole[];
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

const VILLAGES = ["Peddapuram", "Samalkot", "Pithapuram", "Tuni", "Prathipadu", "Kakinada Rural", "Jaggampeta", "Gollaprolu"];
const DISTRICT = "East Godavari";
const FARMER_NAMES = ["Ravi Kumar", "Lakshmi Devi", "Suresh Babu", "Anjali Rao", "Venkata Reddy", "Padma Priya", "Mohan Rao", "Sita Mahalakshmi", "Krishna Murthy", "Durga Prasad"];
const DOCTOR_NAMES = ["Dr. Kavitha Nair", "Dr. Arjun Mehta", "Dr. Priya Shetty"];
const CATTLE_NAMES = ["Ganga", "Lakshmi", "Nandini", "Kaveri", "Gauri", "Radha", "Bhavani", "Meenakshi", "Saraswati", "Parvati"];
const BREEDS = ["Ongole", "Gir", "Sahiwal", "Crossbred HF", "Local Deccani"];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seed) % arr.length];
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function makeBoxes(rand: () => number, positive: boolean): DetectionBox[] {
  if (!positive) return [];
  const count = rand() > 0.7 ? 2 : 1;
  const boxes: DetectionBox[] = [];
  for (let i = 0; i < count; i++) {
    const w = 12 + rand() * 18;
    const h = 12 + rand() * 18;
    boxes.push({
      x: 15 + rand() * (70 - w),
      y: 15 + rand() * (70 - h),
      w,
      h,
      confidence: 0.62 + rand() * 0.36,
    });
  }
  return boxes;
}

function buildCattle(): CattleRecord[] {
  const records: CattleRecord[] = [];
  for (let i = 0; i < 9; i++) {
    const rand = mulberry32(1000 + i);
    const farmerIdx = i % FARMER_NAMES.length;
    records.push({
      id: `CTL-${1000 + i}`,
      tag: `AP-EG-${4200 + i}`,
      name: pick(CATTLE_NAMES, i),
      breed: pick(BREEDS, i * 3),
      ageMonths: 14 + Math.floor(rand() * 60),
      farmerId: `FRM-${farmerIdx}`,
      farmerName: FARMER_NAMES[farmerIdx],
      village: pick(VILLAGES, i * 2),
      status: rand() > 0.82 ? "under_treatment" : rand() > 0.6 ? "monitoring" : "healthy",
    });
  }
  return records;
}

function buildCases(cattle: CattleRecord[]): ScanCase[] {
  const cases: ScanCase[] = [];
  const statuses: CaseStatus[] = ["pending", "in_review", "confirmed", "flagged", "closed"];
  cattle.forEach((cow, i) => {
    const casesForCow = i < 5 ? 1 : 0;
    for (let j = 0; j < Math.max(casesForCow, i % 3 === 0 ? 1 : 0); j++) {
      const seed = 5000 + i * 7 + j;
      const rand = mulberry32(seed);
      const positive = rand() > 0.35;
      const status = i < 3 ? statuses[i] : positive ? pick(statuses, seed) : "closed";
      cases.push({
        id: `SCAN-${seed}`,
        cattleId: cow.id,
        cattleName: cow.name,
        farmerId: cow.farmerId,
        farmerName: cow.farmerName,
        village: cow.village,
        district: DISTRICT,
        capturedAt: daysAgo(i + j),
        verdict: positive ? "positive" : "negative",
        confidence: positive ? 0.66 + rand() * 0.32 : 0.7 + rand() * 0.28,
        severity: positive ? (rand() > 0.66 ? "severe" : rand() > 0.33 ? "moderate" : "mild") : undefined,
        status: positive ? status : "closed",
        assignedDoctorName: positive ? pick(DOCTOR_NAMES, seed) : undefined,
        notes:
          status === "closed" || status === "confirmed"
            ? [{ author: pick(DOCTOR_NAMES, seed), text: "Consistent with LSD nodular lesions. Advised isolation and reporting to district AH office.", at: daysAgo(i) }]
            : [],
        boxes: makeBoxes(rand, positive),
        seed,
      });
    }
  });
  return cases.sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));
}

function buildUsers(): PlatformUser[] {
  const users: PlatformUser[] = [];
  FARMER_NAMES.forEach((name, i) => {
    users.push({
      id: `FRM-${i}`,
      name,
      role: "farmer",
      place: pick(VILLAGES, i),
      status: i === FARMER_NAMES.length - 1 ? "pending" : "approved",
      joinedAt: daysAgo(40 + i * 6),
      meta: `${2 + (i % 4)} cattle registered`,
    });
  });
  DOCTOR_NAMES.forEach((name, i) => {
    users.push({
      id: `DOC-${i}`,
      name,
      role: "doctor",
      place: i === 0 ? "District Veterinary Hospital, Kakinada" : "Mobile Veterinary Unit",
      status: "approved",
      joinedAt: daysAgo(120 + i * 10),
      meta: `Licence VC-${8801 + i}`,
    });
  });
  users.push({
    id: "DOC-pending-0",
    name: "Dr. Farhan Ali",
    role: "doctor",
    place: "Applied from Rajahmundry",
    status: "pending",
    joinedAt: daysAgo(1),
    meta: "Licence verification pending",
  });
  return users;
}

function buildModels(): ModelVersion[] {
  return [
    { id: "m1", version: "yolov8n-lsd-v3.2", map50: 0.934, precision: 0.912, recall: 0.897, status: "production", datasetImages: 4820, trainedOn: daysAgo(21), notes: "Current production model. Best mAP@50 so far." },
    { id: "m2", version: "yolov8n-lsd-v3.3-rc", map50: 0.941, precision: 0.918, recall: 0.905, status: "staging", datasetImages: 5140, trainedOn: daysAgo(3), notes: "Trained on +320 field images from the Godavari districts. Awaiting vet review before promotion." },
    { id: "m3", version: "yolov8n-lsd-v3.1", map50: 0.918, precision: 0.90, recall: 0.881, status: "archived", datasetImages: 4310, trainedOn: daysAgo(64), notes: "Superseded by v3.2." },
    { id: "m4", version: "yolov8n-lsd-v3.0", map50: 0.891, precision: 0.874, recall: 0.86, status: "archived", datasetImages: 3600, trainedOn: daysAgo(140), notes: "Initial production release." },
  ];
}

function buildNotifications(): NotificationItem[] {
  return [
    { id: "n1", title: "New outbreak cluster", body: "3 confirmed cases within 6km of Peddapuram in the last 5 days.", time: daysAgo(0), read: false, tone: "bad", audience: ["farmer", "doctor", "admin"] },
    { id: "n2", title: "Scan reviewed", body: "Dr. Kavitha Nair reviewed your scan for Ganga.", time: daysAgo(1), read: false, tone: "ok", audience: ["farmer", "doctor"] },
    { id: "n3", title: "Model promoted", body: "yolov8n-lsd-v3.2 is now serving production traffic.", time: daysAgo(4), read: true, tone: "info", audience: ["doctor", "admin"] },
    { id: "n4", title: "New vet application", body: "Dr. Farhan Ali applied to join as a verified vet.", time: daysAgo(0), read: false, tone: "warn", audience: ["admin"] },
  ];
}

export const LUMPY_SEED = {
  cattle: buildCattle(),
};

export function createLumpyMockState() {
  const cattle = buildCattle();
  const cases = buildCases(cattle);
  const users = buildUsers();
  const models = buildModels();
  return { cattle, cases, users, models };
}

export function getSeedNotifications(): NotificationItem[] {
  return buildNotifications();
}

/** The single source of truth for how a case status is labelled, so the vet's
 * filter chips and the farmer's filter dropdown cannot drift apart. */
export const CASE_STATUS_OPTIONS: { key: CaseStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "in_review", label: "In review" },
  { key: "confirmed", label: "Confirmed" },
  { key: "flagged", label: "Flagged" },
  { key: "closed", label: "Closed" },
];

export const VET_CHAT_OPENERS = [
  "Good morning doctor, I uploaded a new scan for one of my cows just now.",
  "Should I isolate the animal while we wait for your review?",
  "Thank you, I'll keep the shed disinfected and update you tomorrow.",
];

export const FARMER_CHAT_REPLIES = [
  "Yes, please isolate the animal from the rest of the herd right away and disinfect the shed.",
  "I've reviewed the scan - looks like an early-stage nodular lesion. I'll confirm after a closer look this evening.",
  "Good. Continue the isolation for 7 more days and monitor its temperature twice a day.",
];

export { DISTRICT, VILLAGES, BREEDS, FARMER_NAMES, DOCTOR_NAMES };
