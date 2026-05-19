import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/sdmath-logo.png";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "اشترك في SDMATH" }, { name: "description", content: "نموذج الاشتراك في منصة SDMATH." }] }),
  component: Register,
});

const schema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(80),
  whatsapp: z.string().trim().min(7).max(20),
  coach_name: z.string().trim().min(2).max(80),
  membership_no: z.string().trim().min(2).max(40),
});

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", whatsapp: "", coach_name: "", membership_no: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0]?.message || "تحقق من البيانات"); return; }
    setLoading(true);
    const { error } = await supabase.from("members").insert({ ...parsed.data, status: "pending" });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error("رقم العضوية مستخدم مسبقاً");
      else toast.error("حدث خطأ، حاول مرة أخرى");
      return;
    }
    toast.success("تم إرسال طلب الاشتراك بنجاح بانتظار موافقة الإدارة");
    setTimeout(() => navigate({ to: "/login" }), 1500);
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
            <h1 className="text-2xl font-bold tracking-tight">إنشاء حساب جديد</h1>
            <p className="text-sm text-muted-foreground mt-1">أدخل بياناتك للاشتراك في المنصة.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم المشترك</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الواتساب</Label>
              <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} dir="ltr" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>اسم المدرب</Label>
              <Input value={form.coach_name} onChange={(e) => setForm({ ...form, coach_name: e.target.value })} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم العضوية</Label>
              <Input value={form.membership_no} onChange={(e) => setForm({ ...form, membership_no: e.target.value })} dir="ltr" className="h-11 rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-full shadow-soft" size="lg" disabled={loading}>
              {loading ? "جارٍ الإرسال..." : "إرسال طلب الاشتراك"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            لديك حساب بالفعل؟ <Link to="/login" className="text-primary font-semibold hover:underline">تسجيل الدخول</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
