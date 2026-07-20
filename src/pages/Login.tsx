import { Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useStore, userActions } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Lock, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [taken, setTaken] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const currentUser = useStore((s) => s.currentUser);
  const navigate = useNavigate();
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (name.trim().length < 2) { setTaken(false); setSuggestions([]); return; }
    checkTimer.current = setTimeout(async () => {
      const r = await userActions.checkUsername(name);
      setTaken(r.taken);
      setSuggestions(r.suggestions || []);
    }, 350);
    return () => { if (checkTimer.current) clearTimeout(checkTimer.current); };
  }, [name]);

  if (currentUser) {
    return (
      <Layout>
        <div className="mx-auto max-w-md px-4 py-24 text-center glass neon-border rounded-2xl">
          <h2 className="font-display text-2xl neon-text-strong">أنت مسجل بالفعل</h2>
          <p className="text-muted-foreground mt-2">مرحبًا {currentUser}</p>
          <div className="flex gap-2 mt-4 justify-center">
            <Link to="/account"><Button className="gradient-purple neon-glow">حسابي</Button></Link>
            <Link to="/"><Button variant="outline" className="border-primary/50">الرئيسية</Button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const r = await userActions.loginOrRegister(name, password);
    setSubmitting(false);
    if (!r.ok) {
      toast.error(r.error || "خطأ");
      if (r.suggestions?.length) setSuggestions(r.suggestions);
      return;
    }
    toast.success("مرحبًا بك " + name);
    navigate({ to: "/" });
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="glass neon-border rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-2xl gradient-purple neon-glow flex items-center justify-center animate-neon-pulse">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-3xl font-black neon-text-strong mt-4">دخول</h1>
            <p className="text-muted-foreground text-sm mt-2">
              أدخل اسم مستخدم وكلمة مرور — إذا كان الاسم متاحًا سننشئ حسابك به فورًا
            </p>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="اسم المستخدم (مثال: Ray)"
                className="h-12 text-center text-lg bg-secondary/50 border-primary/40 focus:border-primary"
                maxLength={20} autoFocus
              />
              {taken && (
                <div className="mt-2 text-xs bg-amber-500/10 border border-amber-500/40 text-amber-300 rounded-lg p-2 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <div>هذا الاسم محجوز — إذا كان حسابك أدخل كلمة مرورك، أو جرّب اسمًا آخر:</div>
                    {suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {suggestions.map((s) => (
                          <button
                            type="button" key={s} onClick={() => { setName(s); setPassword(""); }}
                            className="px-2 py-1 rounded-full bg-primary/20 hover:bg-primary/30 text-primary font-bold"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور (4 أحرف على الأقل)"
                className="h-12 pr-9 bg-secondary/50 border-primary/40 focus:border-primary"
                maxLength={64}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-12 gradient-purple neon-glow text-lg font-bold">
              {submitting ? "..." : "دخول"}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-primary/20" />
            <span className="text-xs text-muted-foreground">أو</span>
            <div className="h-px flex-1 bg-primary/20" />
          </div>

          <a href="/api/auth/discord" className="block">
            <Button type="button" className="w-full h-12 text-lg font-bold text-white" style={{ backgroundColor: "#5865F2" }}>
              <svg viewBox="0 0 127.14 96.36" className="w-5 h-5 ml-2" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
              الدخول عبر ديسكورد
            </Button>
          </a>
          <div className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
            الاسم محجوز لصاحبه فعليًا الآن: أول مرة تسجّل باسم، تختار كلمة مرور له، ولا أحد غيرك يقدر يدخل عليه بدونها.
          </div>
        </div>
      </div>
    </Layout>
  );
}
