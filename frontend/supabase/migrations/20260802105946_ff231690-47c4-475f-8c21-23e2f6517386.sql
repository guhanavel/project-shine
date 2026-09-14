-- Harden has_role: callers may only check their own roles; trusted server roles unrestricted
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _user_id IS NULL OR _role IS NULL THEN
    RETURN false;
  END IF;
  IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin')
     AND (auth.uid() IS NULL OR _user_id <> auth.uid()) THEN
    RETURN false;
  END IF;
  RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
END;
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- Harden join-code lookup: strict 6-char alphanumeric code required
CREATE OR REPLACE FUNCTION public.resolve_child_by_join_code(_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.name
  FROM public.children c
  WHERE upper(trim(coalesce(_code, ''))) ~ '^[A-Z0-9]{6}$'
    AND c.join_code = upper(trim(_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_child_by_join_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_child_by_join_code(text) TO anon, authenticated, service_role;

-- Harden attempt logging: validate and bound all inputs
CREATE OR REPLACE FUNCTION public.log_child_attempt(_child_id uuid, _activity_slug text, _correct boolean, _latency_ms integer DEFAULT NULL::integer, _hints_used integer DEFAULT 0, _transcript text DEFAULT NULL::text, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _activity_id uuid;
  _id uuid;
  _slug text;
BEGIN
  IF _child_id IS NULL OR _correct IS NULL THEN
    RETURN NULL;
  END IF;

  _slug := lower(trim(coalesce(_activity_slug, '')));
  IF _slug !~ '^[a-z0-9][a-z0-9._-]{0,63}$' THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.children WHERE id = _child_id) THEN
    RETURN NULL;
  END IF;

  SELECT a.id INTO _activity_id FROM public.activities a WHERE a.slug = _slug;
  IF _activity_id IS NULL THEN
    INSERT INTO public.activities (slug, title, unit)
    VALUES (_slug, _slug, 'misc')
    RETURNING id INTO _activity_id;
  END IF;

  INSERT INTO public.activity_attempts
    (child_id, activity_id, correct, latency_ms, hints_used, transcript, meta)
  VALUES (
    _child_id,
    _activity_id,
    _correct,
    LEAST(GREATEST(COALESCE(_latency_ms, 0), 0), 3600000),
    LEAST(GREATEST(COALESCE(_hints_used, 0), 0), 100),
    left(_transcript, 2000),
    CASE WHEN pg_column_size(COALESCE(_meta, '{}'::jsonb)) > 8192 THEN '{}'::jsonb ELSE COALESCE(_meta, '{}'::jsonb) END
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_child_attempt(uuid, text, boolean, integer, integer, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_child_attempt(uuid, text, boolean, integer, integer, text, jsonb) TO anon, authenticated, service_role;

-- Trigger/internal helpers must never be directly callable
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
