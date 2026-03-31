import { supabase } from "../supabase";

// 강사/관리자 가입 (실제 이메일)
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: "instructor" | "org_admin",
  orgId?: string
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("가입에 실패했습니다.");

  const { error: profileError } = await supabase.from("profiles").insert({
    auth_user_id: authData.user.id,
    role,
    name,
    email,
    org_id: orgId || null,
  });

  if (profileError) throw profileError;

  // 개인 강사인 경우 free 구독 자동 생성
  if (role === "instructor" && !orgId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (profile) {
      await supabase.from("subscriptions").insert({
        instructor_id: profile.id,
        plan: "free",
        max_students: 5,
      });
    }
  }

  return authData;
}

// 로그인 (이메일 + 비밀번호)
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// 학생 로그인 (전화번호 기반)
export async function studentSignIn(phone: string, password: string) {
  const normalizedPhone = phone.replace(/-/g, "");
  const email = `student-${normalizedPhone}@example.com`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// 학생 대리 생성 (강사가 생성)
export async function createStudent(
  name: string,
  phone: string,
  password: string,
  classIds: string[]
) {
  const normalizedPhone = phone.replace(/-/g, "");
  const email = `student-${normalizedPhone}@example.com`;

  // 1. Supabase Auth 유저 생성 (서버 사이드에서 처리 필요)
  // 클라이언트에서는 API route를 통해 처리
  const res = await fetch("/api/auth/create-student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone: normalizedPhone, password, email, classIds }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "학생 생성에 실패했습니다.");
  }

  return res.json();
}

// 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
