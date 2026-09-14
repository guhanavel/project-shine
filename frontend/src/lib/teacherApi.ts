/**
 * Teacher API client - uses the backend API instead of direct Supabase queries
 */
import { apiRequest } from "./api";

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
  return apiRequest(`/api/v1/teacher/classes/${classId}/children`, {
    method: "POST",
    body: JSON.stringify({
      child_id: childId,
      class_id: classId,
    }),
  });
}

export async function removeChildFromClass(classId: string, childId: string) {
  return apiRequest(`/api/v1/teacher/classes/${classId}/children/${childId}`, {
    method: "DELETE",
  });
}
