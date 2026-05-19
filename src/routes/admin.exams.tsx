import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Eye } from "lucide-react";

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
      <main className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">إدارة الاختبارات</h1>
          <Link to="/admin/exams/new"><Button><Plus className="ml-1 h-4 w-4" /> إنشاء اختبار</Button></Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((e) => (
            <div key={e.id} className="bg-card border rounded-2xl p-5 shadow-soft">
              <h3 className="font-bold text-lg mb-1">{e.title}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{e.description}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => copyLink(e.id)}><Copy className="h-4 w-4 ml-1" /> نسخ الرابط</Button>
                <Link to="/exams/$id" params={{ id: e.id }}><Button size="sm" variant="outline"><Eye className="h-4 w-4 ml-1" /> معاينة</Button></Link>
                <Button size="sm" variant="outline" onClick={() => del(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
          {!list.length && <p className="text-muted-foreground col-span-2 text-center py-12">لا توجد اختبارات بعد</p>}
        </div>
      </main>
    </div>
  );
}
