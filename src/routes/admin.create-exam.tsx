import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { AdminGate } from "@/components/AdminGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Save, ArrowRight, Image as ImageIcon, Type, FileText, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

export const Route = createFileRoute("/admin/create-exam")({
  component: () => <AdminGate><CreateExamPage /></AdminGate>,
});

type Level = "beginner" | "intermediate" | "advanced";
type Mode = "image" | "text";

type QDraft = {
  localId: string;
  mode: Mode;
  file: File | null;
  preview: string;
  question_text: string;
  correct_answer: string;
  marks: number;
  time_limit: number;
  level: Level;
};

type GroupDraft = {
  no: number;
  name: string;
  questions: QDraft[];
};

const levelLabel: Record<Level, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "احترافي",
};

const examSchema = z.object({
  stage: z.string().trim().min(2, { message: "يجب أن تحتوي المرحلة التدريبية على حرفين على الأقل" }).max(120),
  title: z.string().trim().min(3, { message: "يجب أن يحتوي اسم الاختبار على 3 أحرف على الأقل" }).max(120),
  total_marks: z.number().min(1, { message: "العلامة الكلية يجب أن تكون 1 على الأقل" }).max(10000),
  total_time: z.number().min(1, { message: "الزمن الكلي يجب أن يكون دقيقة واحدة على الأقل" }).max(600),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

const uid = () => Math.random().toString(36).slice(2, 10);

function CreateExamPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({
    stage: "",
    title: "",
    total_marks: 10,
    total_time: 10,
    level: "beginner" as Level,
  });
  const [groups, setGroups] = useState<GroupDraft[]>([
    { no: 1, name: "المجموعة الأولى", questions: [] },
  ]);

  const addGroup = () => {
    const no = (groups[groups.length - 1]?.no ?? 0) + 1;
    setGroups((g) => [...g, { no, name: `المجموعة ${no}`, questions: [] }]);
    toast.success("تمت إضافة مجموعة أسئلة جديدة");
  };
  const updateGroup = (i: number, patch: Partial<GroupDraft>) => {
    setGroups((g) => g.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  };
  const deleteGroup = (i: number) => {
    if (!confirm("حذف المجموعة وجميع أسئلتها؟")) return;
    setGroups((g) => g.filter((_, idx) => idx !== i));
  };
  const saveGroup = () => toast.success("تم حفظ المجموعة محلياً");

  const addQuestion = (gi: number) => {
    setGroups((g) => g.map((x, idx) => {
      if (idx !== gi) return x;
      return {
        ...x, questions: [...x.questions, {
          localId: uid(), mode: "text", file: null, preview: "",
          question_text: "", correct_answer: "", marks: 1, time_limit: 30,
          level: "beginner" as Level,
        }],
      };
    }));
  };
  const updateQ = (gi: number, qi: number, patch: Partial<QDraft>) => {
    setGroups((g) => g.map((x, idx) => idx !== gi ? x : {
      ...x, questions: x.questions.map((q, qIdx) => qIdx !== qi ? q : { ...q, ...patch }),
    }));
  };
  const deleteQ = (gi: number, qi: number) => {
    setGroups((g) => g.map((x, idx) => idx !== gi ? x : {
      ...x, questions: x.questions.filter((_, qIdx) => qIdx !== qi),
    }));
  };
  const handleFile = (gi: number, qi: number, f: File | null) => {
    if (!f) return;
    updateQ(gi, qi, { file: f, preview: URL.createObjectURL(f) });
  };

  const validate = (requireQuestions: boolean) => {
    const parsed = examSchema.safeParse({
      stage: meta.stage, title: meta.title, total_marks: meta.total_marks,
      total_time: meta.total_time, level: meta.level,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return false; }
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

  const persist = async (publish: boolean) => {
    if (!validate(publish)) return;
    setLoading(true);
    try {
      const groupsMeta = groups.map((g) => ({ no: g.no, name: g.name, max_time: meta.total_time * 60 }));
      const fullTitle = meta.stage ? `${meta.stage} - ${meta.title}` : meta.title;
      const { data: ex, error } = await supabase.from("exams").insert({
        title: fullTitle,
        description: meta.stage,
        level: meta.level,
        total_time: meta.total_time * 60,
        total_marks: meta.total_marks,
        allow_back: false,
        is_published: publish,
        groups: groupsMeta as any,
      }).select("id").single();
      if (error || !ex) throw error ?? new Error("فشل الإنشاء");
      const examId = ex.id;

      let order = 1;
      for (const g of groups) {
        for (let qi = 0; qi < g.questions.length; qi++) {
          const q = g.questions[qi];
          let image_url: string | null = null;
          if (q.mode === "image" && q.file) {
            const ext = q.file.name.split(".").pop() ?? "png";
            const path = `${examId}/${Date.now()}-${g.no}-${qi}.${ext}`;
            const { data: up, error: upErr } = await supabase.storage.from("exam-images").upload(path, q.file, { upsert: true });
            if (!upErr && up) image_url = supabase.storage.from("exam-images").getPublicUrl(up.path).data.publicUrl;
          }
          await supabase.from("questions").insert({
            exam_id: examId,
            image_url,
            question_text: q.mode === "text" ? q.question_text.trim() : null,
            correct_answer: q.correct_answer.trim(),
            marks: q.marks,
            time_limit: q.time_limit,
            order_no: order++,
            group_no: g.no,
            level: q.level,
          } as any);
        }
      }

      toast.success(publish ? "تم نشر الاختبار" : "تم حفظ الأسئلة كمسودة");
      navigate({ to: "/admin/exams" });
    } catch (e: any) {
      toast.error(e?.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft" dir="rtl">
      <Header variant="admin" />
      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link to="/admin" className="hover:text-primary inline-flex items-center gap-1">
              <ArrowRight className="h-4 w-4" /> لوحة التحكم
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">صفحة الاختبار</h1>
          <p className="text-muted-foreground mt-1.5">إنشاء اختبار جديد، مع مجموعات أسئلة ومستويات.</p>
        </motion.div>

        {/* Exam meta */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="card-premium p-6 sm:p-7 space-y-5 mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-soft">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold">معلومات الاختبار</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>المرحلة التدريبية</Label>
              <Input value={meta.stage} onChange={(e) => setMeta({ ...meta, stage: e.target.value })} placeholder="مثال: المرحلة الأولى" />
            </div>
            <div className="space-y-1.5">
              <Label>اسم الاختبار</Label>
              <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="مثال: اختبار الجمع السريع" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>العلامة الكلية للاختبار</Label>
              <Input type="number" min={1} value={meta.total_marks}
                onChange={(e) => setMeta({ ...meta, total_marks: Math.max(1, +e.target.value || 0) })} />
            </div>
            <div className="space-y-1.5">
              <Label>الزمن الكلي (دقيقة)</Label>
              <Input type="number" min={1} value={meta.total_time}
                onChange={(e) => setMeta({ ...meta, total_time: Math.max(1, +e.target.value || 0) })} />
            </div>
            <div className="space-y-1.5">
              <Label>المستوى التدريبي للاختبار</Label>
              <Select value={meta.level} onValueChange={(v: Level) => setMeta({ ...meta, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">احترافي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-sm">
            <p className="font-medium text-primary mb-1">ملاحظة تظهر أمام المشتركين</p>
            <p className="text-muted-foreground">اختر مستوى التدريب المناسب لك: مبتدئ / متوسط / احترافي. سيتم عرض الأسئلة المطابقة للمستوى الذي تختاره فقط.</p>
          </div>
        </motion.div>

        {/* Groups header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">إنشاء مجموعة الأسئلة</h2>
          <Button onClick={addGroup} className="rounded-full shadow-soft">
            <Plus className="ml-1 h-4 w-4" /> إنشاء مجموعة أسئلة جديدة
          </Button>
        </div>

        <div className="space-y-5 mb-8">
          <AnimatePresence initial={false}>
            {groups.map((g, gi) => (
              <motion.div key={g.no} layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="card-premium p-5 sm:p-6">
                <div className="flex flex-wrap items-end gap-3 mb-4">
                  <div className="flex-1 min-w-[200px] space-y-1.5">
                    <Label className="text-xs">اسم المجموعة</Label>
                    <Input value={g.name} onChange={(e) => updateGroup(gi, { name: e.target.value })} />
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="rounded-full" onClick={saveGroup}>
                      <Save className="h-3.5 w-3.5 ml-1" /> حفظ المجموعة
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full text-destructive hover:text-destructive" onClick={() => deleteGroup(gi)}>
                      <Trash2 className="h-3.5 w-3.5 ml-1" /> حذف المجموعة
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {g.questions.map((q, qi) => (
                    <motion.div key={q.localId} layout
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border bg-background/60 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold">سؤال {qi + 1}</span>
                        <Button size="sm" variant="ghost" className="rounded-full" onClick={() => deleteQ(gi, qi)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>

                      <Label className="text-xs mb-1.5 block">طريقة إدخال السؤال</Label>
                      <div className="flex gap-2 mb-3">
                        <button type="button" onClick={() => updateQ(gi, qi, { mode: "text" })}
                          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 ${q.mode === "text" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                          <Type className="h-3.5 w-3.5" /> كتابة سؤال
                        </button>
                        <button type="button" onClick={() => updateQ(gi, qi, { mode: "image" })}
                          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 ${q.mode === "image" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                          <ImageIcon className="h-3.5 w-3.5" /> تحميل صورة
                        </button>
                      </div>

                      {q.mode === "text" ? (
                        <div className="space-y-1.5 mb-3">
                          <Label className="text-xs">نص السؤال</Label>
                          <textarea rows={3} value={q.question_text}
                            onChange={(e) => updateQ(gi, qi, { question_text: e.target.value })}
                            placeholder="اكتب نص السؤال..."
                            className="w-full rounded-xl border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                      ) : (
                        <div className="space-y-1.5 mb-3">
                          <Label className="text-xs">تحميل صورة السؤال</Label>
                          <label className="flex items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-accent transition-colors">
                            {q.preview ? <img src={q.preview} alt="" className="max-h-28 rounded" /> : (
                              <div className="text-center text-muted-foreground">
                                <Upload className="h-5 w-5 mx-auto mb-1" />
                                <span className="text-xs">انقر لرفع الصورة</span>
                              </div>
                            )}
                            <input type="file" accept="image/*" className="hidden"
                              onChange={(e) => handleFile(gi, qi, e.target.files?.[0] ?? null)} />
                          </label>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">الإجابة الصحيحة</Label>
                          <Input value={q.correct_answer} dir="ltr"
                            onChange={(e) => updateQ(gi, qi, { correct_answer: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">علامة السؤال</Label>
                          <Input type="number" min={1} value={q.marks}
                            onChange={(e) => updateQ(gi, qi, { marks: Math.max(1, +e.target.value || 0) })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">زمن السؤال (ث)</Label>
                          <Input type="number" min={1} value={q.time_limit}
                            onChange={(e) => updateQ(gi, qi, { time_limit: Math.max(1, +e.target.value || 0) })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">مستوى السؤال</Label>
                          <Select value={q.level} onValueChange={(v: Level) => updateQ(gi, qi, { level: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">مبتدئ</SelectItem>
                              <SelectItem value="intermediate">متوسط</SelectItem>
                              <SelectItem value="advanced">احترافي</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl border-dashed" onClick={() => addQuestion(gi)}>
                      <Plus className="ml-1 h-4 w-4" /> {g.questions.length ? "إنشاء سؤال آخر" : "إضافة سؤال جديد"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button variant="outline" className="w-full rounded-xl border-dashed" onClick={addGroup}>
            <Plus className="ml-1 h-4 w-4" /> إنشاء مجموعة أسئلة أخرى
          </Button>
        </div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="card-premium p-5 sticky bottom-4 flex flex-wrap gap-2 justify-end">
          <Link to="/admin">
            <Button variant="ghost" className="rounded-full">
              <ArrowRight className="ml-1 h-4 w-4" /> رجوع
            </Button>
          </Link>
          <Button variant="outline" className="rounded-full" onClick={() => persist(false)} disabled={loading}>
            <Save className="ml-1 h-4 w-4" /> حفظ الأسئلة
          </Button>
          <Button className="rounded-full shadow-soft" onClick={() => persist(true)} disabled={loading}>
            <Send className="ml-1 h-4 w-4" /> {loading ? "جارٍ الحفظ..." : "نشر الأسئلة"}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
