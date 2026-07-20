import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { userActions } from "@/lib/store";
import { toast } from "sonner";

export default function DiscordLogin() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) { setStatus("error"); return; }
    userActions.loginWithDiscordToken(token).then((r) => {
      if (r.ok) {
        toast.success("تم تسجيل الدخول عبر ديسكورد");
        navigate({ to: "/account" });
      } else {
        setStatus("error");
      }
    });
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-md px-4 py-24 text-center glass neon-border rounded-2xl">
        {status === "loading" ? (
          <>
            <div className="mx-auto w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-muted-foreground mt-4">جاري تسجيل الدخول عبر ديسكورد...</p>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl neon-text-strong">تعذر تسجيل الدخول</h2>
            <p className="text-muted-foreground mt-2">الرابط منتهي أو غير صالح، جرّب مرة أخرى من صفحة الدخول.</p>
          </>
        )}
      </div>
    </Layout>
  );
}
