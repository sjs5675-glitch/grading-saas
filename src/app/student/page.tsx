"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle, Clock, PenLine } from "lucide-react";
import { getStudentAssignments } from "@/lib/api";

interface AssignmentWithStatus {
  id: string;
  title: string;
  description: string | null;
  total_score: number;
  due_date: string | null;
  created_at: string;
  submission: { status: string; total_score: number | null } | null;
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await getStudentAssignments();
      setAssignments(data);
    } catch {
      toast.error("숙제를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusInfo = (sub: AssignmentWithStatus["submission"]) => {
    if (!sub) return { label: "미제출", color: "secondary" as const, icon: PenLine };
    switch (sub.status) {
      case "in_progress":
        return { label: "진행중", color: "secondary" as const, icon: Clock };
      case "submitted":
      case "grading":
        return { label: "채점중", color: "secondary" as const, icon: Clock };
      case "graded":
        return { label: "채점완료", color: "default" as const, icon: CheckCircle };
      default:
        return { label: sub.status, color: "secondary" as const, icon: Clock };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{profile?.name}님의 숙제</h1>
        <p className="text-sm text-muted-foreground">
          배정된 숙제를 확인하고 답을 제출하세요.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          불러오는 중...
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-4 text-gray-300" />
            <p>아직 배정된 숙제가 없습니다.</p>
            <p className="text-sm">선생님이 숙제를 배정하면 여기에 표시됩니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const status = getStatusInfo(a.submission);
            const StatusIcon = status.icon;
            const isGraded = a.submission?.status === "graded";

            return (
              <Card key={a.id} className="hover:border-blue-300 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{a.title}</h3>
                        <Badge variant={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      {a.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {a.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>총점: {a.total_score}점</span>
                        {isGraded && a.submission?.total_score != null && (
                          <span className="font-medium text-blue-600">
                            내 점수: {a.submission.total_score}점
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isGraded ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/student/assignments/${a.id}/result`)
                          }
                        >
                          결과 보기
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/student/assignments/${a.id}`)
                          }
                        >
                          {a.submission ? "이어 풀기" : "풀기"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
