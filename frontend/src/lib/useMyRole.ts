import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "teacher" | "parent";

export function useMyRole() {
  return useQuery({
    queryKey: ["my-role"],
    queryFn: async (): Promise<AppRole | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as AppRole);
      if (roles.includes("admin")) return "admin";
      if (roles.includes("teacher")) return "teacher";
      if (roles.includes("parent")) return "parent";
      return null;
    },
    staleTime: 60_000,
  });
}
