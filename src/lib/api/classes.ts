import { supabaseInstructor as supabase } from "../supabase";
import type { ClassInfo } from "./types";

export async function getClasses(): Promise<ClassInfo[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // 반별 학생 수 조회
  const classIds = (data || []).map((c) => c.id);
  const { data: counts } = await supabase
    .from("class_students")
    .select("class_id")
    .in("class_id", classIds);

  const countMap: Record<string, number> = {};
  (counts || []).forEach((cs) => {
    countMap[cs.class_id] = (countMap[cs.class_id] || 0) + 1;
  });

  return (data || []).map((c) => ({
    ...c,
    student_count: countMap[c.id] || 0,
  }));
}

export async function createClass(name: string): Promise<ClassInfo> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id")
    .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id || "")
    .single();

  if (!profile) throw new Error("프로필을 찾을 수 없습니다.");

  const { data, error } = await supabase
    .from("classes")
    .insert({
      name,
      instructor_id: profile.id,
      org_id: profile.org_id,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, student_count: 0 };
}

export async function deleteClass(classId: string): Promise<void> {
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) throw error;
}

export async function addStudentToClass(
  classId: string,
  studentId: string
): Promise<void> {
  const { error } = await supabase
    .from("class_students")
    .insert({ class_id: classId, student_id: studentId });
  if (error) throw error;
}

export async function removeStudentFromClass(
  classId: string,
  studentId: string
): Promise<void> {
  const { error } = await supabase
    .from("class_students")
    .delete()
    .eq("class_id", classId)
    .eq("student_id", studentId);
  if (error) throw error;
}
