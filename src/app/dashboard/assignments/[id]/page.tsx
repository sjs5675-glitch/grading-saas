"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ListChecks,
  PenLine,
  FileText,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  getAssignment,
  createQuestion,
  deleteQuestion,
  updateAssignmentTotalScore,
} from "@/lib/api";
import type { Question } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "객관식",
  short_answer: "단답형",
  descriptive: "서술형",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  multiple_choice: <ListChecks className="h-4 w-4" />,
  short_answer: <PenLine className="h-4 w-4" />,
  descriptive: <FileText className="h-4 w-4" />,
};

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<{
    id: string;
    title: string;
    status: string;
    total_score: number;
    questions: Question[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 문제 추가 폼
  const [qType, setQType] = useState<
    "multiple_choice" | "short_answer" | "descriptive"
  >("multiple_choice");
  const [qText, setQText] = useState("");
  const [qScore, setQScore] = useState("5");
  const [qChoiceCount, setQChoiceCount] = useState("5");
  const [qCorrectOption, setQCorrectOption] = useState("1");
  const [qCorrectAnswers, setQCorrectAnswers] = useState("");
  const [qModelAnswer, setQModelAnswer] = useState("");
  const [qRubric, setQRubric] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await getAssignment(assignmentId);
      setAssignment(data);
    } catch {
      toast.error("숙제를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;
    setCreating(true);

    try {
      const nextNumber = assignment.questions.length + 1;
      const data: Parameters<typeof createQuestion>[0] = {
        assignment_id: assignmentId,
        question_number: nextNumber,
        question_type: qType,
        question_text: qText.trim() || undefined,
        score: parseInt(qScore) || 5,
        display_order: nextNumber,
      };

      if (qType === "multiple_choice") {
        data.choice_count = parseInt(qChoiceCount) || 5;
        data.correct_option = parseInt(qCorrectOption) || 1;
      } else if (qType === "short_answer") {
        data.correct_answers = qCorrectAnswers
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean);
      } else if (qType === "descriptive") {
        data.model_answer = qModelAnswer.trim() || undefined;
        data.rubric = qRubric.trim() || undefined;
      }

      await createQuestion(data);

      // 총점 업데이트
      const newTotal =
        assignment.questions.reduce((sum, q) => sum + q.score, 0) +
        (parseInt(qScore) || 5);
      await updateAssignmentTotalScore(assignmentId, newTotal);

      toast.success(`${nextNumber}번 문제가 추가되었습니다.`);
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch {
      toast.error("문제 추가에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteQuestion = async (q: Question) => {
    if (!confirm(`${q.question_number}번 문제를 삭제하시겠습니까?`)) return;
    try {
      await deleteQuestion(q.id);
      if (assignment) {
        const newTotal =
          assignment.questions
            .filter((qq) => qq.id !== q.id)
            .reduce((sum, qq) => sum + qq.score, 0);
        await updateAssignmentTotalScore(assignmentId, newTotal);
      }
      toast.success("문제가 삭제되었습니다.");
      fetchData();
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const resetForm = () => {
    setQType("multiple_choice");
    setQText("");
    setQScore("5");
    setQChoiceCount("5");
    setQCorrectOption("1");
    setQCorrectAnswers("");
    setQModelAnswer("");
    setQRubric("");
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        숙제를 찾을 수 없습니다.
      </div>
    );
  }

  const totalScore = assignment.questions.reduce((s, q) => s + q.score, 0);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <Badge
              variant={
                assignment.status === "published" ? "default" : "secondary"
              }
            >
              {assignment.status === "draft"
                ? "임시저장"
                : assignment.status === "published"
                ? "배포됨"
                : "마감"}
            </Badge>
            <span>
              문제 {assignment.questions.length}개 · 총 {totalScore}점
            </span>
          </div>
        </div>
        <Link href={`/dashboard/assignments/${assignmentId}/submissions`}>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-1" />
            제출 현황
          </Button>
        </Link>
      </div>

      {/* 문제 목록 */}
      {assignment.questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ListChecks className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>아직 문제가 없습니다.</p>
            <p className="text-sm">아래 버튼으로 문제를 추가하세요.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {assignment.questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold shrink-0">
                      {q.question_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {TYPE_ICONS[q.question_type]}
                        <span className="text-sm font-medium">
                          {TYPE_LABELS[q.question_type]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {q.score}점
                        </span>
                      </div>
                      {q.question_text && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {q.question_text}
                        </p>
                      )}
                      <p className="text-xs text-green-600 mt-0.5">
                        {q.question_type === "multiple_choice" &&
                          `정답: ${q.correct_option}번 (${q.choice_count}지선다)`}
                        {q.question_type === "short_answer" &&
                          `정답: ${(q.correct_answers || []).join(", ")}`}
                        {q.question_type === "descriptive" && "서술형 (수동채점)"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 shrink-0"
                    onClick={() => handleDeleteQuestion(q)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 문제 추가 버튼 + Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger render={<Button className="w-full" />}>
          <Plus className="h-4 w-4 mr-1" />
          문제 추가
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문제 추가</DialogTitle>
            <DialogDescription>
              {assignment.questions.length + 1}번 문제를 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddQuestion} className="space-y-4">
            {/* 문제 유형 */}
            <div className="space-y-2">
              <Label>문제 유형</Label>
              <div className="flex gap-2">
                {(
                  ["multiple_choice", "short_answer", "descriptive"] as const
                ).map((t) => (
                  <Badge
                    key={t}
                    variant={qType === t ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setQType(t)}
                  >
                    {TYPE_LABELS[t]}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 문제 텍스트 (선택) */}
            <div className="space-y-2">
              <Label>문제 내용 (선택)</Label>
              <Input
                placeholder="문제 내용을 입력하세요"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
              />
            </div>

            {/* 배점 */}
            <div className="space-y-2">
              <Label>배점</Label>
              <Input
                type="number"
                value={qScore}
                onChange={(e) => setQScore(e.target.value)}
                min={1}
              />
            </div>

            {/* 객관식 */}
            {qType === "multiple_choice" && (
              <>
                <div className="space-y-2">
                  <Label>선택지 개수</Label>
                  <Input
                    type="number"
                    value={qChoiceCount}
                    onChange={(e) => setQChoiceCount(e.target.value)}
                    min={2}
                    max={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>정답 번호</Label>
                  <div className="flex gap-2">
                    {Array.from(
                      { length: parseInt(qChoiceCount) || 5 },
                      (_, i) => i + 1
                    ).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQCorrectOption(String(n))}
                        className={`w-10 h-10 rounded-full border-2 text-sm font-bold transition-colors ${
                          parseInt(qCorrectOption) === n
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 text-gray-600 hover:border-blue-400"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 단답형 */}
            {qType === "short_answer" && (
              <div className="space-y-2">
                <Label>정답 (여러 개면 쉼표로 구분)</Label>
                <Input
                  placeholder="예: 산소, O2"
                  value={qCorrectAnswers}
                  onChange={(e) => setQCorrectAnswers(e.target.value)}
                  required
                />
              </div>
            )}

            {/* 서술형 */}
            {qType === "descriptive" && (
              <>
                <div className="space-y-2">
                  <Label>모범 답안 (선택)</Label>
                  <Input
                    placeholder="모범 답안"
                    value={qModelAnswer}
                    onChange={(e) => setQModelAnswer(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>채점 기준 (선택)</Label>
                  <Input
                    placeholder="채점 기준을 입력하세요"
                    value={qRubric}
                    onChange={(e) => setQRubric(e.target.value)}
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                취소
              </DialogClose>
              <Button type="submit" disabled={creating}>
                {creating ? "추가 중..." : "추가"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
