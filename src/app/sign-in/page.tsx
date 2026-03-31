"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/api";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("로그인 성공");
      router.push("/dashboard");
    } catch {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-2">
            <BookCheck className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold">채점 내가 대신해줌</span>
          </Link>
          <CardTitle>강사 로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/sign-up" className="text-blue-600 hover:underline">
              회원가입
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            <Link href="/student-sign-in" className="text-blue-600 hover:underline">
              학생 로그인은 여기로
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
