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
    if (!name.trim() || !memNo.trim()) {
      toast.error("أدخل الاسم ورقم العضوية");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select("id, name, membership_no, status")
      .eq("membership_no", memNo.trim())
      .ilike("name", name.trim())
      .maybeSingle();
    setLoading(false);
    if (error || !data) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    if (data.status === "pending") {
      toast.warning("طلبك قيد المراجعة");
      return;
    }
    if (data.status === "rejected") {
      toast.error("تم رفض طلب اشتراكك. تواصل مع الإدارة.");
      return;
    }
    memberSession.set({ id: data.id, name: data.name, membership_no: data.membership_no });
    toast.success(`مرحباً ${data.name}`);
    navigate({ to: "/exams" });
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-3xl p-8 shadow-elegant">
          <h1 className="text-2xl font-bold mb-2">تسجيل الدخول</h1>
          <p className="text-sm text-muted-foreground mb-6">ادخل اسمك ورقم عضويتك للوصول إلى الاختبارات.</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم المشترك</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم العضوية</Label>
              <Input value={memNo} onChange={(e) => setMemNo(e.target.value)} dir="ltr" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "..." : "دخول"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            ليس لديك حساب؟ <Link to="/register" className="text-primary font-medium">اشترك الآن</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground mt-4">
            <Link to="/admin/login" className="hover:text-primary">دخول الإدارة</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
