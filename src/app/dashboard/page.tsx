"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, BarChart3, Zap } from "lucide-react";

export default function DashboardPage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          안녕하세요, {profile?.name || ""}님!
        </h1>
        <p className="text-muted-foreground">오늘의 현황을 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-500" />}
          label="등록 학생"
          value="0명"
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5 text-green-500" />}
          label="진행 중 숙제"
          value="0개"
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5 text-purple-500" />}
          label="완료된 채점"
          value="0건"
        />
        <StatCard
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
          label="AI 채점 사용"
          value="0 / 10회"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>시작하기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. 반 관리에서 반을 만드세요.</p>
          <p>2. 학생 관리에서 학생을 등록하세요.</p>
          <p>3. 숙제 관리에서 숙제를 만들고 배정하세요.</p>
          <p>4. 학생이 답을 제출하면 자동으로 채점됩니다!</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
