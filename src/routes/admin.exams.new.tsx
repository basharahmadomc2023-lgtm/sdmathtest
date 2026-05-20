import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Save, Eye, ArrowRight, Image as ImageIcon, Type, GripVertical, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

export const Route = createFileRoute("/admin/exams/new")({
  component: () => <AdminGate><NewExam /></AdminGate>,
});

type Mode = "image" | "text";
type QDraft = {
  localId: string;
  mode: Mode;
  file: File | null;
  preview: string;
  image_url?: string | null;
  question_text: string;
  correct_answer: string;
  marks: number;
  time_limit: number;
  order_no: number;
  group_no: number;
  savedDbId?: string;
};
type GroupDraft = {
  no: number;
  name: string;
  max_time: number;
  questions: QDraft[];
  collapsed?: boolean;
};

const levelInfo: Record<string, string> = {
  beginner: "مبتدئ: المعدل النهائي أقل من 80",
  intermediate: "متوسط: المعدل النهائي أقل من 90",
  advanced: "احترافي: المعدل النهائي أقل من 100",
};

const examSchema = z.object({
  title: z.string().trim().min(3, { message: "يجب أن يحتوي اسم المرحلة على 3 أحرف على الأقل" }).max(120),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  total_time: z.number().min(1, { message: "الزمن الكلي يجب أن يكون دقيقة واحدة على الأقل" }).max(600),
});

const uid = () => Math.random().toString(36).slice(2, 10);

