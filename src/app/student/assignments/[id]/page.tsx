"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAssignmentForStudent,
  startAssignment,
  saveAnswer,
  getMyAnswers,
  submitAssignment,
} from "@/lib/api";
import type { Question } from "@/lib/api";

const CIRCLE_NUMBERS = ["①", "②", "③", "④", "⑤"];

export default function TakeAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<{
    title: string;
    total_score: number;
    questions: Question[];
  } | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await getAssignmentForStudent(assignmentId);
      setAssignment(data);

      const sub = await startAssignment(assignmentId);
      setSubmissionId(sub.id);

      // 기존 답안 불러오기
      const existingAnswers = await getMyAnswers(sub.id);
      const answerMap: Record<string, string> = {};
      existingAnswers.forEach((a: { question_id: string; answer_text: string | null }) => {
        if (a.answer_text) answerMap[a.question_id] = a.answer_text;
      });
      setAnswers(answerMap);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "숙제를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const debouncedSave = useCallback(
    (questionId: string, value: string) => {
      if (!submissionId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await saveAnswer(submissionId, questionId, value);
        } catch {
          // 저장 실패는 조용히 처리
        }
      }, 500);
    },
    [submissionId]
  );

  const handleAnswer = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      debouncedSave(questionId, value);
    },
    [debouncedSave]
  );

  const handleMultipleChoice = useCallback(
    (questionId: string, option: number) => {
      const value = String(option);
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      if (submissionId) {
        saveAnswer(submissionId, questionId, value).catch(() => {});
      }
      // 0.5초 후 다음 문제
      setTimeout(() => {
        if (assignment && currentIndex < assignment.questions.length - 1) {
          setCurrentIndex((i) => i + 1);
        }
      }, 500);
    },
    [submissionId, assignment, currentIndex]
  );

  const handleSubmit = async () => {
    if (!submissionId) return;
    const unanswered =
      assignment?.questions.filter((q) => !answers[q.id]).length || 0;

    if (unanswered > 0) {
      if (
        !confirm(
          `아직 ${unanswered}문제를 풀지 않았습니다. 그래도 제출하시겠습니까?`
        )
      )
        return;
    } else {
      if (!confirm("제출하시겠습니까? 제출 후 수정할 수 없습니다.")) return;
    }

    setSubmitting(true);
    try {
      await submitAssignment(submissionId);
      toast.success("제출 완료! 채점 결과를 확인하세요.");
      router.push(`/student/assignments/${assignmentId}/result`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "제출에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !assignment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const questions = assignment.questions;
  const currentQ = questions[currentIndex];
  const answeredCount = questions.filter((q) => answers[q.id]).length;

  if (showSummary) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">답안 확인</h2>
        <p className="text-sm text-muted-foreground">
          {answeredCount}/{questions.length}문제 답변 완료
        </p>

        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {questions.map((q, i) => {
            const answered = !!answers[q.id];
            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIndex(i);
                  setShowSummary(false);
                }}
                className={`h-10 rounded-lg text-sm font-medium border transition-colors ${
                  answered
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-red-50 border-red-200 text-red-500"
                }`}
              >
                {q.question_number}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowSummary(false)}
          >
            돌아가기
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Send className="h-4 w-4 mr-1" />
            {submitting ? "제출 중..." : "제출하기"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 상단 정보 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold truncate">{assignment.title}</h2>
        <Badge variant="secondary">
          {answeredCount}/{questions.length}
        </Badge>
      </div>

      {/* 문제 카드 */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
              {currentQ.question_number}
            </div>
            <Badge variant="outline">
              {currentQ.question_type === "multiple_choice"
                ? "객관식"
                : currentQ.question_type === "short_answer"
                ? "단답형"
                : "서술형"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {currentQ.score}점
            </span>
          </div>

          {currentQ.question_text && (
            <p className="mb-4 text-sm">{currentQ.question_text}</p>
          )}

          {/* 객관식 */}
          {currentQ.question_type === "multiple_choice" && (
            <div className="grid grid-cols-1 gap-2">
              {Array.from(
                { length: currentQ.choice_count || 5 },
                (_, i) => i + 1
              ).map((n) => {
                const selected = answers[currentQ.id] === String(n);
                return (
                  <button
                    key={n}
                    onClick={() => handleMultipleChoice(currentQ.id, n)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                      selected
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {CIRCLE_NUMBERS[n - 1] || n}
                    </span>
                    <span>{n}번</span>
                    {selected && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* 단답형 */}
          {currentQ.question_type === "short_answer" && (
            <Input
              placeholder="답을 입력하세요"
              value={answers[currentQ.id] || ""}
              onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.nativeEvent.isComposing &&
                  currentIndex < questions.length - 1
                ) {
                  setCurrentIndex((i) => i + 1);
                }
              }}
              autoFocus
              className="text-lg"
            />
          )}

          {/* 서술형 */}
          {currentQ.question_type === "descriptive" && (
            <textarea
              placeholder="답을 작성하세요"
              value={answers[currentQ.id] || ""}
              onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
              className="w-full min-h-[150px] p-3 border rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </CardContent>
      </Card>

      {/* 하단 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          이전
        </Button>

        <div className="flex gap-1 overflow-x-auto px-2">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-7 h-7 rounded-full text-xs font-medium shrink-0 transition-colors ${
                i === currentIndex
                  ? "bg-blue-600 text-white"
                  : answers[q.id]
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {q.question_number}
            </button>
          ))}
        </div>

        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex((i) => i + 1)}>
            다음
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={() => setShowSummary(true)}>
            답안 확인
            <Send className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
