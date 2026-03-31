import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const { submissionId } = await request.json();
    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId가 필요합니다." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // 1. submission 조회
    const { data: submission, error: subError } = await admin
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { error: "제출을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 해당 assignment의 questions 조회
    const { data: questions } = await admin
      .from("questions")
      .select("*")
      .eq("assignment_id", submission.assignment_id)
      .order("display_order");

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "문제가 없습니다." },
        { status: 400 }
      );
    }

    // 3. 학생 answers 조회
    const { data: answers } = await admin
      .from("answers")
      .select("*")
      .eq("submission_id", submissionId);

    const answerMap: Record<string, { id: string; answer_text: string | null }> = {};
    (answers || []).forEach((a) => {
      answerMap[a.question_id] = { id: a.id, answer_text: a.answer_text };
    });

    // 4. 채점
    let totalScore = 0;
    let hasDescriptive = false;

    for (const q of questions) {
      const answer = answerMap[q.id];
      const answerText = answer?.answer_text?.trim() || "";

      let isCorrect: boolean | null = null;
      let earnedScore = 0;
      let gradingMethod = "auto";

      if (q.question_type === "multiple_choice") {
        // 객관식: 정답 번호 비교
        isCorrect = parseInt(answerText) === q.correct_option;
        earnedScore = isCorrect ? q.score : 0;
      } else if (q.question_type === "short_answer") {
        // 단답형: 정답 배열과 비교 (TRIM LOWER)
        const studentAnswer = answerText.toLowerCase().trim();
        const correctAnswers: string[] = q.correct_answers || [];
        isCorrect = correctAnswers.some(
          (ca: string) => ca.toLowerCase().trim() === studentAnswer
        );
        earnedScore = isCorrect ? q.score : 0;
      } else if (q.question_type === "descriptive") {
        // 서술형: 자동채점 안 함
        hasDescriptive = true;
        gradingMethod = "manual";
        isCorrect = null;
        earnedScore = 0;
      }

      if (!hasDescriptive || q.question_type !== "descriptive") {
        totalScore += earnedScore;
      }

      // answer가 있으면 update, 없으면 insert
      if (answer) {
        await admin
          .from("answers")
          .update({
            is_correct: isCorrect,
            earned_score: earnedScore,
            grading_method: gradingMethod,
            graded_at: new Date().toISOString(),
          })
          .eq("id", answer.id);
      } else {
        await admin.from("answers").insert({
          submission_id: submissionId,
          question_id: q.id,
          answer_text: "",
          is_correct: isCorrect,
          earned_score: 0,
          grading_method: gradingMethod,
          graded_at: new Date().toISOString(),
        });
      }
    }

    // 5. submission 업데이트
    const newStatus = hasDescriptive ? "grading" : "graded";
    await admin
      .from("submissions")
      .update({
        status: newStatus,
        total_score: totalScore,
        submitted_at: new Date().toISOString(),
        graded_at: hasDescriptive ? null : new Date().toISOString(),
      })
      .eq("id", submissionId);

    return NextResponse.json({
      success: true,
      totalScore,
      status: newStatus,
      hasDescriptive,
    });
  } catch (err) {
    console.error("채점 오류:", err);
    return NextResponse.json(
      { error: "채점에 실패했습니다." },
      { status: 500 }
    );
  }
}
