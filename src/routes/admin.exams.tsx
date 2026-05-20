import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Eye, FileText, Pencil, Send, ArchiveRestore } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/exams")({
  component: () => <AdminGate><ExamsAdmin /></AdminGate>,
});

function ExamsAdmin() {
  const navigate = useNavigate();
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
  const togglePublish = async (e: any) => {
    await supabase.from("exams").update({ is_published: !e.is_published }).eq("id", e.id);
    toast.success(!e.is_published ? "تم النشر" : "تم إلغاء النشر");
    load();
  };
  const goNew = () => navigate({ to: "/admin/exams/new" });
  const goEdit = (id: string) => {
    if (typeof window !== "undefined") window.location.href = `/admin/exams/new?id=${id}`;
  };

  const levelLabel = (l: string) => l === "advanced" ? "احترافي" : l === "intermediate" ? "متوسط" : "مبتدئ";

  return (
    <div className="min-h-screen bg-gradient-soft" dir="rtl">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <p className="text-sm text-primary font-medium mb-1">إدارة المحتوى</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">إدارة الاختبارات</h1>
          </div>
          <Button onClick={goNew} className="rounded-full shadow-soft">
            <Plus className="ml-1 h-4 w-4" /> إنشاء اختبار
          </Button>
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
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center shrink-0 shadow-soft">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base leading-snug truncate">{e.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${e.is_published ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
                      {e.is_published ? "منشور" : "مسودة"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{levelLabel(e.level)}</span>
                    <span>•</span>
                    <span>{Math.round((e.total_time ?? 0) / 60)} دقيقة</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => goEdit(e.id)}>
                  <Pencil className="h-3.5 w-3.5 ml-1" /> تعديل
                </Button>
                <Link to="/exams/$id" params={{ id: e.id }}>
                  <Button size="sm" variant="outline" className="rounded-full">
                    <Eye className="h-3.5 w-3.5 ml-1" /> معاينة
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => copyLink(e.id)}>
                  <Copy className="h-3.5 w-3.5 ml-1" /> نسخ الرابط
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => togglePublish(e)}>
                  {e.is_published ? <><ArchiveRestore className="h-3.5 w-3.5 ml-1" /> إلغاء النشر</> : <><Send className="h-3.5 w-3.5 ml-1" /> نشر</>}
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => del(e.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </motion.div>
          ))}
          {!list.length && (
            <div className="col-span-2 text-center py-20 text-muted-foreground border-2 border-dashed rounded-2xl">
              لا توجد اختبارات بعد — ابدأ بإنشاء أول اختبار.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
