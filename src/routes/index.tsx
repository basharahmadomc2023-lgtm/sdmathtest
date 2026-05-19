import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Brain, Trophy, Timer, Sparkles } from "lucide-react";
import logo from "@/assets/sdmath-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SDMATH — منصة الاختبارات الذكية" },
      { name: "description", content: "منصة SDMATH لتنمية مهارات الحساب الذهني والتفكير والتحليل." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />

      <main className="container mx-auto px-4">
        {/* Hero */}
        <section className="py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm text-accent-foreground mb-6">
              <Sparkles className="h-4 w-4" /> منصة احترافية للاختبارات الذكية
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
              منصة اختبارات{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">SDMATH</span>{" "}
              الذكية
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              منصة متطورة لتنمية مهارات الحساب الذهني والتفكير والتحليل بأسلوب عصري
              يجمع بين البساطة والاحتراف.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="shadow-elegant">الاشتراك</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">تسجيل الدخول</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-hero blur-3xl opacity-20 rounded-full" />
            <div className="relative glass rounded-3xl p-12 shadow-elegant flex items-center justify-center">
              <img src={logo} alt="SDMATH logo" className="w-64 h-auto" />
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-16 grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "تفكير وتحليل", desc: "اختبارات مصممة لتنمية الحساب الذهني والمنطق." },
            { icon: Timer, title: "نظام زمني دقيق", desc: "مؤقت لكل سؤال ومؤقت كلي مع تتبع أدائك." },
            { icon: Trophy, title: "شهادات معتمدة", desc: "شهادات تلقائية مع رمز QR للتحقق." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card rounded-2xl p-8 shadow-soft border"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        <footer className="py-12 text-center text-sm text-muted-foreground border-t mt-8">
          © {new Date().getFullYear()} SDMATH — جميع الحقوق محفوظة
        </footer>
      </main>
    </div>
  );
}
