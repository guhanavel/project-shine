-- 1) Lock down SECURITY DEFINER / helper function execution to the minimum needed
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_children_join_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.gen_join_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gen_join_code() TO authenticated, service_role;

-- has_role is used inside RLS policies evaluated as the calling role; anon never needs it
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Child join-code flow is intentionally pre-auth; keep anon but drop blanket PUBLIC grant
REVOKE ALL ON FUNCTION public.resolve_child_by_join_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_child_by_join_code(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.log_child_attempt(uuid, text, boolean, integer, integer, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_child_attempt(uuid, text, boolean, integer, integer, text, jsonb) TO anon, authenticated, service_role;

-- 2) activity_attempts: allow owning teachers/admins to correct or remove mislogged attempts
GRANT UPDATE, DELETE ON public.activity_attempts TO authenticated;

DROP POLICY IF EXISTS attempts_owner_update ON public.activity_attempts;
CREATE POLICY attempts_owner_update ON public.activity_attempts
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.children c
  WHERE c.id = activity_attempts.child_id
    AND (c.parent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.children c
  WHERE c.id = activity_attempts.child_id
    AND (c.parent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
));

DROP POLICY IF EXISTS attempts_owner_delete ON public.activity_attempts;
CREATE POLICY attempts_owner_delete ON public.activity_attempts
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.children c
  WHERE c.id = activity_attempts.child_id
    AND (c.parent_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
));

-- 3) Align INSERT policy with the read policy: class teachers / admins may log attempts too
DROP POLICY IF EXISTS attempts_family_write ON public.activity_attempts;
CREATE POLICY attempts_family_write ON public.activity_attempts
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.children c
  WHERE c.id = activity_attempts.child_id
    AND (
      c.parent_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.class_children cc
        JOIN public.classes cl ON cl.id = cc.class_id
        WHERE cc.child_id = c.id AND cl.teacher_id = auth.uid()
      )
    )
));