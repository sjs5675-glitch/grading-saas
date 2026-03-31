import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Service role key로 admin 클라이언트 생성 (학생 대리 생성용)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const adminClient = getSupabaseAdmin();
    const { name, phone, password, email, classIds } = await request.json();

    // 요청한 사용자의 인증 확인
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: callerUser },
    } = await adminClient.auth.getUser(token);

    if (!callerUser) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 401 });
    }

    // 호출자가 instructor인지 확인
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("id, role, org_id")
      .eq("auth_user_id", callerUser.id)
      .single();

    if (!callerProfile || !["instructor", "org_admin"].includes(callerProfile.role)) {
      return NextResponse.json({ error: "강사만 학생을 생성할 수 있습니다." }, { status: 403 });
    }

    // 1. Auth 유저 생성
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "이미 등록된 전화번호입니다." },
          { status: 400 }
        );
      }
      throw authError;
    }

    // 2. Profile 생성
    const { data: studentProfile, error: profileError } = await adminClient
      .from("profiles")
      .insert({
        auth_user_id: authData.user.id,
        role: "student",
        name,
        phone,
        org_id: callerProfile.org_id,
      })
      .select("id")
      .single();

    if (profileError) throw profileError;

    // 3. 강사-학생 관계 추가
    await adminClient.from("instructor_students").insert({
      instructor_id: callerProfile.id,
      student_id: studentProfile.id,
    });

    // 4. 반에 배정
    if (classIds && classIds.length > 0) {
      const classStudentRows = classIds.map((classId: string) => ({
        class_id: classId,
        student_id: studentProfile.id,
      }));
      await adminClient.from("class_students").insert(classStudentRows);
    }

    return NextResponse.json({
      success: true,
      studentId: studentProfile.id,
    });
  } catch (err) {
    console.error("학생 생성 오류:", err);
    return NextResponse.json(
      { error: "학생 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
