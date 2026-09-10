
-- =========
-- Enums
-- =========
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'parent');
CREATE TYPE public.interaction_type AS ENUM (
  'pronounce', 'trace', 'listen_choose', 'read_blend', 'decode',
  'tap_choice', 'drag_match', 'sort', 'sequence', 'speak_back'
);

-- =========
-- profiles
-- =========
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_read"   ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_self_write"  ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- =========
-- user_roles + has_role
-- =========
CREATE TABLE public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL   ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto-provision profile + default parent role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'parent') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========
-- children (per parent)
-- =========
CREATE TABLE public.children (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  age          INT,
  buddy_id     TEXT CHECK (buddy_id IN ('aiko','emma','gina','sidd')),
  avatar_emoji TEXT DEFAULT '🧒',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.children TO authenticated;
GRANT ALL ON public.children TO service_role;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "children_parent_all" ON public.children
  FOR ALL TO authenticated
  USING (parent_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (parent_id = auth.uid());

-- =========
-- learning_dispositions (seed catalog)
-- =========
CREATE TABLE public.learning_dispositions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.learning_dispositions TO anon, authenticated;
GRANT ALL    ON public.learning_dispositions TO service_role;
ALTER TABLE public.learning_dispositions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ld_public_read" ON public.learning_dispositions FOR SELECT USING (true);

INSERT INTO public.learning_dispositions (code, name, description, color, sort_order) VALUES
  ('curiosity',    'Curiosity',      'Explores, asks questions, wonders about the world.',        '#F59E0B', 1),
  ('persistence',  'Persistence',    'Keeps trying when things are hard.',                        '#EF4444', 2),
  ('collaboration','Collaboration',  'Works and plays well with others.',                         '#10B981', 3),
  ('creativity',   'Creativity',     'Comes up with new ideas and expresses them.',               '#8B5CF6', 4),
  ('confidence',   'Confidence',     'Shares thinking, tries new things, speaks up.',             '#3B82F6', 5),
  ('reflection',   'Reflection',     'Thinks about what worked and what to try next.',            '#EC4899', 6),
  ('literacy',     'Literacy',       'Sound-letter, decoding, blending, comprehension.',          '#F97316', 7),
  ('numeracy',     'Numeracy',       'Counting, number sense, patterns, early problem solving.', '#06B6D4', 8);

-- =========
-- activities
-- =========
CREATE TABLE public.activities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  unit             TEXT NOT NULL,
  order_in_unit    INT NOT NULL DEFAULT 0,
  interaction_type public.interaction_type NOT NULL,
  title            TEXT NOT NULL,
  prompt           TEXT,
  media            JSONB NOT NULL DEFAULT '{}'::jsonb,
  correct_payload  JSONB NOT NULL DEFAULT '{}'::jsonb,
  ld_tags          TEXT[] NOT NULL DEFAULT '{}',
  difficulty       INT NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activities TO anon, authenticated;
GRANT ALL    ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_public_read" ON public.activities FOR SELECT USING (true);

INSERT INTO public.activities (slug, unit, order_in_unit, interaction_type, title, prompt, correct_payload, ld_tags, difficulty) VALUES
  ('pronounce-s', 'phonics-1', 1, 'pronounce', 'Say the letter s', 'sun', '{"letter":"s","word":"sun"}'::jsonb, ARRAY['literacy','confidence'], 1),
  ('trace-a',     'phonics-1', 2, 'trace',     'Trace the letter a', 'ant', '{"letter":"a","word":"ant"}'::jsonb, ARRAY['literacy','persistence'], 1),
  ('sound-m',     'phonics-1', 3, 'listen_choose', 'What sound do you hear?', 'mmm', '{"correct":"m","options":["i","m","d","n"]}'::jsonb, ARRAY['literacy'], 1),
  ('read-nap',    'phonics-1', 4, 'read_blend', 'Read the word: nap', 'nap', '{"letters":["n","a","p"],"word":"nap"}'::jsonb, ARRAY['literacy','curiosity'], 2),
  ('decode-dig',  'phonics-1', 5, 'decode',    'Decode the word: dig', 'dig', '{"letters":["d","i","g"],"word":"dig"}'::jsonb, ARRAY['literacy','reflection'], 2);

-- =========
-- sessions
-- =========
CREATE TABLE public.sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at   TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_parent_all" ON public.sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND (c.parent_id = auth.uid() OR public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid())
  );

-- =========
-- activity_attempts
-- =========
CREATE TABLE public.activity_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id      UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  activity_id   UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  correct       BOOLEAN NOT NULL,
  latency_ms    INT,
  hints_used    INT NOT NULL DEFAULT 0,
  transcript    TEXT,
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_attempts TO authenticated;
GRANT ALL ON public.activity_attempts TO service_role;
ALTER TABLE public.activity_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attempts_family_read" ON public.activity_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND (c.parent_id = auth.uid() OR public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')))
  );

CREATE POLICY "attempts_family_write" ON public.activity_attempts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.parent_id = auth.uid())
  );

CREATE INDEX activity_attempts_child_idx ON public.activity_attempts(child_id, created_at DESC);

-- =========
-- Updated-at helper + triggers
-- =========
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER touch_profiles_updated  BEFORE UPDATE ON public.profiles  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER touch_children_updated  BEFORE UPDATE ON public.children  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
