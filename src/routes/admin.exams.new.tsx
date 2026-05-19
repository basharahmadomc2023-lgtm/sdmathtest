import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/exams/new")({
  component: () => <AdminGate><NewExam /></AdminGate>,
});

type QDraft = {
  file: File | null;
  preview: string;
  correct_answer: string;
  marks: number;
  time_limit: number;
  group_no: number;
};

function NewExam() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ title: "", description: "", level: "beginner", total_time: 10, allow_back: false });
  const [questions, setQuestions] = useState<QDraft[]>([{ file: null, preview: "", correct_answer: "", marks: 1, time_limit: 30, group_no: 1 }]);
  const [saving, setSaving] = useState(false);

  const update = (i: number, patch: Partial<QDraft>) => {
    setQuestions((qs) => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  };
  const handleFile = (i: number, f: File | null) => {
    if (!f) return;
    update(i, { file: f, preview: URL.createObjectURL(f) });
  };

  const save = async () => {
    if (!meta.title.trim()) return toast.error("أدخل اسم الاختبار");
    if (questions.some((q) => !q.correct_answer.trim())) return toast.error("أدخل الإجابة الصحيحة لكل سؤال");
    setSaving(true);
    const { data: exam, error } = await supabase.from("exams").insert({
      title: meta.title, description: meta.description, level: meta.level,
      total_time: meta.total_time * 60, allow_back: meta.allow_back,
    }).select("id").single();
    if (error || !exam) { setSaving(false); toast.error("فشل الإنشاء"); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let image_url: string | null = null;
      if (q.file) {
        const path = `${exam.id}/${Date.now()}-${i}.${q.file.name.split(".").pop()}`;
        const { data: up, error: upErr } = await supabase.storage.from("exam-images").upload(path, q.file);
        if (!upErr && up) {
          image_url = supabase.storage.from("exam-images").getPublicUrl(up.path).data.publicUrl;
        }
      }
      await supabase.from("questions").insert({
        exam_id: exam.id,
        image_url,
        correct_answer: q.correct_answer.trim(),
        marks: q.marks,
        time_limit: q.time_limit,
        order_no: i + 1,
        group_no: q.group_no,
      });
    }
    setSaving(false);
    toast.success("تم إنشاء الاختبار");
    navigate({ to: "/admin/exams" });
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">إنشاء اختبار جديد</h1>

        <div className="bg-card border rounded-2xl p-6 shadow-soft space-y-4 mb-6">
          <div className="space-y-1.5"><Label>اسم الاختبار</Label><Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>الوصف</Label><Textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>المستوى</Label>
              <Select value={meta.level} onValueChange={(v) => setMeta({ ...meta, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">صعب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>الزمن الكلي (دقيقة)</Label><Input type="number" value={meta.total_time} onChange={(e) => setMeta({ ...meta, total_time: +e.target.value })} /></div>
            <div className="space-y-1.5 flex flex-col">
              <Label>السماح بالرجوع</Label>
              <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={meta.allow_back} onChange={(e) => setMeta({ ...meta, allow_back: e.target.checked })} /> نعم</label>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-3">الأسئلة</h2>
        <div className="space-y-4 mb-6">
          {questions.map((q, i) => (
            <div key={i} className="bg-card border rounded-2xl p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">سؤال {i + 1}</span>
                {questions.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>صورة السؤال</Label>
                  <label className="flex items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-accent transition-colors">
                    {q.preview ? <img src={q.preview} alt="" className="max-h-28" /> : (
                      <div className="text-center text-muted-foreground"><Upload className="h-5 w-5 mx-auto mb-1" /><span className="text-xs">رفع صورة</span></div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(i, e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>الإجابة الصحيحة</Label><Input value={q.correct_answer} onChange={(e) => update(i, { correct_answer: e.target.value })} dir="ltr" /></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5"><Label className="text-xs">العلامات</Label><Input type="number" value={q.marks} onChange={(e) => update(i, { marks: +e.target.value })} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">الزمن (ث)</Label><Input type="number" value={q.time_limit} onChange={(e) => update(i, { time_limit: +e.target.value })} /></div>
                    <div className="space-y-1.5"><Label className="text-xs">المجموعة</Label><Input type="number" min={1} max={3} value={q.group_no} onChange={(e) => update(i, { group_no: +e.target.value })} /></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setQuestions([...questions, { file: null, preview: "", correct_answer: "", marks: 1, time_limit: 30, group_no: 1 }])}>
            <Plus className="ml-1 h-4 w-4" /> إضافة سؤال
          </Button>
          <Button onClick={save} disabled={saving} className="mr-auto">{saving ? "جارٍ الحفظ..." : "حفظ الاختبار"}</Button>
        </div>
      </main>
    </div>
  );
}
