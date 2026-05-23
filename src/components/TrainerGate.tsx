import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { trainerSession } from "@/lib/session";

export function TrainerGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!trainerSession.get()) navigate({ to: "/trainer-login" });
    else setOk(true);
  }, [navigate]);
  if (!ok) return null;
  return <>{children}</>;
}
