CREATE OR REPLACE FUNCTION public.get_child_themes(_child_id uuid)
RETURNS TABLE (id uuid, slug text, title text, emoji text, color text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT t.id, t.slug, t.title, t.emoji, t.color
  FROM public.class_children cc
  JOIN public.class_themes ct ON ct.class_id = cc.class_id
  JOIN public.themes t ON t.id = ct.theme_id
  WHERE cc.child_id = _child_id
$$;

CREATE OR REPLACE FUNCTION public.get_theme_by_slug(_slug text)
RETURNS TABLE (id uuid, slug text, title text, emoji text, color text, item_id uuid, kind text, value text, item_position int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.slug, t.title, t.emoji, t.color, i.id, i.kind::text, i.value, i.position
  FROM public.themes t
  LEFT JOIN public.theme_items i ON i.theme_id = t.id
  WHERE t.slug = _slug
  ORDER BY i.position
$$;

REVOKE ALL ON FUNCTION public.get_child_themes(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_theme_by_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_child_themes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_theme_by_slug(text) TO anon, authenticated;