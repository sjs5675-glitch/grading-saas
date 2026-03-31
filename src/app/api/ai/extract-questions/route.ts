import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const EXTRACTION_PROMPT = `당신은 교육 전문가입니다. 주어진 PDF에서 문제와 정답을 추출해주세요.

규칙:
1. 각 문제의 번호, 유형, 정답을 JSON 배열로 반환하세요.
2. 문제 유형은 다음 3가지 중 하나입니다:
   - "multiple_choice": 객관식 (보기 번호가 있는 문제)
   - "short_answer": 단답형 (짧은 답을 적는 문제)
   - "descriptive": 서술형 (긴 답을 적는 문제)
3. 객관식은 정답 번호(1~5)와 선택지 개수를 포함하세요.
4. 단답형은 정답 텍스트를 배열로 제공하세요 (여러 표현 가능).
5. 서술형은 모범답안과 채점기준을 포함하세요.
6. 문제 내용(question_text)도 가능하면 추출하세요.
7. 배점이 명시되어 있으면 포함하세요. 없으면 기본 5점.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):

[
  {
    "question_number": 1,
    "question_type": "multiple_choice",
    "question_text": "다음 중 올바른 것은?",
    "score": 5,
    "choice_count": 5,
    "correct_option": 3,
    "correct_answers": null,
    "model_answer": null,
    "rubric": null
  },
  {
    "question_number": 2,
    "question_type": "short_answer",
    "question_text": "산소의 화학식을 쓰시오.",
    "score": 5,
    "choice_count": null,
    "correct_option": null,
    "correct_answers": ["O2", "산소"],
    "model_answer": null,
    "rubric": null
  },
  {
    "question_number": 3,
    "question_type": "descriptive",
    "question_text": "광합성 과정을 설명하시오.",
    "score": 10,
    "choice_count": null,
    "correct_option": null,
    "correct_answers": null,
    "model_answer": "광합성은 식물이 빛에너지를 이용하여...",
    "rubric": "핵심 키워드 포함 여부: 빛에너지, 이산화탄소, 물, 포도당"
  }
]`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const questionPdf = formData.get("questionPdf") as File | null;
    const answerPdf = formData.get("answerPdf") as File | null;
    const assignmentId = formData.get("assignmentId") as string;

    if (!questionPdf) {
      return NextResponse.json(
        { error: "문제 PDF가 필요합니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // PDF를 base64로 변환
    const questionBuffer = Buffer.from(await questionPdf.arrayBuffer());
    const questionBase64 = questionBuffer.toString("base64");

    // Claude API 호출 준비
    const anthropic = new Anthropic({ apiKey });

    const content: Anthropic.ContentBlockParam[] = [
      {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: questionBase64,
        },
      },
    ];

    // 해설 PDF가 있으면 추가
    if (answerPdf) {
      const answerBuffer = Buffer.from(await answerPdf.arrayBuffer());
      const answerBase64 = answerBuffer.toString("base64");
      content.push({
        type: "text",
        text: "위는 문제 PDF이고, 아래는 해설/정답 PDF입니다.",
      });
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: answerBase64,
        },
      });
    }

    content.push({
      type: "text",
      text: EXTRACTION_PROMPT,
    });

    // Claude API 호출
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content }],
    });

    // 응답 파싱
    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // JSON 추출 (```json ... ``` 또는 바로 JSON)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    // [ 로 시작하는 부분만 추출
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }

    const questions = JSON.parse(jsonStr);

    if (!Array.isArray(questions)) {
      throw new Error("AI 응답이 배열 형식이 아닙니다.");
    }

    // Storage에 PDF 저장 (assignmentId가 있는 경우)
    if (assignmentId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && supabaseKey) {
        const admin = createClient(supabaseUrl, supabaseKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const path = `${assignmentId}/question.pdf`;
        await admin.storage
          .from("assignment-pdfs")
          .upload(path, questionBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        await admin
          .from("assignments")
          .update({
            source_type: "pdf_upload",
            source_pdf_path: path,
            ai_extraction_status: "completed",
            ai_extraction_result: questions,
          })
          .eq("id", assignmentId);
      }
    }

    return NextResponse.json({
      success: true,
      questions,
      questionCount: questions.length,
    });
  } catch (err) {
    console.error("AI 추출 오류:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "AI 문제 추출에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
