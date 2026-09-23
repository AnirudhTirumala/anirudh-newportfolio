import { useRef, useState } from "react";
import { Camera, Upload, RefreshCw, CheckCircle2, AlertTriangle, ImagePlus } from "lucide-react";
import { useLumpyDemo } from "./DemoContext";
import { LpButton, LpCard, ProgressBar, StatusPill } from "./ui";
import type { CattleRecord, ScanCase } from "./mockData";

function CowIllustration({ boxes, positive }: { boxes: ScanCase["boxes"]; positive: boolean }) {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full" role="img" aria-label="Sample cattle photo for the scan demo">
      <rect width="400" height="260" fill="#EDEAE0" />
      <rect width="400" height="170" fill="#DCE7D6" />
      <ellipse cx="200" cy="172" rx="190" ry="14" fill="#C9BFA1" opacity="0.6" />
      {/* body */}
      <ellipse cx="190" cy="130" rx="105" ry="52" fill="#E7E2D6" stroke="#B9AF98" strokeWidth="2" />
      {/* head */}
      <ellipse cx="82" cy="118" rx="34" ry="30" fill="#E7E2D6" stroke="#B9AF98" strokeWidth="2" />
      <ellipse cx="60" cy="128" rx="12" ry="9" fill="#F3EFE4" stroke="#B9AF98" strokeWidth="1.5" />
      {/* legs */}
      {[130, 165, 220, 258].map((x, i) => (
        <rect key={i} x={x} y="168" width="12" height="46" rx="4" fill="#DAD3C0" stroke="#B9AF98" strokeWidth="1.5" />
      ))}
      {/* markings */}
      <ellipse cx="150" cy="110" rx="22" ry="16" fill="#C9BFA1" opacity="0.55" />
      <ellipse cx="220" cy="145" rx="26" ry="18" fill="#C9BFA1" opacity="0.55" />
      {positive &&
        boxes.map((_, i) => (
          <circle key={i} cx={150 + i * 40} cy={122 + (i % 2) * 14} r="4.5" fill="#B4432F" opacity="0.85" />
        ))}
    </svg>
  );
}

interface ScanToolProps {
  variant: "farmer" | "clinical";
  onComplete?: (result: ScanCase) => void;
}

