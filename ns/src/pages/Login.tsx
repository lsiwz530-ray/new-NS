import { Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useStore, userActions } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Login() {
  const [name, setName] = useState("");
  const currentUser = useStore((s) => s.currentUser);
  const navigate = useNavigate();

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
    const r = await userActions.loginOrRegister(name);
    if (!r.ok) { toast.error(r.error || "خطأ"); return; }
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
            <p className="text-muted-foreground text-sm mt-2">أدخل اسم المستخدم فقط — سنحفظ طلباتك تحته</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <Input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="اسم المستخدم (مثال: Ray)"
              className="h-12 text-center text-lg bg-secondary/50 border-primary/40 focus:border-primary"
              maxLength={20} autoFocus
            />
            <Button type="submit" className="w-full h-12 gradient-purple neon-glow text-lg font-bold">دخول</Button>
          </form>
          <div className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
            الاسم محجوز لصاحبه ولا يمكن لشخص آخر استخدامه لحماية بياناتك وطلباتك.
          </div>
        </div>
      </div>
    </Layout>
  );
}