function NewExam() {
  const navigate = useNavigate();
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({
    title: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    total_time: 10,
    is_published: false,
  });
  const [groups, setGroups] = useState<GroupDraft[]>([
    { no: 1, name: "المجموعة الأولى", max_time: 300, questions: [] },
  ]);

  // Detect edit mode via ?id=
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    setEditId(id);
    setLoading(true);
    (async () => {
      const { data: exam } = await supabase.from("exams").select("*").eq("id", id).single();
      if (!exam) { setLoading(false); return; }
      const { data: qs } = await supabase.from("questions").select("*").eq("exam_id", id).order("group_no").order("order_no");
      setMeta({
        title: exam.title,
        level: (exam.level as any) ?? "beginner",
        total_time: Math.round((exam.total_time ?? 600) / 60),
        is_published: !!exam.is_published,
      });
      const groupsMeta = Array.isArray((exam as any).groups) ? (exam as any).groups : [];
      const byGroup = new Map<number, QDraft[]>();
      (qs ?? []).forEach((q: any) => {
        const draft: QDraft = {
          localId: uid(),
          mode: q.image_url ? "image" : "text",
          file: null,
          preview: q.image_url ?? "",
          image_url: q.image_url,
          question_text: q.question_text ?? "",
          correct_answer: q.correct_answer,
          marks: q.marks,
          time_limit: q.time_limit,
          order_no: q.order_no,
          group_no: q.group_no,
          savedDbId: q.id,
        };
        const arr = byGroup.get(q.group_no) ?? [];
        arr.push(draft);
        byGroup.set(q.group_no, arr);
      });
      const groupNos = Array.from(new Set([...(groupsMeta.map((g: any) => g.no) as number[]), ...byGroup.keys()])).sort((a, b) => a - b);
      const rebuilt: GroupDraft[] = (groupNos.length ? groupNos : [1]).map((no) => {
        const m = groupsMeta.find((g: any) => g.no === no);
        return {
          no,
          name: m?.name ?? `المجموعة ${no}`,
          max_time: m?.max_time ?? 300,
          questions: byGroup.get(no) ?? [],
        };
      });
      setGroups(rebuilt);
      setLoading(false);
    })();
  }, []);

  const addGroup = () => {
    const no = (groups[groups.length - 1]?.no ?? 0) + 1;
    setGroups((g) => [...g, { no, name: `المجموعة ${no}`, max_time: 300, questions: [] }]);
    toast.success("تمت إضافة مجموعة جديدة");
  };
  const updateGroup = (i: number, patch: Partial<GroupDraft>) => {
    setGroups((g) => g.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  };
  const deleteGroup = (i: number) => {
    if (!confirm("حذف المجموعة وجميع أسئلتها؟")) return;
    setGroups((g) => g.filter((_, idx) => idx !== i));
  };

  const addQuestion = (gi: number) => {
    setGroups((g) => g.map((x, idx) => {
      if (idx !== gi) return x;
      const order_no = x.questions.length + 1;
      return {
        ...x, questions: [...x.questions, {
          localId: uid(), mode: "image", file: null, preview: "",
          question_text: "", correct_answer: "", marks: 1, time_limit: 30,
          order_no, group_no: x.no,
        }]
      };
    }));
  };
  const updateQ = (gi: number, qi: number, patch: Partial<QDraft>) => {
    setGroups((g) => g.map((x, idx) => idx !== gi ? x : {
      ...x, questions: x.questions.map((q, qIdx) => qIdx !== qi ? q : { ...q, ...patch })
    }));
  };
  const deleteQ = (gi: number, qi: number) => {
    setGroups((g) => g.map((x, idx) => idx !== gi ? x : {
      ...x, questions: x.questions.filter((_, qIdx) => qIdx !== qi).map((q, i) => ({ ...q, order_no: i + 1 }))
    }));
  };
  const handleFile = (gi: number, qi: number, f: File | null) => {
    if (!f) return;
    updateQ(gi, qi, { file: f, preview: URL.createObjectURL(f) });
  };

  const validate = (requireQuestions: boolean) => {
    const parsed = examSchema.safeParse({ title: meta.title, level: meta.level, total_time: meta.total_time });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return false;
    }
    if (!groups.length) { toast.error("أضف مجموعة أسئلة واحدة على الأقل"); return false; }
    if (requireQuestions) {
      const total = groups.reduce((a, g) => a + g.questions.length, 0);
      if (!total) { toast.error("أضف سؤالًا واحدًا على الأقل قبل النشر"); return false; }
      for (const g of groups) {
        for (const q of g.questions) {
          if (q.mode === "image" && !q.preview) { toast.error(`صورة مفقودة في ${g.name}`); return false; }
          if (q.mode === "text" && !q.question_text.trim()) { toast.error(`نص السؤال مفقود في ${g.name}`); return false; }
          if (!q.correct_answer.trim()) { toast.error(`الإجابة الصحيحة مفقودة في ${g.name}`); return false; }
        }
      }
    }
    return true;
  };

  const persist = async (publishOverride?: boolean) => {
    const willPublish = publishOverride ?? meta.is_published;
    if (!validate(willPublish)) return;
    setLoading(true);
    try {
      const groupsMeta = groups.map((g) => ({ no: g.no, name: g.name, max_time: g.max_time }));
      let examId = editId;
      if (examId) {
        const { error } = await supabase.from("exams").update({
          title: meta.title, level: meta.level, total_time: meta.total_time * 60,
          is_published: willPublish, groups: groupsMeta as any,
        }).eq("id", examId);
        if (error) throw error;
      } else {
        const { data: ex, error } = await supabase.from("exams").insert({
          title: meta.title, description: null, level: meta.level,
          total_time: meta.total_time * 60, allow_back: false,
          is_published: willPublish, groups: groupsMeta as any,
        }).select("id").single();
        if (error || !ex) throw error ?? new Error("فشل الإنشاء");
        examId = ex.id;
      }

      // Sync questions: delete old then insert
      if (editId) await supabase.from("questions").delete().eq("exam_id", examId!);

      for (const g of groups) {
        for (let qi = 0; qi < g.questions.length; qi++) {
          const q = g.questions[qi];
          let image_url: string | null = q.image_url ?? null;
          if (q.mode === "image" && q.file) {
            const ext = q.file.name.split(".").pop() ?? "png";
            const path = `${examId}/${Date.now()}-${g.no}-${qi}.${ext}`;
            const { data: up, error: upErr } = await supabase.storage.from("exam-images").upload(path, q.file, { upsert: true });
            if (!upErr && up) image_url = supabase.storage.from("exam-images").getPublicUrl(up.path).data.publicUrl;
          }
          if (q.mode === "text") image_url = null;
          await supabase.from("questions").insert({
            exam_id: examId!,
            image_url,
            question_text: q.mode === "text" ? q.question_text.trim() : null,
            correct_answer: q.correct_answer.trim(),
            marks: q.marks,
            time_limit: q.time_limit,
            order_no: q.order_no,
            group_no: q.group_no,
          });
        }
      }

      setMeta((m) => ({ ...m, is_published: willPublish }));
      toast.success(willPublish ? "تم نشر الاختبار" : "تم حفظ الاختبار");
      navigate({ to: "/admin/exams" });
    } catch (e: any) {
      toast.error(e?.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const previewExam = () => {
    if (!editId) return toast.info("احفظ الاختبار أولًا لمعاينته");
    window.open(`/exams/${editId}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-soft" dir="rtl">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/admin/exams" className="hover:text-primary inline-flex items-center gap-1">
              <ArrowRight className="h-4 w-4" /> إدارة الاختبارات
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {editId ? "تعديل الاختبار" : "إنشاء اختبار جديد"}
          </h1>
          <p className="text-muted-foreground mt-1.5">قم بتعريف المرحلة، المستوى، الزمن، ومجموعات الأسئلة.</p>
        </motion.div>

        {/* Exam meta */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card-premium p-6 sm:p-7 space-y-5 mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-soft">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">معلومات الاختبار</h2>
          </div>

          <div className="space-y-1.5">
            <Label>اسم المرحلة التدريبية</Label>
            <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="مثال: المرحلة الأولى - الجمع السريع" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>المستوى</Label>
              <Select value={meta.level} onValueChange={(v: any) => setMeta({ ...meta, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">احترافي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الزمن الكلي للاختبار (دقيقة)</Label>
              <Input type="number" min={1} value={meta.total_time}
                onChange={(e) => setMeta({ ...meta, total_time: Math.max(1, +e.target.value || 0) })} />
            </div>
          </div>

          <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-sm space-y-1.5">
            <p className="font-medium text-primary">ملاحظة المستوى</p>
            <p className="text-muted-foreground">يتم تحديد المعدل النهائي بناءً على الزمن وعدد الإجابات الصحيحة والمستوى المختار.</p>
            <ul className="space-y-0.5 text-muted-foreground/90 mt-2">
              {Object.values(levelInfo).map((l) => <li key={l} className="text-xs">• {l}</li>)}
            </ul>
          </div>

          <div className="space-y-1.5">
            <Label>حالة الاختبار</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMeta({ ...meta, is_published: false })}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${!meta.is_published ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
              >مسودة</button>
              <button
                type="button"
                onClick={() => setMeta({ ...meta, is_published: true })}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${meta.is_published ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
              >منشور</button>
            </div>
          </div>
        </motion.div>

        {/* Groups */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">مجموعات الأسئلة</h2>
          <Button onClick={addGroup} className="rounded-full shadow-soft">
            <Plus className="ml-1 h-4 w-4" /> إنشاء مجموعة أسئلة
          </Button>
        </div>

        <div className="space-y-5 mb-8">
          <AnimatePresence initial={false}>
            {groups.map((g, gi) => (
              <motion.div
                key={g.no}
                layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="card-premium p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-end gap-3 mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    <span className="text-xs font-medium">#{g.no}</span>
                  </div>
                  <div className="flex-1 min-w-[180px] space-y-1.5">
                    <Label className="text-xs">اسم المجموعة</Label>
                    <Input value={g.name} onChange={(e) => updateGroup(gi, { name: e.target.value })} />
                  </div>
                  <div className="w-32 space-y-1.5">
                    <Label className="text-xs">الزمن الأعلى (ث)</Label>
                    <Input type="number" min={1} value={g.max_time}
                      onChange={(e) => updateGroup(gi, { max_time: Math.max(1, +e.target.value || 0) })} />
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="rounded-full"
                      onClick={() => toast.success("تم حفظ المجموعة محلياً")}>
                      <Save className="h-3.5 w-3.5 ml-1" /> حفظ
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => deleteGroup(gi)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {g.questions.map((q, qi) => (
                    <motion.div
                      key={q.localId} layout
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border bg-background/60 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">سؤال {qi + 1}</span>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="ghost" className="rounded-full"
                            onClick={() => toast.success("تم حفظ السؤال محلياً")}>
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-full"
                            onClick={() => deleteQ(gi, qi)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-3">
                        <button type="button"
                          onClick={() => updateQ(gi, qi, { mode: "image" })}
                          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 ${q.mode === "image" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                          <ImageIcon className="h-3.5 w-3.5" /> رفع صورة
                        </button>
                        <button type="button"
                          onClick={() => updateQ(gi, qi, { mode: "text" })}
                          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 ${q.mode === "text" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                          <Type className="h-3.5 w-3.5" /> كتابة نص
                        </button>
                      </div>

                      {q.mode === "image" ? (
                        <label className="flex items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-accent transition-colors mb-3">
                          {q.preview ? <img src={q.preview} alt="" className="max-h-28 rounded" /> : (
                            <div className="text-center text-muted-foreground">
                              <Upload className="h-5 w-5 mx-auto mb-1" />
                              <span className="text-xs">انقر لرفع الصورة</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => handleFile(gi, qi, e.target.files?.[0] ?? null)} />
                        </label>
                      ) : (
                        <textarea
                          rows={3}
                          value={q.question_text}
                          onChange={(e) => updateQ(gi, qi, { question_text: e.target.value })}
                          placeholder="اكتب نص السؤال..."
                          className="w-full rounded-xl border bg-transparent p-3 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">الإجابة الصحيحة</Label>
                          <Input value={q.correct_answer} dir="ltr"
                            onChange={(e) => updateQ(gi, qi, { correct_answer: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">العلامة</Label>
                          <Input type="number" min={1} value={q.marks}
                            onChange={(e) => updateQ(gi, qi, { marks: Math.max(1, +e.target.value || 0) })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">الزمن (ث)</Label>
                          <Input type="number" min={1} value={q.time_limit}
                            onChange={(e) => updateQ(gi, qi, { time_limit: Math.max(1, +e.target.value || 0) })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">الترتيب</Label>
                          <Input type="number" min={1} value={q.order_no}
                            onChange={(e) => updateQ(gi, qi, { order_no: Math.max(1, +e.target.value || 0) })} />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <Button variant="outline" className="w-full rounded-xl border-dashed" onClick={() => addQuestion(gi)}>
                    <Plus className="ml-1 h-4 w-4" /> إضافة سؤال
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!groups.length && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
              لم تتم إضافة أي مجموعة بعد
            </div>
          )}
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="card-premium p-5 sticky bottom-4 flex flex-wrap gap-2 justify-end"
        >
          <Link to="/admin/exams">
            <Button variant="ghost" className="rounded-full">
              <ArrowRight className="ml-1 h-4 w-4" /> الرجوع لإدارة الاختبارات
            </Button>
          </Link>
          <Button variant="outline" className="rounded-full" onClick={previewExam} disabled={!editId}>
            <Eye className="ml-1 h-4 w-4" /> معاينة الاختبار
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => persist(false)} disabled={loading}>
            <Save className="ml-1 h-4 w-4" /> حفظ كمسودة
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => persist(meta.is_published)} disabled={loading}>
            <Save className="ml-1 h-4 w-4" /> حفظ الاختبار
          </Button>
          <Button className="rounded-full shadow-soft" onClick={() => persist(true)} disabled={loading}>
            {loading ? "جارٍ الحفظ..." : "نشر الاختبار"}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
