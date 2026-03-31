"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  BookCheck,
  Users,
  FolderOpen,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: BarChart3 },
  { href: "/dashboard/assignments", label: "숙제 관리", icon: ClipboardList },
  { href: "/dashboard/students", label: "학생 관리", icon: Users },
  { href: "/dashboard/classes", label: "반 관리", icon: FolderOpen },
  { href: "/dashboard/settings", label: "설정", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/sign-in");
    }
    if (!isLoading && profile && profile.role === "student") {
      router.replace("/student");
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
    router.replace("/sign-in");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <BookCheck className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-sm">채점 대신해줌</span>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="text-sm font-medium mb-1">{profile.name}</div>
        <div className="text-xs text-muted-foreground mb-3">
          {profile.role === "org_admin" ? "학원 관리자" : "강사"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-white">
        <NavContent />
      </aside>

      {/* Mobile Header + Sheet */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white">
          <div className="flex items-center gap-2">
            <BookCheck className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-sm">채점 대신해줌</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
