-- TODO: Add Evaluation Metrics columns here once provided by Wenxuan.
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  avatar_id text NOT NULL,
  class_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.student_activity_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  completion_score numeric,
  "timestamp" timestamptz DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity_attempts ENABLE ROW LEVEL SECURITY;
