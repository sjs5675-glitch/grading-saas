import { supabaseInstructor, supabaseStudent } from "../supabase";
import type { Assignment, Question } from "./types";

// ===== 강사 API =====

export async function getAssignment(id: string) {
  const { data: assignment, error } = await supabaseInstructor
    .from("assignments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  const { data: questions } = await supabaseInstructor
    .from("questions")
    .select("*")
    .eq("assignment_id", id)
    .order("display_order", { ascending: true });

  const { data: assignmentClasses } = await supabaseInstructor
    .from("assignment_classes")
    .select("class_id")
    .eq("assignment_id", id);

  return {
    ...assignment,
    questions: (questions || []) as Question[],
    classIds: (assignmentClasses || []).map((ac) => ac.class_id),
  };
}

export async function createQuestion(data: {
  assignment_id: string;
  question_number: number;
  question_type: "multiple_choice" | "short_answer" | "descriptive";
  question_text?: string;
  score: number;
  choice_count?: number;
  correct_option?: number;
  correct_answers?: string[];
  rubric?: string;
  model_answer?: string;
  display_order: number;
}) {
  const { data: question, error } = await supabaseInstructor
    .from("questions")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return question as Question;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabaseInstructor
    .from("questions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function updateAssignmentTotalScore(
  assignmentId: string,
  totalScore: number
) {
  const { error } = await supabaseInstructor
    .from("assignments")
    .update({ total_score: totalScore })
    .eq("id", assignmentId);
  if (error) throw error;
}

// ===== 학생 API =====

export async function getStudentAssignments() {
  const {
    data: { user },
  } = await supabaseStudent.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: profile } = await supabaseStudent
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) throw new Error("프로필을 찾을 수 없습니다.");

  // 학생이 속한 반의 published 숙제 조회
  const { data: classStudents } = await supabaseStudent
    .from("class_students")
    .select("class_id")
    .eq("student_id", profile.id);

  if (!classStudents || classStudents.length === 0) return [];

  const classIds = classStudents.map((cs) => cs.class_id);

  const { data: assignmentClasses } = await supabaseStudent
    .from("assignment_classes")
    .select("assignment_id")
    .in("class_id", classIds);

  if (!assignmentClasses || assignmentClasses.length === 0) return [];

  const assignmentIds = [
    ...new Set(assignmentClasses.map((ac) => ac.assignment_id)),
  ];

  const { data: assignments } = await supabaseStudent
    .from("assignments")
    .select("*")
    .in("id", assignmentIds)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // 제출 상태 조회
  const { data: submissions } = await supabaseStudent
    .from("submissions")
    .select("assignment_id, status, total_score")
    .eq("student_id", profile.id)
    .in("assignment_id", assignmentIds);

  const submissionMap: Record<
    string,
    { status: string; total_score: number | null }
  > = {};
  (submissions || []).forEach((s) => {
    submissionMap[s.assignment_id] = {
      status: s.status,
      total_score: s.total_score,
    };
  });

  return (assignments || []).map((a) => ({
    ...a,
    submission: submissionMap[a.id] || null,
  }));
}

export async function getAssignmentForStudent(assignmentId: string) {
  const { data: assignment, error } = await supabaseStudent
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();

  if (error) throw error;

  const { data: questions } = await supabaseStudent
    .from("questions")
    .select(
      "id, assignment_id, question_number, question_type, question_text, score, choice_count, display_order"
    )
    .eq("assignment_id", assignmentId)
    .order("display_order", { ascending: true });

  return {
    ...assignment,
    questions: (questions || []) as Question[],
  };
}

export async function startAssignment(assignmentId: string) {
  const {
    data: { user },
  } = await supabaseStudent.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: profile } = await supabaseStudent
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) throw new Error("프로필을 찾을 수 없습니다.");

  // 기존 submission 확인
  const { data: existing } = await supabaseStudent
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_id", profile.id)
    .single();

  if (existing) return existing;

  // 새 submission 생성
  const { data, error } = await supabaseStudent
    .from("submissions")
    .insert({
      assignment_id: assignmentId,
      student_id: profile.id,
      status: "in_progress",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveAnswer(
  submissionId: string,
  questionId: string,
  answerText: string
) {
  // upsert로 답안 저장
  const { error } = await supabaseStudent.from("answers").upsert(
    {
      submission_id: submissionId,
      question_id: questionId,
      answer_text: answerText,
    },
    { onConflict: "submission_id,question_id" }
  );

  if (error) throw error;
}

export async function getMyAnswers(submissionId: string) {
  const { data, error } = await supabaseStudent
    .from("answers")
    .select("*")
    .eq("submission_id", submissionId);

  if (error) throw error;
  return data || [];
}

export async function submitAssignment(submissionId: string) {
  // 제출 처리 → API Route에서 채점
  const res = await fetch("/api/assignments/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "제출에 실패했습니다.");
  }

  return res.json();
}

// 강사: 제출 현황 조회
export async function getSubmissions(assignmentId: string) {
  const { data, error } = await supabaseInstructor
    .from("submissions")
    .select("*, profiles!submissions_student_id_fkey(name, phone)")
    .eq("assignment_id", assignmentId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// 학생: 내 결과 조회
export async function getMyResult(assignmentId: string) {
  const {
    data: { user },
  } = await supabaseStudent.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: profile } = await supabaseStudent
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) throw new Error("프로필을 찾을 수 없습니다.");

  const { data: submission } = await supabaseStudent
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_id", profile.id)
    .single();

  if (!submission) return null;

  const { data: answers } = await supabaseStudent
    .from("answers")
    .select("*, questions!answers_question_id_fkey(*)")
    .eq("submission_id", submission.id);

  const { data: assignment } = await supabaseStudent
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();

  return {
    assignment,
    submission,
    answers: answers || [],
  };
}
