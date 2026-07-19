import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useStore, chatActions, type ChatMessage } from "@/lib/store";
import { useLang } from "@/lib/i18n";

const POS_KEY = "northsite:chat-pos";
// Short, clean notification blip — synthesized, no external asset needed.
function playBlip() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.26);
  } catch {}
}

export function ChatWidget() {
  const currentUser = useStore((s) => s.currentUser);
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return { x: 24, y: 24 };
    try { return JSON.parse(localStorage.getItem(POS_KEY) || "") ?? { x: 24, y: 24 }; } catch { return { x: 24, y: 24 }; }
  });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const lastCount = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { messages: msgs } = await chatActions.fetchMine(currentUser);
      if (msgs.length > lastCount.current && lastCount.current > 0) playBlip();
      lastCount.current = msgs.length;
      setMessages(msgs);
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    poll();
    const iv = setInterval(poll, 2000);
    return () => clearInterval(iv);
  }, [currentUser, poll]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function onDragStart(e: React.PointerEvent) {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onDragMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const next = { x: Math.max(8, dragStart.current.px - dx), y: Math.max(8, dragStart.current.py - dy) };
    setPos(next);
  }
  function onDragEnd() {
    if (!dragging.current) return;
    dragging.current = false;
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  }

  async function send() {
    if (!text.trim() || !currentUser) return;
    const val = text.trim();
    setText("");
    await chatActions.send(currentUser, val);
    poll();
  }

  if (!currentUser) return null;

  return (
    <>
      <button
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        style={{ position: "fixed", right: pos.x, bottom: pos.y, zIndex: 90 }}
        onClick={() => !dragging.current && setOpen((v) => !v)}
        className="w-16 h-16 rounded-full gradient-purple neon-glow animate-chat-pulse flex flex-col items-center justify-center text-white touch-none select-none cursor-grab active:cursor-grabbing"
        aria-label={t("chatPrompt")}
      >
        <div className="w-7 h-7 logo-mask" style={{ backgroundColor: "white" }} />
      </button>
      {!open && (
        <div
          style={{ position: "fixed", right: pos.x + 72, bottom: pos.y + 20, zIndex: 90 }}
          className="glass neon-border rounded-full px-3 py-1.5 text-xs font-semibold pointer-events-none hidden sm:block"
        >
          {t("chatPrompt")}
        </div>
      )}

      {open && (
        <div
          style={{ position: "fixed", right: pos.x, bottom: pos.y + 76, zIndex: 91 }}
          className="w-[340px] max-w-[90vw] h-[440px] glass neon-border rounded-2xl flex flex-col overflow-hidden page-transition"
        >
          <div className="gradient-purple px-4 py-3 flex items-center justify-between text-white">
            <div className="font-display font-bold">الدعم الفني</div>
            <button onClick={() => setOpen(false)} aria-label="إغلاق"><X className="w-5 h-5" /></button>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-xs text-muted-foreground mt-8">اكتب رسالتك وسيتم الرد عليك قريبًا</div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                    m.sender === "user" ? "gradient-purple text-white" :
                    m.sender === "system" ? "bg-secondary/60 text-muted-foreground italic text-xs" :
                    "bg-secondary text-foreground"
                  }`}
                >
                  {m.sender === "admin" && <div className="text-[10px] font-bold text-primary mb-0.5">{m.senderName}</div>}
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-primary/20 flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="اكتب رسالتك..."
              className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={send} className="gradient-purple neon-glow rounded-lg p-2 text-white" aria-label="إرسال">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
