export type UserRole = "org_admin" | "instructor" | "student";

export interface Profile {
  id: string;
  auth_user_id: string;
  org_id: string | null;
  role: UserRole;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  max_students: number;
  created_at: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  instructor_id: string;
  org_id: string | null;
  created_at: string;
  student_count?: number;
}

export interface Student {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
  created_at: string;
  classes?: string[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  source_type: "manual" | "pdf_upload";
  status: "draft" | "published" | "closed" | "archived";
  total_score: number;
  pass_score: number;
  due_date: string | null;
  ai_extraction_status: string;
  created_at: string;
}

export interface Question {
  id: string;
  assignment_id: string;
  question_number: number;
  question_type: "multiple_choice" | "short_answer" | "descriptive";
  question_text: string | null;
  score: number;
  choice_count: number | null;
  correct_option: number | null;
  correct_answers: string[] | null;
  rubric: string | null;
  model_answer: string | null;
  display_order: number;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: "in_progress" | "submitted" | "grading" | "graded";
  total_score: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
}

export interface Answer {
  id: string;
  submission_id: string;
  question_id: string;
  answer_text: string | null;
  answer_image_path: string | null;
  ocr_text: string | null;
  is_correct: boolean | null;
  earned_score: number;
  grading_method: "auto" | "ai" | "manual";
  ai_feedback: string | null;
  ai_confidence: number | null;
  manual_override: boolean;
}
