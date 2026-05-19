import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";
import { ADMIN_USERNAME, ADMIN_PASSWORD, adminSession } from "@/lib/session";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
      adminSession.set();
      toast.success("مرحباً بك في لوحة التحكم");
      navigate({ to: "/admin" });
    } else {
      toast.error("بيانات الدخول غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-3xl p-8 shadow-elegant">
          <div className="w-14 h-14 rounded-2xl bg-gradient-hero text-primary-foreground flex items-center justify-center mb-4">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold mb-2">دخول الإدارة</h1>
          <p className="text-sm text-muted-foreground mb-6">للوصول إلى لوحة التحكم.</p>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم المستخدم</Label>
              <Input value={u} onChange={(e) => setU(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>كلمة المرور</Label>
              <Input type="password" value={p} onChange={(e) => setP(e.target.value)} dir="ltr" />
            </div>
            <Button type="submit" className="w-full" size="lg">دخول</Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
