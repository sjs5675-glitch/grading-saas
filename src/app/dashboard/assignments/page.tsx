"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ClipboardList, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { supabaseInstructor as supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import type { ClassInfo } from "@/lib/api";
import { getClasses } from "@/lib/api";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  status: string;
  total_score: number;
  due_date: string | null;
  source_type: string;
  created_at: string;
}

export default function AssignmentsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 새 숙제 폼
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalScore, setTotalScore] = useState("100");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    try {
      const [classData] = await Promise.all([getClasses()]);
      setClasses(classData);

      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("instructor_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch {
      toast.error("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !title.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("assignments")
        .insert({
          instructor_id: profile.id,
          org_id: profile.org_id,
          title: title.trim(),
          description: description.trim() || null,
          total_score: parseInt(totalScore) || 100,
          source_type: "manual",
        })
        .select()
        .single();

      if (error) throw error;

      // 반 배정
      if (selectedClassIds.length > 0) {
        const rows = selectedClassIds.map((classId) => ({
          assignment_id: data.id,
          class_id: classId,
        }));
        await supabase.from("assignment_classes").insert(rows);
      }

      toast.success("숙제가 생성되었습니다.");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch {
      toast.error("숙제 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, assignmentTitle: string) => {
    if (!confirm(`"${assignmentTitle}" 숙제를 삭제하시겠습니까?`)) return;
    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("숙제가 삭제되었습니다.");
      fetchData();
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("assignments")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      toast.success(
        newStatus === "published" ? "숙제가 배포되었습니다." : "상태가 변경되었습니다."
      );
      fetchData();
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTotalScore("100");
    setSelectedClassIds([]);
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "draft": return "임시저장";
      case "published": return "배포됨";
      case "closed": return "마감";
      case "archived": return "보관";
      default: return status;
    }
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "draft": return "secondary" as const;
      case "published": return "default" as const;
      case "closed": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">숙제 관리</h1>
          <p className="text-muted-foreground">
            숙제를 만들고 학생에게 배정하세요.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-1" />
            숙제 만들기
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 숙제 만들기</DialogTitle>
              <DialogDescription>
                숙제 정보를 입력하세요. 문제는 생성 후 추가할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>숙제 제목</Label>
                <Input
                  placeholder="예: 1단원 복습 숙제"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>설명 (선택)</Label>
                <Input
                  placeholder="숙제에 대한 간단한 설명"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>총점</Label>
                <Input
                  type="number"
                  value={totalScore}
                  onChange={(e) => setTotalScore(e.target.value)}
                  min={1}
                />
              </div>
              {classes.length > 0 && (
                <div className="space-y-2">
                  <Label>배정할 반</Label>
                  <div className="flex flex-wrap gap-2">
                    {classes.map((cls) => (
                      <Badge
                        key={cls.id}
                        variant={
                          selectedClassIds.includes(cls.id)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleClass(cls.id)}
                      >
                        {cls.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  취소
                </DialogClose>
                <Button type="submit" disabled={creating}>
                  {creating ? "생성 중..." : "생성"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          불러오는 중...
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mb-4 text-gray-300" />
            <p>아직 숙제가 없습니다.</p>
            <p className="text-sm">오른쪽 위 버튼으로 숙제를 만들어보세요.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Card key={a.id} className="cursor-pointer hover:border-blue-300 transition-colors" onClick={() => router.push(`/dashboard/assignments/${a.id}`)}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{a.title}</h3>
                      <Badge variant={statusVariant(a.status)}>
                        {statusLabel(a.status)}
                      </Badge>
                    </div>
                    {a.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {a.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>총점: {a.total_score}점</span>
                      <span>
                        {new Date(a.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {a.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(a.id, "published")}
                      >
                        배포
                      </Button>
                    )}
                    {a.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(a.id, "closed")}
                      >
                        마감
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(a.id, a.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
