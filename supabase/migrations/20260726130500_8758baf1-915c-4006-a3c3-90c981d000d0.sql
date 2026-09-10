CREATE OR REPLACE FUNCTION public.resolve_child_by_join_code(_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name
  FROM public.children c
  WHERE c.join_code = upper(trim(_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_child_by_join_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_child_by_join_code(text) TO anon, authenticated;