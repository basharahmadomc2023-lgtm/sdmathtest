// Lightweight client-side session for SDMATH
// Member session = {id, name, membership_no}; Admin session = {isAdmin: true}

export type MemberSession = {
  id: string;
  name: string;
  membership_no: string;
};

const MEMBER_KEY = "sdmath_member";
const ADMIN_KEY = "sdmath_admin";

export const memberSession = {
  get(): MemberSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(MEMBER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(s: MemberSession) {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(s));
  },
  clear() {
    localStorage.removeItem(MEMBER_KEY);
  },
};

export const adminSession = {
  isAdmin(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ADMIN_KEY) === "yes";
  },
  set() {
    localStorage.setItem(ADMIN_KEY, "yes");
  },
  clear() {
    localStorage.removeItem(ADMIN_KEY);
  },
};

export type TrainerSession = {
  id: string;
  full_name: string;
  membership_number: string;
};
const TRAINER_KEY = "sdmath_trainer";
export const trainerSession = {
  get(): TrainerSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(TRAINER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set(s: TrainerSession) { localStorage.setItem(TRAINER_KEY, JSON.stringify(s)); },
  clear() { localStorage.removeItem(TRAINER_KEY); },
};

export const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || "";
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

// Validates Arabic full name with exactly 3 parts
export function isThreePartName(name: string): boolean {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length === 3;
}
export const THREE_PART_NAME_MSG = "يجب إدخال الاسم من ثلاث مقاطع مثل: سليمان خالد دياب";
