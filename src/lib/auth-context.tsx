"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { supabaseInstructor, supabaseStudent, getSupabase } from "./supabase";

type UserRole = "org_admin" | "instructor" | "student";

interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email: string | null;
  phone: string | null;
  org_id: string | null;
}

interface AuthState {
  profile: Profile | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  profile: null,
  isLoading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const isStudentPath = pathname?.startsWith("/student");
  const client = isStudentPath ? supabaseStudent : supabaseInstructor;

  const fetchProfile = useCallback(
    async (authUserId: string) => {
      const { data, error } = await client
        .from("profiles")
        .select("id, role, name, email, phone, org_id")
        .eq("auth_user_id", authUserId)
        .single();

      if (error || !data) {
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
      setIsLoading(false);
    },
    [client]
  );

  useEffect(() => {
    setIsLoading(true);
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [client, fetchProfile]);

  const logout = useCallback(async () => {
    await client.auth.signOut();
    setProfile(null);
  }, [client]);

  return (
    <AuthContext.Provider value={{ profile, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
