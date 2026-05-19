import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { memberSession, adminSession } from "@/lib/session";
import { LogOut, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Header({ variant = "public" }: { variant?: "public" | "member" | "admin" }) {
  const navigate = useNavigate();
  const [member, setMember] = useState<ReturnType<typeof memberSession.get>>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { setMember(memberSession.get()); }, []);

  const logout = () => {
    if (variant === "admin") { adminSession.clear(); navigate({ to: "/admin/login" }); }
    else { memberSession.clear(); navigate({ to: "/" }); }
  };

  const links = (
    <>
      {variant === "public" && (
        <>
          <Link to="/login" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="rounded-full w-full sm:w-auto">تسجيل الدخول</Button>
          </Link>
          <Link to="/register" onClick={() => setOpen(false)}>
            <Button size="sm" className="rounded-full w-full sm:w-auto shadow-soft">اشترك الآن</Button>
          </Link>
        </>
      )}
      {variant === "member" && (
        <>
          {member && (
            <span className="hidden lg:inline text-sm text-muted-foreground ml-2">
              مرحباً، <span className="text-foreground font-medium">{member.name}</span>
            </span>
          )}
          <Link to="/exams" onClick={() => setOpen(false)}>
            <Button variant="ghost" size="sm" className="rounded-full w-full sm:w-auto">الاختبارات</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={logout} className="rounded-full w-full sm:w-auto">
            <LogOut className="ml-1 h-4 w-4" /> خروج
          </Button>
        </>
      )}
      {variant === "admin" && (
        <>
          <Link to="/admin" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="rounded-full w-full sm:w-auto">الرئيسية</Button></Link>
          <Link to="/admin/members" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="rounded-full w-full sm:w-auto">المشتركين</Button></Link>
          <Link to="/admin/exams" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="rounded-full w-full sm:w-auto">الاختبارات</Button></Link>
          <Link to="/admin/analytics" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="rounded-full w-full sm:w-auto">التحليلات</Button></Link>
          <Button variant="outline" size="sm" onClick={logout} className="rounded-full w-full sm:w-auto">
            <LogOut className="ml-1 h-4 w-4" /> خروج
          </Button>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Logo />
        <nav className="hidden sm:flex items-center gap-1.5">{links}</nav>
        <button
          aria-label="القائمة"
          className="sm:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-border bg-card/60 hover:bg-accent transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="sm:hidden overflow-hidden border-t border-border/60"
          >
            <div className="container mx-auto px-4 py-3 flex flex-col gap-2">{links}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
