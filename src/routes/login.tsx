import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { memberSession } from "@/lib/session";
import { toast } from "sonner";
import logo from "@/assets/sdmath-logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — SDMATH" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [memNo, setMemNo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !memNo.trim()) { toast.error("أدخل الاسم ورقم العضوية"); return; }
    setLoading(true);

    try {
      // 1. Look up the member by membership number first
      const { data: byMemNo, error: memErr } = await supabase
        .from("members")
        .select("id, name, membership_no, status")
        .eq("membership_no", memNo.trim())
        .maybeSingle();

      if (memErr) {
        console.error("[Login] Query error:", memErr);
        toast.error("حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى");
        setLoading(false);
        return;
      }

      // 2. Account does not exist
      if (!byMemNo) {
        toast.error("الحساب غير موجود");
        setLoading(false);
        return;
      }

      // 3. Name mismatch — wrong credentials
      if (byMemNo.name.trim() !== name.trim()) {
        toast.error("بيانات الدخول غير صحيحة");
        setLoading(false);
        return;
      }

      // 4. Check account status
      if (byMemNo.status === "pending") {
        toast.warning("الحساب بانتظار موافقة الإدارة");
        setLoading(false);
        return;
      }
      if (byMemNo.status === "rejected") {
        toast.error("تم رفض طلب اشتراكك. تواصل مع الإدارة.");
        setLoading(false);
        return;
      }

      // 5. Success
      memberSession.set({ id: byMemNo.id, name: byMemNo.name, membership_no: byMemNo.membership_no });
      toast.success(`مرحباً ${byMemNo.name}`);
      navigate({ to: "/exams" });
    } catch (err) {
      console.error("[Login] Unexpected error:", err);
      toast.error("حدث خطأ غير متوقع، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] rounded-full bg-primary/10 blur-3xl" />
      </div>
      <Header />
      <main className="container mx-auto px-4 py-10 sm:py-16 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong rounded-[1.75rem] p-7 sm:p-9 shadow-elegant"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <img src={logo} alt="SDMATH" className="w-14 h-14 mb-3" />
            <h1 className="text-2xl font-bold tracking-tight">تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground mt-1">ادخل اسمك ورقم عضويتك للوصول إلى الاختبارات.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم المشترك</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم العضوية</Label>
              <Input value={memNo} onChange={(e) => setMemNo(e.target.value)} dir="ltr" className="h-11 rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-full shadow-soft" size="lg" disabled={loading}>
              {loading ? "..." : "دخول"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            ليس لديك حساب؟ <Link to="/register" className="text-primary font-semibold hover:underline">اشترك الآن</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground mt-4">
            <Link to="/admin/login" className="hover:text-primary transition-colors">دخول الإدارة</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
