import { useNavigate } from "@tanstack/react-router";
import { adminActions, staffActions, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { NetworkBackground } from "@/components/NetworkBackground";

export default function Auth() {
  const authed = useStore((s) => !!s.adminToken);
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  useEffect(() => { if (authed) navigate({ to: "/dashboard" }); }, [authed, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = (await adminActions.login(u, p)) || (await staffActions.login(u, p));
    if (ok) {
      toast.success("مرحبًا بك في لوحة التحكم");
      navigate({ to: "/dashboard" });
    } else {
      toast.error("بيانات خاطئة");
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4" dir="rtl">
      <NetworkBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="glass neon-border rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-2xl gradient-purple neon-glow flex items-center justify-center animate-neon-pulse">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-3xl font-black neon-text-strong mt-4">لوحة التحكم</h1>
            <p className="text-sm text-muted-foreground mt-1">دخول المسؤول فقط</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>المستخدم</Label>
              <Input value={u} onChange={(e) => setU(e.target.value)} className="h-11 mt-1 bg-secondary/50" autoFocus />
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <Input type="password" value={p} onChange={(e) => setP(e.target.value)} className="h-11 mt-1 bg-secondary/50" />
            </div>
            <Button type="submit" className="w-full h-11 gradient-purple neon-glow text-lg font-bold">دخول</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
