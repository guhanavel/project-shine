
-- 1. Add join_code to children
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS join_code text UNIQUE;

CREATE OR REPLACE FUNCTION public.gen_join_code()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
$$;

UPDATE public.children SET join_code = public.gen_join_code() WHERE join_code IS NULL;

CREATE OR REPLACE FUNCTION public.tg_children_join_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := public.gen_join_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS children_join_code ON public.children;
CREATE TRIGGER children_join_code BEFORE INSERT ON public.children
  FOR EACH ROW EXECUTE FUNCTION public.tg_children_join_code();

REVOKE EXECUTE ON FUNCTION public.gen_join_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_children_join_code() FROM PUBLIC, anon, authenticated;

-- 2. Classes
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_teacher_all" ON public.classes
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (teacher_id = auth.uid() AND has_role(auth.uid(), 'teacher'));

CREATE TRIGGER touch_classes_updated BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- 3. class_children
CREATE TABLE public.class_children (
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, child_id)
);

GRANT SELECT, INSERT, DELETE ON public.class_children TO authenticated;
GRANT ALL ON public.class_children TO service_role;

ALTER TABLE public.class_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_children_teacher_all" ON public.class_children
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()));

-- 4. Update handle_new_user to honor requested role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested text;
  final_role app_role;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  requested := NEW.raw_user_meta_data ->> 'role';
  IF requested = 'teacher' THEN
    final_role := 'teacher'::app_role;
  ELSE
    final_role := 'parent'::app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, final_role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
