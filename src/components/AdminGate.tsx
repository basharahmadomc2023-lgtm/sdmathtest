import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { adminSession } from "@/lib/session";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!adminSession.isAdmin()) navigate({ to: "/admin/login" });
    else setOk(true);
  }, [navigate]);
  if (!ok) return null;
  return <>{children}</>;
}
