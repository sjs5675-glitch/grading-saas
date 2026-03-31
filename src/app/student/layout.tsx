"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { BookCheck, ClipboardList, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/student", label: "숙제 목록", icon: ClipboardList },
  { href: "/student/reports", label: "내 성적", icon: BarChart3 },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/student-sign-in");
    }
    if (!isLoading && profile && profile.role !== "student") {
      router.replace("/dashboard");
    }
  }, [profile, isLoading, router]);

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/student-sign-in");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <BookCheck className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-sm">채점 대신해줌</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{profile.name}</span>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Nav (mobile-friendly) */}
      <nav className="flex border-t bg-white">
        {navItems.map((item) => {
          const isActive =
            item.href === "/student"
              ? pathname === "/student"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                isActive
                  ? "text-blue-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <item.icon className="h-5 w-5 mb-1" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
