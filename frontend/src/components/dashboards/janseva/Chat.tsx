import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { useJanSevaDemo } from "./DemoContext";
import { JsCard } from "./ui";
import { ASSISTANT_FALLBACK, ASSISTANT_QA, type Scheme } from "./mockData";

const OFFICE_REPLIES = [
  "Thanks for reaching out - I can see your request. Let me check with the concerned department and get back to you shortly.",
  "Your application is in the verification stage. It should be updated within 2-3 working days.",
  "That's been noted. Please visit the Panchayat office between 10 AM - 5 PM if you'd like to submit physical documents too.",
];

function timeNow() {
  return new Date().toISOString();
}

/** Enter sends, except while an IME is mid-composition: Telugu is usually
 * typed through a transliteration keyboard where Enter commits the candidate
 * word, and sending there would fire off a half-typed word and clear the box. */
function isSendKey(event: KeyboardEvent<HTMLInputElement>) {
  return event.key === "Enter" && !event.nativeEvent.isComposing;
}

export function JsChat({ persona }: { persona: "citizen" | "office" }) {
  const { chatThreads, appendChatMessage } = useJanSevaDemo();
  const other = persona === "citizen" ? "Panchayat Front Office" : "Ramesh Yadav (Citizen)";
  const replies = persona === "citizen" ? OFFICE_REPLIES : ["Thank you for the update, I'll follow up on my end.", "Understood, please let me know once it's ready."];
  const messages = chatThreads[persona];
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const idx = useRef(0);

  useEffect(() => {
    // `block: "nearest"` keeps this inside the message list. Plain
    // scrollIntoView also scrolls every scrollable ancestor, which would drag
    // the whole portfolio page around when a restored thread mounts already
    // scrolled to its end.
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, typing]);

  function send() {
    const value = draft.trim();
    if (!value) return;
    appendChatMessage(persona, { id: `u-${Date.now()}`, from: "me", text: value, time: timeNow() });
    setDraft("");
    setTyping(true);
    window.setTimeout(() => {
      appendChatMessage(persona, { id: `t-${Date.now()}`, from: "them", text: replies[idx.current % replies.length], time: timeNow() });
      idx.current += 1;
      setTyping(false);
    }, 1000 + Math.random() * 700);
  }

  return (
    <JsCard tilt={false} className="mx-auto flex h-[560px] max-w-2xl flex-col p-0">
      <div className="flex items-center gap-3 border-b border-black/10 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-sm font-semibold text-[var(--js-red)]">{other[0]}</div>
        <div>
          <p className="text-sm font-semibold text-[var(--js-ink)]">{other}</p>
          <p className="text-xs text-[var(--js-ink-soft)]">Usually replies within a few hours</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 js-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${m.from === "me" ? "bg-gradient-to-br from-[#f04747] to-[#c71515] text-white" : "bg-black/5 text-[var(--js-ink)]"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && <div className="flex justify-start"><div className="rounded-2xl bg-black/5 px-3.5 py-2 text-sm text-[var(--js-ink-soft)]">typing...</div></div>}
        <div ref={endRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-black/10 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (isSendKey(e)) send();
          }}
          placeholder="Type a message..."
          aria-label="Message"
          className="flex-1 rounded-full border border-black/15 px-4 py-2 text-sm outline-none focus:border-[var(--js-red)]"
        />
        <button type="button" onClick={send} disabled={!draft.trim()} className="rounded-full bg-gradient-to-br from-[#f04747] to-[#c71515] p-2.5 text-white disabled:opacity-40" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </JsCard>
  );
}

/* Matching is a scored token overlap rather than the substring scan this used
   to do. A substring scan let one incidental word decide the answer - "How
   does the scheme work?" was answered with certificate timings, because the
   filler word "does" appears in the certificate question - and it could never
   match a token carrying punctuation, so "scheme?" was dead weight. */
