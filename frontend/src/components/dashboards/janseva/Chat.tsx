import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { JsCard } from "./ui";
import { ASSISTANT_QA, type JsChatMessage } from "./mockData";

const OFFICE_REPLIES = [
  "Thanks for reaching out - I can see your request. Let me check with the concerned department and get back to you shortly.",
  "Your application is in the verification stage. It should be updated within 2-3 working days.",
  "That's been noted. Please visit the Panchayat office between 10 AM - 5 PM if you'd like to submit physical documents too.",
];

function timeNow() {
  return new Date().toISOString();
}

export function JsChat({ persona }: { persona: "citizen" | "office" }) {
  const other = persona === "citizen" ? "Panchayat Front Office" : "Ramesh Yadav (Citizen)";
  const replies = persona === "citizen" ? OFFICE_REPLIES : ["Thank you for the update, I'll follow up on my end.", "Understood, please let me know once it's ready."];
  const [messages, setMessages] = useState<JsChatMessage[]>(() => [
    { id: "m0", from: "them", text: persona === "citizen" ? "Namaste! How can we help you today?" : "Hello, I had a question about my application.", time: timeNow() },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const idx = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function send() {
    if (!draft.trim()) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "me", text: draft.trim(), time: timeNow() }]);
    setDraft("");
    setTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: `t-${Date.now()}`, from: "them", text: replies[idx.current % replies.length], time: timeNow() }]);
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
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-black/15 px-4 py-2 text-sm outline-none focus:border-[var(--js-red)]"
        />
        <button onClick={send} className="rounded-full bg-gradient-to-br from-[#f04747] to-[#c71515] p-2.5 text-white" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </JsCard>
  );
}

export function AIAssistant() {
  const [messages, setMessages] = useState<{ id: string; from: "me" | "bot"; text: string }[]>([
    { id: "a0", from: "bot", text: "Hi, I'm the JanSeva assistant. Ask me about schemes, certificates, or how to report an issue - in English or Telugu." },
  ]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function answerFor(text: string) {
    const lower = text.toLowerCase();
    const match = ASSISTANT_QA.find((qa) => qa.q.toLowerCase().split(" ").some((w) => w.length > 3 && lower.includes(w.toLowerCase())));
    return match?.a ?? "I can help with schemes, applications, certificates, and local issues - try asking about one of those, or use the quick questions below.";
  }

  function send(text?: string) {
    const value = (text ?? draft).trim();
    if (!value) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "me", text: value }]);
    setDraft("");
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, from: "bot", text: answerFor(value) }]);
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
      <div className="flex flex-wrap gap-2 border-t border-black/10 p-3">
        {ASSISTANT_QA.slice(0, 3).map((qa) => (
          <button key={qa.q} onClick={() => send(qa.q)} className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs text-[var(--js-ink-soft)] hover:border-[var(--js-red)]/40">
            <Sparkles className="h-3 w-3" /> {qa.q}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-black/10 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a question..."
          className="flex-1 rounded-full border border-black/15 px-4 py-2 text-sm outline-none focus:border-[var(--js-red)]"
        />
        <button onClick={() => send()} className="rounded-full bg-gradient-to-br from-[#f04747] to-[#c71515] p-2.5 text-white" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </JsCard>
  );
}
