"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">설정</h1>

      <Card>
        <CardHeader>
          <CardTitle>내 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">이름</span>
            <span className="font-medium">{profile?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">이메일</span>
            <span className="font-medium">{profile?.email || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">역할</span>
            <Badge variant="secondary">
              {profile?.role === "instructor"
                ? "강사"
                : profile?.role === "org_admin"
                ? "학원 관리자"
                : "학생"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>구독 플랜</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">현재 플랜</span>
            <Badge>Free</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">학생 상한</span>
            <span>5명</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">AI 채점</span>
            <span>10회/월</span>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            더 많은 학생과 AI 채점이 필요하시면 플랜을 업그레이드하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