const STOP_WORDS = new Set([
  "how", "what", "when", "where", "which", "who", "why", "does", "long", "take", "the", "for", "and", "you", "your", "can",
  "with", "about", "from", "this", "that", "there", "have", "need", "tell", "please", "want", "would", "could", "should",
  "are", "was", "will", "get", "got", "any", "our", "its",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/** Counts shared content words. Words of four characters or more also match on
 * a shared prefix, so "certificate" still finds "certificates". */
function overlap(query: string[], candidate: string[]): number {
  return query.filter((q) => candidate.some((c) => c === q || (q.length >= 4 && c.length >= 4 && (c.startsWith(q) || q.startsWith(c))))).length;
}

function describeScheme(scheme: Scheme): string {
  const availability = scheme.active
    ? "It's open for applications - find it under Browse Schemes and tap Apply."
    : "It isn't accepting applications at the moment.";
  return `${scheme.name} (${scheme.department}): ${scheme.description} Eligibility: ${scheme.eligibility}. Benefit: ${scheme.benefit}. ${availability}`;
}

function answerFor(text: string, schemes: Scheme[]): string {
  const query = tokenize(text);
  let best = { score: 0, answer: "" };

  for (const qa of ASSISTANT_QA) {
    const score = overlap(query, tokenize(qa.q));
    if (score > best.score) best = { score, answer: qa.a };
  }
  // Schemes win ties: naming one is far more specific than brushing against a
  // generic word like "scheme" in a canned question.
  for (const scheme of schemes) {
    const score = overlap(query, tokenize(`${scheme.name} ${scheme.department}`));
    if (score > 0 && score >= best.score) best = { score, answer: describeScheme(scheme) };
  }

  if (best.score > 0) return best.answer;
  return /[ఀ-౿]/.test(text) ? ASSISTANT_FALLBACK.te : ASSISTANT_FALLBACK.en;
}

export function AIAssistant() {
  const { chatThreads, appendChatMessage, schemes } = useJanSevaDemo();
  const messages = chatThreads.assistant;
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  function send(text?: string) {
    const value = (text ?? draft).trim();
    if (!value) return;
    appendChatMessage("assistant", { id: `u-${Date.now()}`, from: "me", text: value, time: timeNow() });
    setDraft("");
    window.setTimeout(() => {
      appendChatMessage("assistant", { id: `b-${Date.now()}`, from: "them", text: answerFor(value, schemes), time: timeNow() });
    }, 700);
  }

  return (
    <JsCard tilt={false} className="mx-auto flex h-[560px] max-w-2xl flex-col p-0">
      <div className="flex items-center gap-3 border-b border-black/10 bg-gradient-to-br from-[#0d0d0d] to-[#252525] p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ffd0d0] to-[#e32626]">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">JanSeva AI Assistant</p>
          <p className="text-xs text-white/50">Multilingual · English · తెలుగు</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 js-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.from === "me" ? "bg-gradient-to-br from-[#f04747] to-[#c71515] text-white" : "bg-black/5 text-[var(--js-ink)]"}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {/* Capped so the full question list - including the Telugu one, which
          used to be cut off by the chip row rendering only the first three -
          can never crowd the conversation out of a narrow card. */}
      <div className="js-scrollbar flex max-h-[5.5rem] flex-wrap gap-2 overflow-y-auto border-t border-black/10 p-3">
        {ASSISTANT_QA.map((qa) => (
          <button
            key={qa.q}
            type="button"
            onClick={() => send(qa.q)}
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs text-[var(--js-ink-soft)] hover:border-[var(--js-red)]/40"
          >
            <Sparkles className="h-3 w-3 shrink-0" /> {qa.q}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-black/10 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (isSendKey(e)) send();
          }}
          placeholder="Ask a question..."
          aria-label="Ask the assistant"
          className="flex-1 rounded-full border border-black/15 px-4 py-2 text-sm outline-none focus:border-[var(--js-red)]"
        />
        <button type="button" onClick={() => send()} disabled={!draft.trim()} className="rounded-full bg-gradient-to-br from-[#f04747] to-[#c71515] p-2.5 text-white disabled:opacity-40" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </JsCard>
  );
}
