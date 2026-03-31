"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";

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

  const fetchProfile = useCallback(async (authUserId: string) => {
    const { data, error } = await supabase
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
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ profile, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
