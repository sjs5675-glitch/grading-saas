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
import { signUp } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name, "instructor");
      toast.success("가입이 완료되었습니다!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "가입에 실패했습니다."
      );
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
          <CardTitle>강사 회원가입</CardTitle>
          <p className="text-sm text-muted-foreground">
            무료로 시작하세요. 학생 5명까지 무료!
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                placeholder="6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "가입 중..." : "무료로 시작하기"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/sign-in" className="text-blue-600 hover:underline">
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
