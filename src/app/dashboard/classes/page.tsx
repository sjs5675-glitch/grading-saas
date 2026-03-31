"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClasses, createClass, deleteClass } from "@/lib/api";
import type { ClassInfo } from "@/lib/api";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const data = await getClasses();
      setClasses(data);
    } catch {
      toast.error("반 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreating(true);
    try {
      await createClass(newClassName.trim());
      setNewClassName("");
      toast.success("반이 추가되었습니다.");
      fetchClasses();
    } catch {
      toast.error("반 추가에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (classId: string, name: string) => {
    if (!confirm(`"${name}" 반을 삭제하시겠습니까?`)) return;
    try {
      await deleteClass(classId);
      toast.success("반이 삭제되었습니다.");
      fetchClasses();
    } catch {
      toast.error("반 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">반 관리</h1>
        <p className="text-muted-foreground">반을 만들고 학생을 배정하세요.</p>
      </div>

      {/* 반 추가 */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              placeholder="새 반 이름 (예: 고1 A반)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={creating || !newClassName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 반 목록 */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          불러오는 중...
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-muted-foreground">
            <FolderOpen className="h-12 w-12 mb-4 text-gray-300" />
            <p>아직 반이 없습니다.</p>
            <p className="text-sm">위에서 반을 추가해보세요.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{cls.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(cls.id, cls.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">
                  학생 {cls.student_count || 0}명
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
