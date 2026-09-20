
-- =========== themes ===========
CREATE TABLE public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  emoji text DEFAULT '✨',
  color text DEFAULT 'coral',
  is_starter boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.themes TO authenticated;
GRANT ALL ON public.themes TO service_role;

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "themes readable"
  ON public.themes FOR SELECT TO authenticated
  USING (is_starter = true OR created_by = auth.uid());

CREATE POLICY "themes insert own"
  ON public.themes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_starter = false);

CREATE POLICY "themes update own"
  ON public.themes FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "themes delete own"
  ON public.themes FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE TRIGGER themes_touch_updated_at
  BEFORE UPDATE ON public.themes
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========== theme_items ===========
CREATE TABLE public.theme_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('letter','word')),
  value text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX theme_items_theme_id_idx ON public.theme_items(theme_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.theme_items TO authenticated;
GRANT ALL ON public.theme_items TO service_role;

ALTER TABLE public.theme_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_items readable"
  ON public.theme_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.themes t
    WHERE t.id = theme_id AND (t.is_starter = true OR t.created_by = auth.uid())
  ));

CREATE POLICY "theme_items manage own"
  ON public.theme_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.themes t WHERE t.id = theme_id AND t.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.themes t WHERE t.id = theme_id AND t.created_by = auth.uid()
  ));

-- =========== class_themes ===========
CREATE TABLE public.class_themes (
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, theme_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_themes TO authenticated;
GRANT ALL ON public.class_themes TO service_role;

ALTER TABLE public.class_themes ENABLE ROW LEVEL SECURITY;

-- Teacher who owns the class can manage assignments
CREATE POLICY "class_themes teacher manage"
  ON public.class_themes FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.teacher_id = auth.uid()
  ));

-- Parents can read theme assignments for classes their child is in
CREATE POLICY "class_themes parent read"
  ON public.class_themes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.class_children cc
    JOIN public.children ch ON ch.id = cc.child_id
    WHERE cc.class_id = class_themes.class_id AND ch.parent_id = auth.uid()
  ));

-- =========== SEEDS ===========
INSERT INTO public.themes (slug, title, description, emoji, color, is_starter) VALUES
  ('short-a',       'Short A',        'Practice the short /a/ sound with fun words.', '🍎', 'coral', true),
  ('short-i',       'Short I',        'Master the short /i/ sound step by step.',      '🐟', 'teal',  true),
  ('first-sounds',  'First Sounds',   'Meet your first six letters: A through F.',     '🔤', 'sun',   true),
  ('everyday-words','Everyday Words', 'Tiny words you hear every day.',                 '💬', 'primary', true);

-- Short A items
WITH t AS (SELECT id FROM public.themes WHERE slug = 'short-a')
INSERT INTO public.theme_items (theme_id, kind, value, position)
SELECT t.id, x.kind, x.value, x.position FROM t, (VALUES
  ('letter','a',0),
  ('word','an',1),('word','at',2),('word','am',3),
  ('word','ant',4),('word','and',5),('word','map',6),
  ('word','mat',7),('word','sap',8),('word','tap',9)
) AS x(kind,value,position);

-- Short I items
WITH t AS (SELECT id FROM public.themes WHERE slug = 'short-i')
INSERT INTO public.theme_items (theme_id, kind, value, position)
SELECT t.id, x.kind, x.value, x.position FROM t, (VALUES
  ('letter','i',0),
  ('word','in',1),('word','it',2),('word','did',3),
  ('word','dip',4),('word','pin',5),('word','pit',6),
  ('word','sit',7),('word','tin',8)
) AS x(kind,value,position);

-- First Sounds
WITH t AS (SELECT id FROM public.themes WHERE slug = 'first-sounds')
INSERT INTO public.theme_items (theme_id, kind, value, position)
SELECT t.id, 'letter', v, ord - 1
FROM t, unnest(ARRAY['a','b','c','d','e','f']) WITH ORDINALITY AS u(v, ord);

-- Everyday Words
WITH t AS (SELECT id FROM public.themes WHERE slug = 'everyday-words')
INSERT INTO public.theme_items (theme_id, kind, value, position)
SELECT t.id, 'word', v, ord - 1
FROM t, unnest(ARRAY['up','us','on','get','not']) WITH ORDINALITY AS u(v, ord);
