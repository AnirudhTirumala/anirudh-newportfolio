import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { LpCard } from "./ui";
import { FARMER_CHAT_REPLIES, VET_CHAT_OPENERS, type ChatMessage } from "./mockData";

function timeNow() {
  return new Date().toISOString();
}

export function LumpyChat({ persona }: { persona: "vet" | "farmer" }) {
  const other = persona === "vet" ? "Dr. Kavitha Nair" : "Ravi Kumar (Farmer)";
  const replies = persona === "vet" ? FARMER_CHAT_REPLIES : VET_CHAT_OPENERS;
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: "m0", from: "them", text: persona === "vet" ? "Hi, I've reviewed the case you sent over." : "Hello doctor, I have a question about my cow's scan result.", time: timeNow() },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const replyIndex = useRef(0);
  const reduced = useReducedMotion();

  // The message list is driven directly rather than through scrollIntoView on
  // a sentinel: that walks up and scrolls every scrollable ancestor, so simply
  // opening the chat dragged the whole portfolio page away under the visitor,
  // and every reply and typing indicator did it again.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [messages, typing, reduced]);

  function send() {
    if (!draft.trim()) return;
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: "me", text: draft.trim(), time: timeNow() }]);
    setDraft("");
    setTyping(true);
    window.setTimeout(() => {
      const text = replies[replyIndex.current % replies.length];
      replyIndex.current += 1;
      setMessages((prev) => [...prev, { id: `t-${Date.now()}`, from: "them", text, time: timeNow() }]);
      setTyping(false);
    }, 1100 + Math.random() * 700);
  }

  return (
    <LpCard className="mx-auto flex h-[560px] max-w-2xl flex-col p-0">
      <div className="flex items-center gap-3 border-b border-[var(--lp-hairline)] p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--lp-accent-100)] text-sm font-semibold text-[var(--lp-accent-700)]">
          {other.split(" ")[0][0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--lp-ink)]">{other}</p>
          <p className="text-xs text-[var(--lp-ok)]">Online</p>
        </div>
      </div>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4 lp-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                m.from === "me" ? "bg-[var(--lp-accent-500)] text-white" : "bg-gray-100 text-[var(--lp-ink)]"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-3.5 py-2 text-sm text-[var(--lp-subink)]">typing...</div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--lp-hairline)] p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-[var(--lp-hairline)] px-4 py-2 text-sm outline-none focus:border-[var(--lp-accent-400)]"
        />
        <button onClick={send} className="rounded-full bg-[var(--lp-accent-500)] p-2.5 text-white hover:bg-[var(--lp-accent-600)]" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </LpCard>
  );
}
