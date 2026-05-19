import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { memberSession, adminSession } from "@/lib/session";
import { LogOut } from "lucide-react";

export function Header({ variant = "public" }: { variant?: "public" | "member" | "admin" }) {
  const navigate = useNavigate();
  const [member, setMember] = useState<ReturnType<typeof memberSession.get>>(null);
  useEffect(() => {
    setMember(memberSession.get());
  }, []);

  const logout = () => {
    if (variant === "admin") {
      adminSession.clear();
      navigate({ to: "/admin/login" });
    } else {
      memberSession.clear();
      navigate({ to: "/" });
    }
  };

  return (
    <header className="sticky top-0 z-50 glass border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          {variant === "public" && (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">تسجيل الدخول</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">اشترك الآن</Button>
              </Link>
            </>
          )}
          {variant === "member" && (
            <>
              {member && (
                <span className="hidden sm:inline text-sm text-muted-foreground ml-2">
                  مرحباً، {member.name}
                </span>
              )}
              <Link to="/exams">
                <Button variant="ghost" size="sm">الاختبارات</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="ml-1 h-4 w-4" />
                خروج
              </Button>
            </>
          )}
          {variant === "admin" && (
            <>
              <Link to="/admin"><Button variant="ghost" size="sm">الرئيسية</Button></Link>
              <Link to="/admin/members"><Button variant="ghost" size="sm">المشتركين</Button></Link>
              <Link to="/admin/exams"><Button variant="ghost" size="sm">الاختبارات</Button></Link>
              <Link to="/admin/analytics"><Button variant="ghost" size="sm">التحليلات</Button></Link>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="ml-1 h-4 w-4" /> خروج
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
