import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 강사/관리자용 클라이언트 (별도 storageKey)
export const supabaseInstructor = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: "sb-instructor-auth",
  },
});

// 학생용 클라이언트 (별도 storageKey)
export const supabaseStudent = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: "sb-student-auth",
  },
});

// 경로 기반 자동 선택
export function getSupabase(pathname?: string): SupabaseClient {
  if (typeof window !== "undefined" && !pathname) {
    pathname = window.location.pathname;
  }
  return pathname?.startsWith("/student") ? supabaseStudent : supabaseInstructor;
}

// 하위 호환: 기본 export
export const supabase = supabaseInstructor;
