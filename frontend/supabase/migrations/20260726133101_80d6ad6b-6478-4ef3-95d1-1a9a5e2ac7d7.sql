CREATE OR REPLACE FUNCTION public.log_child_attempt(
  _child_id uuid,
  _activity_slug text,
  _correct boolean,
  _latency_ms int DEFAULT NULL,
  _hints_used int DEFAULT 0,
  _transcript text DEFAULT NULL,
  _meta jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _activity_id uuid;
  _id uuid;
BEGIN
  IF _child_id IS NULL OR _activity_slug IS NULL THEN
    RETURN NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.children WHERE id = _child_id) THEN
    RETURN NULL;
  END IF;

  SELECT id INTO _activity_id FROM public.activities WHERE slug = _activity_slug;
  IF _activity_id IS NULL THEN
    INSERT INTO public.activities (slug, title, unit)
    VALUES (_activity_slug, _activity_slug, 'misc')
    RETURNING id INTO _activity_id;
  END IF;

  INSERT INTO public.activity_attempts
    (child_id, activity_id, correct, latency_ms, hints_used, transcript, meta)
  VALUES
    (_child_id, _activity_id, _correct, _latency_ms, COALESCE(_hints_used, 0), _transcript, COALESCE(_meta, '{}'::jsonb))
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_child_attempt(uuid, text, boolean, int, int, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_child_attempt(uuid, text, boolean, int, int, text, jsonb) TO anon, authenticated;