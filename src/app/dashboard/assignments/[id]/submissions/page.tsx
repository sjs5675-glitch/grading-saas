"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAssignment, getSubmissions } from "@/lib/api";
import { supabaseInstructor } from "@/lib/supabase";

interface SubmissionRow {
  id: string;
  status: string;
  total_score: number | null;
  submitted_at: string | null;
  profiles: { name: string; phone: string | null } | null;
}

export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<{
    title: string;
    total_score: number;
  } | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 수동채점 상태
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradingAnswers, setGradingAnswers] = useState<
    {
      id: string;
      question_number: number;
      question_text: string | null;
      question_type: string;
      score: number;
      answer_text: string | null;
      earned_score: number;
      is_correct: boolean | null;
    }[]
  >([]);
  const [editScores, setEditScores] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const [assignmentData, subs] = await Promise.all([
        getAssignment(assignmentId),
        getSubmissions(assignmentId),
      ]);
      setAssignment(assignmentData);
      setSubmissions(subs as unknown as SubmissionRow[]);
    } catch {
      toast.error("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewAnswers = async (submissionId: string) => {
    try {
      const { data } = await supabaseInstructor
        .from("answers")
        .select("id, answer_text, earned_score, is_correct, questions!answers_question_id_fkey(question_number, question_text, question_type, score)")
        .eq("submission_id", submissionId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted = (data || []).map((a: any) => ({
        id: a.id,
        question_number: a.questions.question_number,
        question_text: a.questions.question_text,
        question_type: a.questions.question_type,
        score: a.questions.score,
        answer_text: a.answer_text,
        earned_score: a.earned_score,
        is_correct: a.is_correct,
      }));

      formatted.sort(
        (a: { question_number: number }, b: { question_number: number }) =>
          a.question_number - b.question_number
      );

      setGradingAnswers(formatted);
      setGradingSubmissionId(submissionId);

      const scores: Record<string, string> = {};
      formatted.forEach((a: { id: string; earned_score: number }) => {
        scores[a.id] = String(a.earned_score);
      });
      setEditScores(scores);
    } catch {
      toast.error("답안을 불러오지 못했습니다.");
    }
  };

  const handleSaveGrading = async () => {
    if (!gradingSubmissionId) return;
    try {
      let total = 0;
      for (const a of gradingAnswers) {
        const newScore = parseFloat(editScores[a.id] || "0");
        total += newScore;
        await supabaseInstructor
          .from("answers")
          .update({
            earned_score: newScore,
            is_correct: newScore > 0,
            grading_method: "manual",
            graded_at: new Date().toISOString(),
          })
          .eq("id", a.id);
      }

      await supabaseInstructor
        .from("submissions")
        .update({
          total_score: total,
          status: "graded",
          graded_at: new Date().toISOString(),
        })
        .eq("id", gradingSubmissionId);

      toast.success("채점이 저장되었습니다.");
      setGradingSubmissionId(null);
      fetchData();
    } catch {
      toast.error("채점 저장에 실패했습니다.");
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "graded":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "grading":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  // 수동채점 화면
  if (gradingSubmissionId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setGradingSubmissionId(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">답안 채점</h1>
        </div>

        <div className="space-y-2">
          {gradingAnswers.map((a) => (
            <Card
              key={a.id}
              className={
                a.question_type === "descriptive" ? "border-yellow-200" : ""
              }
            >
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">
                        {a.question_number}번
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {a.question_type === "multiple_choice"
                          ? "객관식"
                          : a.question_type === "short_answer"
                          ? "단답형"
                          : "서술형"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        배점 {a.score}점
                      </span>
                    </div>
                    {a.question_text && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {a.question_text}
                      </p>
                    )}
                    <p className="text-sm">
                      학생 답: <span className="font-medium">{a.answer_text || "미답"}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Input
                      type="number"
                      value={editScores[a.id] || "0"}
                      onChange={(e) =>
                        setEditScores((prev) => ({
                          ...prev,
                          [a.id]: e.target.value,
                        }))
                      }
                      className="w-16 text-center"
                      min={0}
                      max={a.score}
                    />
                    <span className="text-sm text-muted-foreground">
                      /{a.score}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full" onClick={handleSaveGrading}>
          채점 저장
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">제출 현황</h1>
          <p className="text-sm text-muted-foreground">
            {assignment?.title} · 총 {submissions.length}명 제출
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            아직 제출한 학생이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* 데스크톱 */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학생</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>점수</TableHead>
                    <TableHead>제출일</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.profiles?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {statusIcon(s.status)}
                          <span className="text-sm">
                            {s.status === "graded"
                              ? "채점완료"
                              : s.status === "grading"
                              ? "채점중"
                              : s.status === "submitted"
                              ? "제출됨"
                              : "진행중"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.total_score != null
                          ? `${s.total_score}/${assignment?.total_score}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {s.submitted_at
                          ? new Date(s.submitted_at).toLocaleString("ko-KR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAnswers(s.id)}
                        >
                          답안 보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 모바일 */}
            <div className="md:hidden divide-y">
              {submissions.map((s) => (
                <div key={s.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.profiles?.name || "-"}</span>
                    <div className="flex items-center gap-1">
                      {statusIcon(s.status)}
                      <Badge variant="secondary" className="text-xs">
                        {s.total_score != null
                          ? `${s.total_score}점`
                          : "미채점"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleViewAnswers(s.id)}
                  >
                    답안 보기 / 채점
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
