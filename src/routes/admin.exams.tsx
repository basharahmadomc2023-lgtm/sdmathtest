import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Eye, FileText } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/exams")({
  component: () => <AdminGate><ExamsAdmin /></AdminGate>,
});

function ExamsAdmin() {
  const [list, setList] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/exams/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ الرابط");
  };
  const del = async (id: string) => {
    if (!confirm("حذف الاختبار؟")) return;
    await supabase.from("exams").delete().eq("id", id);
    toast.success("تم الحذف");
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-3 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">إدارة الاختبارات</h1>
          <Link to="/admin/exams/new">
            <Button className="rounded-full shadow-soft"><Plus className="ml-1 h-4 w-4" /> إنشاء اختبار</Button>
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card-premium p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center shrink-0 shadow-soft">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base leading-snug truncate">{e.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => copyLink(e.id)}><Copy className="h-3.5 w-3.5 ml-1" /> نسخ الرابط</Button>
                <Link to="/exams/$id" params={{ id: e.id }}><Button size="sm" variant="outline" className="rounded-full"><Eye className="h-3.5 w-3.5 ml-1" /> معاينة</Button></Link>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => del(e.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </motion.div>
          ))}
          {!list.length && <p className="text-muted-foreground col-span-2 text-center py-16">لا توجد اختبارات بعد</p>}
        </div>
      </main>
    </div>
  );
}
