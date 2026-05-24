import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Award, Trophy, GraduationCap, IdCard } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/trainer/$membershipNumber")({
  head: () => ({ meta: [{ title: "صفحة المدرب — SDMATH" }] }),
  component: TrainerProfilePage,
});

function TrainerProfilePage() {
  const { membershipNumber } = Route.useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("trainers")
        .select("full_name,membership_number,residence,profile_image_url,training_levels,achievements,awards,profile_visibility,years_experience,students_trained,competitions")
        .eq("membership_number", membershipNumber)
        .eq("profile_visibility", "approved")
        .maybeSingle();
      setTrainer(data);
      setLoading(false);
    })();
  }, [membershipNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Header />
        <div className="flex items-center justify-center py-32 px-4">
          <div className="max-w-md text-center">
            <h1 className="text-7xl font-bold text-primary">404</h1>
            <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              صفحة المدرب غير متاحة أو لم يتم اعتمادها بعد.
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  const levels = trainer.training_levels
    ? trainer.training_levels.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];
  const achievements = trainer.achievements
    ? trainer.achievements.split("\n").filter(Boolean)
    : [];
  const awardsList = trainer.awards
    ? trainer.awards.split("\n").filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />

      <main className="container mx-auto px-4 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          {/* Hero Card */}
          <div className="card-premium overflow-hidden">
            {/* Top gradient banner */}
            <div className="h-32 sm:h-40 bg-gradient-hero relative">
              <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
              {/* Decorative circles */}
              <div className="pointer-events-none absolute -top-8 -left-8 w-32 h-32 rounded-full bg-primary-foreground/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-4 right-12 w-24 h-24 rounded-full bg-primary-foreground/8 blur-xl" />
            </div>

            {/* Profile content */}
            <div className="px-6 sm:px-8 pb-8 -mt-16 relative">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-card shadow-elegant overflow-hidden bg-muted">
                    {trainer.profile_image_url ? (
                      <img
                        src={trainer.profile_image_url}
                        alt={trainer.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary/40">
                        {trainer.full_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  {/* Verified badge */}
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-success flex items-center justify-center shadow-soft border-2 border-card">
                    <svg className="w-4 h-4 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Name + info */}
                <div className="flex-1 pt-2 sm:pt-4 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{trainer.full_name}</h1>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary px-3 py-1.5 border border-primary/20">
                      <IdCard className="h-3.5 w-3.5" />
                      <span dir="ltr">{trainer.membership_number}</span>
                    </span>
                    {trainer.residence && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground px-3 py-1.5 border border-border">
                        <MapPin className="h-3.5 w-3.5" />
                        {trainer.residence}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Sections */}
          <div className="mt-6 space-y-4">
            {/* Training Levels */}
            {levels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="card-premium p-6 sm:p-7"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-soft">
                    <GraduationCap className="h-4.5 w-4.5" />
                  </div>
                  <h2 className="text-lg font-bold">المستويات التدريبية</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {levels.map((level: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-xl bg-primary/8 text-primary border border-primary/15 px-3.5 py-2 text-sm font-medium"
                    >
                      {level}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Achievements */}
            {achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="card-premium p-6 sm:p-7"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-soft">
                    <Trophy className="h-4.5 w-4.5" />
                  </div>
                  <h2 className="text-lg font-bold">الإنجازات</h2>
                </div>
                <ul className="space-y-2.5">
                  {achievements.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground/85 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Awards & Certificates */}
            {awardsList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="card-premium p-6 sm:p-7"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-soft">
                    <Award className="h-4.5 w-4.5" />
                  </div>
                  <h2 className="text-lg font-bold">الجوائز والشهادات</h2>
                </div>
                <ul className="space-y-2.5">
                  {awardsList.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground/85 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Empty state when no details */}
            {levels.length === 0 && achievements.length === 0 && awardsList.length === 0 && (
              <div className="card-premium p-8 text-center">
                <p className="text-muted-foreground text-sm">لم تُضاف تفاصيل بعد لهذا الملف التعريفي.</p>
              </div>
            )}
          </div>

          {/* Footer branding */}
          <div className="mt-10 text-center">
            <p className="text-xs text-muted-foreground">
              صفحة مدرب معتمدة من منصة <span className="font-semibold text-primary">SDMATH</span>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
