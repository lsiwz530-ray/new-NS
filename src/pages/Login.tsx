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
          <div className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
            الاسم محجوز لصاحبه فعليًا الآن: أول مرة تسجّل باسم، تختار كلمة مرور له، ولا أحد غيرك يقدر يدخل عليه بدونها.
          </div>
        </div>
      </div>
    </Layout>
  );
}
