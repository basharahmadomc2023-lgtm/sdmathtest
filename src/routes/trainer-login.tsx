import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trainerSession, isThreePartName, THREE_PART_NAME_MSG } from "@/lib/session";
import logo from "@/assets/sdmath-logo.png";

export const Route = createFileRoute("/trainer-login")({
  head: () => ({ meta: [{ title: "دخول المدربين — SDMATH" }] }),
  component: TrainerLogin,
});

function TrainerLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", membership_number: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = form.full_name.trim();
    if (!isThreePartName(fullName)) { toast.error(THREE_PART_NAME_MSG); return; }
    if (!form.membership_number.trim()) { toast.error("أدخل رقم العضوية"); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("trainers")
      .select("*")
      .eq("full_name", fullName)
      .eq("membership_number", form.membership_number.trim())
      .maybeSingle();
    setLoading(false);
    if (error || !data) { toast.error("بيانات الدخول غير صحيحة"); return; }
    if (data.status === "Pending") { toast.error("حساب المدرب قيد المراجعة"); return; }
    if (data.status === "Cancelled") { toast.error("تم إلغاء حساب المدرب"); return; }
    trainerSession.set({ id: data.id, full_name: data.full_name, membership_number: data.membership_number });
    toast.success("تم تسجيل الدخول");
    navigate({ to: "/trainer-dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-soft relative overflow-hidden">
      <Header />
      <main className="container mx-auto px-4 py-10 sm:py-16 max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong rounded-[1.75rem] p-7 sm:p-9 shadow-elegant"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <img src={logo} alt="SDMATH" className="w-14 h-14 mb-3" />
            <h1 className="text-2xl font-bold tracking-tight">دخول المدربين</h1>
            <p className="text-sm text-muted-foreground mt-1">أدخل بياناتك لتسجيل دخول المدرب.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم المدرب الثلاثي</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="h-11 rounded-xl" placeholder="مثال: سليمان خالد دياب" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم العضوية</Label>
              <Input value={form.membership_number} onChange={(e) => setForm({ ...form, membership_number: e.target.value })} dir="ltr" className="h-11 rounded-xl" />
            </div>
            <Button type="submit" className="w-full rounded-full shadow-soft" size="lg" disabled={loading}>
              {loading ? "جارٍ التحقق..." : "دخول"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link to="/" className="text-primary font-semibold hover:underline">العودة للرئيسية</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
