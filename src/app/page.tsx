"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { BookCheck, Zap, BarChart3, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile) {
      if (profile.role === "student") {
        router.replace("/student");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [profile, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-2">
          <BookCheck className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold">채점 내가 대신해줌</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              로그인
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">무료로 시작하기</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center text-center px-4 pt-16 md:pt-24 pb-20">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl">
          숙제 채점,
          <br />
          <span className="text-blue-600">AI가 대신해줍니다</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl">
          PDF 업로드 한 번이면 문제 추출부터 자동 채점, 오답 분석까지.
          <br />
          서술형도 사진 찍어 올리면 AI가 채점합니다.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/sign-up">
            <Button size="lg">무료로 시작하기</Button>
          </Link>
          <Link href="/student-sign-in">
            <Button size="lg" variant="outline">
              학생 로그인
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-yellow-500" />}
            title="PDF 자동 추출"
            description="숙제 PDF를 올리면 AI가 문제와 정답을 자동으로 추출합니다."
          />
          <FeatureCard
            icon={<Camera className="h-8 w-8 text-green-500" />}
            title="서술형 AI 채점"
            description="학생이 사진을 찍어 올리면 OCR + AI 채점이 한 번에 진행됩니다."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8 text-blue-500" />}
            title="오답 분석 리포트"
            description="학생별 취약점을 분석하여 강사에게 자동 보고합니다."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-xl border bg-white shadow-sm">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
