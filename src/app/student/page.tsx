"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function StudentDashboard() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{profile?.name}님의 숙제</h1>
        <p className="text-sm text-muted-foreground">
          배정된 숙제를 확인하고 답을 제출하세요.
        </p>
      </div>

      <Card>
        <CardContent className="py-12 flex flex-col items-center text-center text-muted-foreground">
          <ClipboardList className="h-12 w-12 mb-4 text-gray-300" />
          <p>아직 배정된 숙제가 없습니다.</p>
          <p className="text-sm">선생님이 숙제를 배정하면 여기에 표시됩니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
