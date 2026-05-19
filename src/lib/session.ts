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

export const ADMIN_USERNAME = "SDMATH";
export const ADMIN_PASSWORD = "2386831";
