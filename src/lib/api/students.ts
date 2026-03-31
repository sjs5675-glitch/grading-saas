import { supabaseInstructor as supabase } from "../supabase";
import type { Student } from "./types";

export async function getStudents(): Promise<Student[]> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id || "")
    .single();

  if (!profile) throw new Error("프로필을 찾을 수 없습니다.");

  // 내 학생 목록
  const { data: studentLinks } = await supabase
    .from("instructor_students")
    .select("student_id")
    .eq("instructor_id", profile.id);

  if (!studentLinks || studentLinks.length === 0) return [];

  const studentIds = studentLinks.map((s) => s.student_id);

  const { data: students, error } = await supabase
    .from("profiles")
    .select("id, name, phone, active, created_at")
    .in("id", studentIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // 학생별 반 목록
  const { data: classStudents } = await supabase
    .from("class_students")
    .select("student_id, class_id, classes(name)")
    .in("student_id", studentIds);

  const classMap: Record<string, string[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (classStudents || []).forEach((cs: any) => {
    if (!classMap[cs.student_id]) classMap[cs.student_id] = [];
    if (cs.classes) {
      const cls = Array.isArray(cs.classes) ? cs.classes : [cs.classes];
      cls.forEach((c: { name: string }) => classMap[cs.student_id].push(c.name));
    }
  });

  return (students || []).map((s) => ({
    ...s,
    classes: classMap[s.id] || [],
  }));
}

export async function updateStudentStatus(
  studentId: string,
  active: boolean
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ active })
    .eq("id", studentId);
  if (error) throw error;
}
