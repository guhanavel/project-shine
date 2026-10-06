/**
 * Teacher API client - uses the backend API instead of direct Supabase queries
 */
import { apiRequest } from "./api";
import { supabase } from "@/integrations/supabase/client";

type StudentResponse = {
  id: string;
  name: string;
  age: number | null;
  avatar_emoji: string | null;
  created_at: string;
};

async function getAuthorizationHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) throw new Error("Not signed in");

  return { Authorization: `Bearer ${session.access_token}` };
}

export async function getTeacherDashboard() {
  return apiRequest("/api/v1/teacher/dashboard", {
    method: "GET",
  });
}

export async function createClass(name: string, themeId?: string) {
  return apiRequest("/api/v1/teacher/classes", {
    method: "POST",
    body: JSON.stringify({
      name,
      theme_id: themeId,
    }),
  });
}

export async function getClass(classId: string) {
  return apiRequest(`/api/v1/teacher/classes/${classId}`, {
    method: "GET",
  });
}

export async function updateClass(classId: string, name?: string, themeId?: string) {
  return apiRequest(`/api/v1/teacher/classes/${classId}`, {
    method: "PUT",
    body: JSON.stringify({
      name,
      theme_id: themeId,
    }),
  });
}

export async function addChildToClass(classId: string, childId: string) {
  const headers = await getAuthorizationHeaders();
  return apiRequest(`/api/v1/teacher/classes/${classId}/children`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      child_id: childId,
      class_id: classId,
    }),
  });
}

export async function createStudent(name: string, avatarEmoji: string) {
  const headers = await getAuthorizationHeaders();
  return apiRequest<StudentResponse>("/api/v1/students", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name,
      avatar_emoji: avatarEmoji,
    }),
  });
}

export async function removeChildFromClass(classId: string, childId: string) {
  return apiRequest(`/api/v1/teacher/classes/${classId}/children/${childId}`, {
    method: "DELETE",
  });
}