/** A phone photo held as a base64 data URL and injected straight into the DOM
 * costs roughly a third more than the file itself, so anything much past this
 * locks up a mid-range device for the sake of a demo. */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function ScanTool({ variant, onComplete }: ScanToolProps) {
  const { cattle, currentFarmerId, currentFarmerName, runScan } = useLumpyDemo();
  const myCattle = cattle.filter((c) => c.farmerId === currentFarmerId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"select" | "capture" | "processing" | "result">(variant === "clinical" ? "capture" : "select");
  const [selectedCattle, setSelectedCattle] = useState<CattleRecord | null>(variant === "clinical" ? null : myCattle[0] ?? null);
  const [subjectLabel, setSubjectLabel] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [usedSample, setUsedSample] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [result, setResult] = useState<ScanCase | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    // Cleared immediately: with the previous selection still in the input,
    // picking the same photo again fires no change event at all and the
    // upload button looks broken.
    input.value = "";
    if (!file) return;
    // `accept` is only a hint - the picker's "all files" option walks past it.
    if (!file.type.startsWith("image/")) {
      setUploadError("That file isn't an image. Choose a JPG or PNG photo.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("That photo is over 8MB. Please pick a smaller one.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadError("");
      setUploadedImage(reader.result as string);
      setUsedSample(false);
    };
    reader.onerror = () => setUploadError("Could not read that file. Try another photo.");
    reader.readAsDataURL(file);
  }

  function useSample() {
    setUploadError("");
    setUploadedImage(null);
    setUsedSample(true);
  }

  function runDetection() {
    setStep("processing");
    window.setTimeout(() => {
      const cattleId = selectedCattle?.id ?? "unregistered";
      const outcome = runScan(cattleId, {
        // A clinical scan is run against a loose field photo, so it is filed
        // against nobody in particular. Leaving the owner out here is what
        // used to drop a vet's test scan into the demo farmer's history.
        owner: variant === "farmer" ? { farmerId: currentFarmerId, farmerName: currentFarmerName } : undefined,
        subjectLabel,
      });
      setResult(outcome);
      setStep("result");
      onComplete?.(outcome);
    }, 1400);
  }

  function reset() {
    setStep(variant === "clinical" ? "capture" : "select");
    setUploadedImage(null);
    setUsedSample(false);
    setUploadError("");
    setResult(null);
    setSubjectLabel("");
  }

  const canRun = uploadedImage || usedSample;

  return (
    <LpCard className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="lp-display text-lg font-semibold text-[var(--lp-ink)]">
            {variant === "farmer" ? "Scan your cattle" : "Run a diagnostic scan"}
          </p>
          <p className="text-sm text-[var(--lp-subink)]">
            {variant === "farmer" ? "Take or upload a photo to check for Lumpy Skin Disease." : "Upload a field photo to test the detection model."}
          </p>
        </div>
        <span className="lp-mono rounded-full bg-[var(--lp-accent-50)] px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-[var(--lp-accent-700)]">
          yolov8n-lsd-v3.2
        </span>
      </div>

      {step === "select" && (
        <div className="space-y-2">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--lp-subink)]">Which animal is this?</p>
          {myCattle.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCattle(c);
                setStep("capture");
              }}
              className="flex w-full items-center justify-between rounded-xl border border-[var(--lp-hairline)] px-4 py-3 text-left hover:border-[var(--lp-accent-300)] hover:bg-[var(--lp-accent-50)]"
            >
              <span>
                <span className="block text-sm font-medium text-[var(--lp-ink)]">{c.name}</span>
                <span className="block text-xs text-[var(--lp-subink)]">{c.breed} · Tag {c.tag}</span>
              </span>
              <StatusPill status={c.status} />
            </button>
          ))}
          <button
            onClick={() => {
              setSelectedCattle(null);
              setStep("capture");
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--lp-hairline)] px-4 py-3 text-sm text-[var(--lp-subink)] hover:border-[var(--lp-accent-300)]"
          >
            <ImagePlus className="h-4 w-4" /> A different / new animal
          </button>
        </div>
      )}

      {step === "capture" && (
        <div className="space-y-4">
          {variant === "clinical" && (
            <input
              value={subjectLabel}
              onChange={(e) => setSubjectLabel(e.target.value)}
              placeholder="Animal / farmer reference (optional)"
              aria-label="Animal or farmer reference"
              className="w-full rounded-xl border border-[var(--lp-hairline)] px-3 py-2 text-sm outline-none focus:border-[var(--lp-accent-400)]"
            />
          )}
          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-[var(--lp-hairline)] bg-gray-50">
            {uploadedImage ? (
              <img src={uploadedImage} alt="Uploaded for scanning" className="h-full w-full object-cover" />
            ) : usedSample ? (
              <CowIllustration boxes={[]} positive={false} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--lp-subink)]">
                <Camera className="h-8 w-8" />
                <p className="text-sm">No photo yet</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <LpButton variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload a photo
            </LpButton>
            <LpButton variant="ghost" onClick={useSample}>
              <ImagePlus className="h-4 w-4" /> Use a sample photo
            </LpButton>
          </div>
          {uploadError && (
            <p role="alert" className="flex items-center gap-1.5 text-xs text-[var(--lp-bad)]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {uploadError}
            </p>
          )}
          <LpButton onClick={runDetection} disabled={!canRun} className="w-full">
            <Camera className="h-4 w-4" /> Run AI detection
          </LpButton>
        </div>
      )}

      {step === "processing" && (
        <div className="space-y-4">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[var(--lp-hairline)] bg-gray-50">
            {uploadedImage ? (
              <img src={uploadedImage} alt="Scanning" className="h-full w-full object-cover" />
            ) : (
              <CowIllustration boxes={[]} positive={false} />
            )}
            <div className="absolute inset-x-0 top-0 h-1/3 animate-scan bg-gradient-to-b from-[var(--lp-brand-500)]/40 to-transparent" />
          </div>
          <p className="lp-mono flex items-center justify-center gap-2 text-center text-xs uppercase tracking-[0.2em] text-[var(--lp-accent-600)]">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Running inference...
          </p>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[var(--lp-hairline)] bg-gray-50">
            {uploadedImage ? (
              <img src={uploadedImage} alt="Scan result" className="h-full w-full object-cover" />
            ) : (
              <CowIllustration boxes={result.boxes} positive={result.verdict === "positive"} />
            )}
            {result.boxes.map((box, i) => (
              <div
                key={i}
                className="absolute border-2 border-[var(--lp-bad)]"
                style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
              >
                <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-[var(--lp-bad)] px-1.5 py-0.5 text-[0.65rem] font-medium text-white">
                  lesion {(box.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>

          <div className={`flex items-center gap-3 rounded-xl p-4 ${result.verdict === "positive" ? "bg-red-50" : "bg-emerald-50"}`}>
            {result.verdict === "positive" ? (
              <AlertTriangle className="h-6 w-6 shrink-0 text-[var(--lp-bad)]" />
            ) : (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-[var(--lp-ok)]" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`lp-display font-semibold ${result.verdict === "positive" ? "text-[var(--lp-bad)]" : "text-[var(--lp-ok)]"}`}>
                {result.verdict === "positive" ? "Signs of Lumpy Skin Disease detected" : "No signs of LSD detected"}
              </p>
              <p className="text-xs text-[var(--lp-subink)]">
                {result.cattleName} · confidence {(result.confidence * 100).toFixed(1)}%{result.severity ? ` · ${result.severity} severity` : ""}
              </p>
            </div>
          </div>

          <ProgressBar value={result.confidence * 100} tone={result.verdict === "positive" ? "bad" : "ok"} />

          <p className="text-sm text-[var(--lp-subink)]">
            {result.verdict === "positive"
              ? variant === "farmer"
                ? "Isolate this animal from the herd and share this scan with a vet for confirmation. This has been added to your scan history and flagged for review."
                : "Case logged to the review queue with the detected regions above, ready for a second opinion."
              : "No further action needed right now. Keep monitoring and rescan if new lesions appear."}
          </p>

          <LpButton variant="ghost" onClick={reset} className="w-full">
            <RefreshCw className="h-4 w-4" /> Run another scan
          </LpButton>
        </div>
      )}

      <p className="mt-4 text-center text-[0.65rem] text-[var(--lp-subink)]">
        Demo mode — this result is simulated for the portfolio and isn't from a live model.
      </p>
    </LpCard>
  );
}
