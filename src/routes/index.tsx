import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Brain, Trophy, Timer, Sparkles, ArrowLeft, ShieldCheck, BarChart3, Award } from "lucide-react";
import logo from "@/assets/sdmath-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SDMATH — منصة الاختبارات الذكية" },
      { name: "description", content: "منصة SDMATH لتنمية مهارات الحساب الذهني والتفكير والتحليل عبر اختبارات إلكترونية احترافية." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-gradient-soft relative overflow-hidden">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-3xl animate-[blob_18s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 -left-32 w-[24rem] h-[24rem] rounded-full bg-primary-glow/20 blur-3xl animate-[blob_22s_ease-in-out_infinite]" />
      </div>

      <Header />

      <main className="container mx-auto px-4">
        {/* Hero */}
        <section className="py-16 md:py-28 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-card/70 backdrop-blur border border-border px-3.5 py-1.5 text-xs font-medium text-foreground/80 mb-6 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> منصة احترافية للاختبارات الذكية
            </div>
            <h1 className="font-display text-[2.5rem] leading-[1.1] sm:text-5xl md:text-6xl font-black tracking-tight text-balance">
              منصة اختبارات{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">SDMATH</span>{" "}
              الذكية
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl text-pretty">
              تجربة عصرية لتنمية الحساب الذهني والتفكير والتحليل، بتصميم هادئ ودقيق
              يجمع بين البساطة وأعلى معايير الجودة.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="rounded-full shadow-elegant h-12 px-7 text-base">
                  ابدأ الآن <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-full h-12 px-7 text-base">
                  تسجيل الدخول
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> آمن ومشفّر</span>
              <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-primary" /> شهادات معتمدة</span>
              <span className="flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-primary" /> تحليلات دقيقة</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="absolute -inset-8 bg-gradient-hero blur-3xl opacity-25 rounded-full" />
            <div className="relative glass-strong rounded-[2rem] p-10 sm:p-14 shadow-elegant flex items-center justify-center bg-gradient-mesh">
              <motion.img
                src={logo}
                alt="SDMATH"
                className="w-48 sm:w-64 h-auto drop-shadow-[0_18px_40px_rgba(14,124,123,0.25)]"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-12 md:py-16">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-sm font-medium text-primary mb-2">لماذا SDMATH</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-balance">
              تجربة اختبارات بمعايير عالمية
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Brain, title: "تفكير وتحليل", desc: "اختبارات مصممة لتنمية الحساب الذهني والمنطق." },
              { icon: Timer, title: "نظام زمني دقيق", desc: "مؤقت لكل سؤال ومؤقت كلي مع تتبع أدائك." },
              { icon: Trophy, title: "شهادات معتمدة", desc: "شهادات تلقائية مع رمز QR للتحقق الفوري." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="card-premium p-7 sm:p-8 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-hero text-primary-foreground flex items-center justify-center mb-5 shadow-soft group-hover:scale-105 transition-transform">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="py-12 text-center text-xs sm:text-sm text-muted-foreground border-t mt-8">
          © {new Date().getFullYear()} SDMATH — جميع الحقوق محفوظة
        </footer>
      </main>
    </div>
  );
}
