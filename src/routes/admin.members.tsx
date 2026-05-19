import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/members")({
  component: () => <AdminGate><Members /></AdminGate>,
});

function Members() {
  const [list, setList] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, status: string) => {
    await supabase.from("members").update({ status }).eq("id", id);
    toast.success("تم التحديث");
    load();
  };
  const del = async (id: string) => {
    if (!confirm("حذف هذا المشترك؟")) return;
    await supabase.from("members").delete().eq("id", id);
    toast.success("تم الحذف");
    load();
  };

  const badge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
      rejected: "bg-rose-100 text-rose-800 border-rose-200",
    };
    const labels: Record<string, string> = { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" };
    return <span className={`text-[11px] rounded-full px-2.5 py-1 border ${map[s]}`}>{labels[s]}</span>;
  };

  const actions = (m: any) => (
    <div className="flex gap-1.5">
      <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => update(m.id, "approved")} title="قبول"><Check className="h-4 w-4 text-emerald-600" /></Button>
      <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => update(m.id, "rejected")} title="رفض"><X className="h-4 w-4 text-rose-600" /></Button>
      <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => del(m.id)} title="حذف"><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">إدارة المشتركين</h1>

        {/* Desktop table */}
        <div className="hidden md:block card-premium overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-right">
                <th className="p-4 font-semibold">الاسم</th>
                <th className="p-4 font-semibold">واتساب</th>
                <th className="p-4 font-semibold">المدرب</th>
                <th className="p-4 font-semibold">رقم العضوية</th>
                <th className="p-4 font-semibold">الحالة</th>
                <th className="p-4 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{m.name}</td>
                  <td className="p-4 text-muted-foreground" dir="ltr">{m.whatsapp}</td>
                  <td className="p-4 text-muted-foreground">{m.coach_name}</td>
                  <td className="p-4 text-muted-foreground" dir="ltr">{m.membership_no}</td>
                  <td className="p-4">{badge(m.status)}</td>
                  <td className="p-4">{actions(m)}</td>
                </tr>
              ))}
              {!list.length && (<tr><td colSpan={6} className="p-12 text-center text-muted-foreground">لا يوجد مشتركين</td></tr>)}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {list.map((m) => (
            <div key={m.id} className="card-premium p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">المدرب: {m.coach_name}</p>
                </div>
                {badge(m.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                <div><span className="text-foreground/60">واتساب: </span><span dir="ltr">{m.whatsapp}</span></div>
                <div><span className="text-foreground/60">عضوية: </span><span dir="ltr">{m.membership_no}</span></div>
              </div>
              {actions(m)}
            </div>
          ))}
          {!list.length && <p className="text-center text-muted-foreground py-12">لا يوجد مشتركين</p>}
        </div>
      </main>
    </div>
  );
}
