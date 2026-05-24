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
import { isThreePartName, THREE_PART_NAME_MSG } from "@/lib/session";
import logo from "@/assets/sdmath-logo.png";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "اشترك في SDMATH" }, { name: "description", content: "نموذج الاشتراك في منصة SDMATH." }] }),
  component: Register,
});

const schema = z.object({
  name: z.string().trim().refine(isThreePartName, { message: THREE_PART_NAME_MSG }),
  whatsapp: z.string().trim().min(7, "يجب أن يحتوي رقم الواتساب على 7 أحرف على الأقل").max(20),
  coach_name: z.string().trim().refine(isThreePartName, { message: THREE_PART_NAME_MSG }),
  membership_no: z.string().trim().min(2, "أدخل رقم العضوية").max(40),
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

    try {
      // 1. Verify trainer membership number exists
      const { data: trainer, error: trainerErr } = await supabase
        .from("trainers")
        .select("id, full_name, membership_number, status")
        .eq("membership_number", parsed.data.membership_no)
        .maybeSingle();

      if (trainerErr) {
        console.error("[Register] Trainer lookup error:", trainerErr);
        toast.error("حدث خطأ أثناء التحقق من المدرب، حاول مرة أخرى");
        setLoading(false);
        return;
      }

      if (!trainer) {
        toast.error("رقم عضوية المدرب غير موجود");
        setLoading(false);
        return;
      }

      // 2. Verify trainer name matches the membership number
      if (trainer.full_name.trim() !== parsed.data.coach_name.trim()) {
        toast.error("اسم المدرب لا يطابق رقم العضوية");
        setLoading(false);
        return;
      }

      // 3. Check if subscriber already exists (by membership_no or name+whatsapp combo)
      const { data: existing, error: existErr } = await supabase
        .from("members")
        .select("id")
        .eq("membership_no", parsed.data.membership_no)
        .maybeSingle();

      if (existErr) {
        console.error("[Register] Existence check error:", existErr);
      }

      if (existing) {
        toast.error("هذا المشترك مسجل مسبقًا");
        setLoading(false);
        return;
      }

      // 4. Insert the new subscriber, linking to trainer
      const { error } = await supabase.from("members").insert({
        name: parsed.data.name,
        whatsapp: parsed.data.whatsapp,
        coach_name: parsed.data.coach_name,
        membership_no: parsed.data.membership_no,
        status: "pending",
        trainer_name: parsed.data.coach_name,
        trainer_id: trainer.id,
      });

      if (error) {
        console.error("[Register] Insert error:", error.code, error.message, error.details);
        if (error.code === "23505") {
          toast.error("هذا المشترك مسجل مسبقًا");
        } else if (error.code === "42501" || error.message?.includes("policy")) {
          toast.error("لا توجد صلاحية لإضافة المشترك، تحقق من إعدادات قاعدة البيانات");
        } else {
          toast.error("حدث خطأ أثناء التسجيل، حاول مرة أخرى");
        }
        setLoading(false);
        return;
      }

      toast.success("تم إرسال طلب الاشتراك بنجاح");
      setTimeout(() => navigate({ to: "/login" }), 1500);
    } catch (err) {
      console.error("[Register] Unexpected error:", err);
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
