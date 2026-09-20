-- Wipe all users; cascades clear profiles, children, classes, attempts, user_roles, and user-authored themes.
DELETE FROM auth.users;

-- Also nuke any orphaned rows in public tables just in case (no FK cascade from auth for some).
DELETE FROM public.activity_attempts;
DELETE FROM public.sessions;
DELETE FROM public.class_children;
DELETE FROM public.class_themes;
DELETE FROM public.classes;
DELETE FROM public.children;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
DELETE FROM public.themes WHERE is_starter = false;
DELETE FROM public.theme_items WHERE theme_id NOT IN (SELECT id FROM public.themes);

-- All new signups become teachers.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'teacher'::app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;