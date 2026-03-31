"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { getStudents, getClasses, createStudent } from "@/lib/api";
import type { Student, ClassInfo } from "@/lib/api";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 신규 학생 폼
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([getStudents(), getClasses()]);
      setStudents(s);
      setClasses(c);
    } catch {
      toast.error("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newPassword) return;
    setCreating(true);
    try {
      await createStudent(newName.trim(), newPhone.trim(), newPassword, selectedClassIds);
      toast.success("학생이 등록되었습니다.");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "학생 등록에 실패했습니다."
      );
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewPhone("");
    setNewPassword("");
    setSelectedClassIds([]);
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">학생 관리</h1>
          <p className="text-muted-foreground">
            학생을 등록하고 반에 배정하세요.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button />}
          >
            <Plus className="h-4 w-4 mr-1" />
            학생 등록
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>학생 등록</DialogTitle>
              <DialogDescription>
                학생 정보를 입력하세요. 학생은 전화번호로 로그인합니다.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input
                  placeholder="홍길동"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>전화번호</Label>
                <Input
                  placeholder="01012345678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>비밀번호</Label>
                <Input
                  type="password"
                  placeholder="초기 비밀번호"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={4}
                />
              </div>
              {classes.length > 0 && (
                <div className="space-y-2">
                  <Label>반 배정</Label>
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
                  {creating ? "등록 중..." : "등록"}
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
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-muted-foreground">
            <Users className="h-12 w-12 mb-4 text-gray-300" />
            <p>아직 등록된 학생이 없습니다.</p>
            <p className="text-sm">오른쪽 위 버튼으로 학생을 등록하세요.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>반</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.phone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(s.classes || []).map((c) => (
                            <Badge key={c} variant="secondary" className="text-xs">
                              {c}
                            </Badge>
                          ))}
                          {(!s.classes || s.classes.length === 0) && (
                            <span className="text-muted-foreground text-sm">
                              미배정
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.active ? "default" : "secondary"}
                        >
                          {s.active ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y">
              {students.map((s) => (
                <div key={s.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant={s.active ? "default" : "secondary"}>
                      {s.active ? "활성" : "비활성"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {s.phone || "-"}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(s.classes || []).map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
