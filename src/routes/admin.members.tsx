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
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" };
    return <span className={`text-xs rounded-full px-2.5 py-1 ${map[s]}`}>{labels[s]}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">إدارة المشتركين</h1>
        <div className="bg-card border rounded-2xl overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-right">
                <th className="p-3">الاسم</th>
                <th className="p-3">واتساب</th>
                <th className="p-3">المدرب</th>
                <th className="p-3">رقم العضوية</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3" dir="ltr">{m.whatsapp}</td>
                  <td className="p-3">{m.coach_name}</td>
                  <td className="p-3" dir="ltr">{m.membership_no}</td>
                  <td className="p-3">{badge(m.status)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => update(m.id, "approved")}><Check className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => update(m.id, "rejected")}><X className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => del(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length && (<tr><td colSpan={6} className="p-8 text-center text-muted-foreground">لا يوجد مشتركين</td></tr>)}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
