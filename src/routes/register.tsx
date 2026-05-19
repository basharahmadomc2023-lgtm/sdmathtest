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
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "تحقق من البيانات");
      return;
    }
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
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-3xl p-8 shadow-elegant">
          <h1 className="text-2xl font-bold mb-2">إنشاء حساب جديد</h1>
          <p className="text-sm text-muted-foreground mb-6">أدخل بياناتك للاشتراك في المنصة.</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم المشترك</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الواتساب</Label>
              <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>اسم المدرب</Label>
              <Input value={form.coach_name} onChange={(e) => setForm({ ...form, coach_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم العضوية</Label>
              <Input value={form.membership_no} onChange={(e) => setForm({ ...form, membership_no: e.target.value })} dir="ltr" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "جارٍ الإرسال..." : "إرسال طلب الاشتراك"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            لديك حساب بالفعل؟ <Link to="/login" className="text-primary font-medium">تسجيل الدخول</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
