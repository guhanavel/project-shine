REVOKE ALL ON FUNCTION public.gen_join_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gen_join_code() TO authenticated, service_role;

-- Ensure the trigger exists to auto-populate join_code on insert
DROP TRIGGER IF EXISTS children_set_join_code ON public.children;
CREATE TRIGGER children_set_join_code
BEFORE INSERT ON public.children
FOR EACH ROW EXECUTE FUNCTION public.tg_children_join_code();