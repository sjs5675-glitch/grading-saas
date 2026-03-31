"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyResult } from "@/lib/api";

interface ResultData {
  assignment: {
    title: string;
    total_score: number;
  };
  submission: {
    total_score: number | null;
    status: string;
  };
  answers: {
    id: string;
    answer_text: string | null;
    is_correct: boolean | null;
    earned_score: number;
    grading_method: string;
    questions: {
      question_number: number;
      question_type: string;
      question_text: string | null;
      score: number;
      correct_option: number | null;
      correct_answers: string[] | null;
      model_answer: string | null;
    };
  }[];
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await getMyResult(assignmentId);
      setResult(data as unknown as ResultData);
    } catch {
      toast.error("결과를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!result || !result.submission) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>아직 제출하지 않았습니다.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/student/assignments/${assignmentId}`)}
        >
          풀기로 이동
        </Button>
      </div>
    );
  }

  const { assignment, submission, answers } = result;
  const totalScore = submission.total_score ?? 0;
  const maxScore = assignment.total_score;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const sortedAnswers = [...answers].sort(
    (a, b) => a.questions.question_number - b.questions.question_number
  );
  const correctCount = sortedAnswers.filter((a) => a.is_correct === true).length;
  const wrongCount = sortedAnswers.filter((a) => a.is_correct === false).length;
  const pendingCount = sortedAnswers.filter((a) => a.is_correct === null).length;

  const getCorrectAnswer = (q: ResultData["answers"][0]["questions"]) => {
    if (q.question_type === "multiple_choice") return `${q.correct_option}번`;
    if (q.question_type === "short_answer")
      return (q.correct_answers || []).join(", ");
    return q.model_answer || "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/student")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{assignment.title}</h1>
      </div>

      {/* 점수 요약 */}
      <Card>
        <CardContent className="py-6 text-center">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold mb-4 ${
              percentage >= 70
                ? "bg-green-100 text-green-700"
                : percentage >= 40
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {totalScore}
          </div>
          <p className="text-sm text-muted-foreground">
            {maxScore}점 만점 중 {totalScore}점 ({percentage}%)
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm">
            <span className="text-green-600">정답 {correctCount}</span>
            <span className="text-red-600">오답 {wrongCount}</span>
            {pendingCount > 0 && (
              <span className="text-yellow-600">채점중 {pendingCount}</span>
            )}
          </div>
          {submission.status === "grading" && (
            <Badge variant="secondary" className="mt-3">
              서술형 채점 대기중
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* 상세 결과 */}
      <div className="space-y-2">
        {sortedAnswers.map((a) => {
          const q = a.questions;
          const isCorrect = a.is_correct;
          const isPending = isCorrect === null;

          return (
            <Card
              key={a.id}
              className={
                isPending
                  ? "border-yellow-200"
                  : isCorrect
                  ? ""
                  : "border-red-200 bg-red-50/50"
              }
            >
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-sm font-bold">
                      {q.question_number}
                    </div>
                    {isPending ? (
                      <Badge variant="secondary" className="text-xs">
                        채점중
                      </Badge>
                    ) : isCorrect ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    {q.question_text && (
                      <p className="text-muted-foreground mb-1 truncate">
                        {q.question_text}
                      </p>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <span>
                        내 답:{" "}
                        <span className="font-medium">
                          {a.answer_text
                            ? q.question_type === "multiple_choice"
                              ? `${a.answer_text}번`
                              : a.answer_text
                            : "미답"}
                        </span>
                      </span>
                      {!isPending && !isCorrect && (
                        <span className="text-green-600">
                          정답: {getCorrectAnswer(q)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold">
                      {a.earned_score}/{q.score}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
