import type { Project, ProjectStatus } from "../types";
import { requestJson } from "./client";

export async function getAdminProjects(options: { includeArchived?: boolean } = {}): Promise<Project[]> {
  const params = new URLSearchParams();
  if (options.includeArchived) {
    params.set("includeArchived", "true");
  }

  const query = params.toString();
  return requestJson<Project[]>(`/api/admin/projects${query ? `?${query}` : ""}`);
}

export async function getSelectableProjects(): Promise<Project[]> {
  return requestJson<Project[]>("/api/projects");
}

export async function getActiveAdminProject(): Promise<Project | null> {
  return requestJson<Project | null>("/api/admin/projects/active");
}

export async function createAdminProject(project: {
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string | null;
  eventStartDate: string;
  eventEndDate?: string | null;
  location: string;
  description?: string;
  createdBy?: string;
}): Promise<Project> {
  return requestJson<Project>("/api/admin/projects", {
    method: "POST",
    body: JSON.stringify(project),
  });
}

export async function updateAdminProjectStatus(projectId: string, status: ProjectStatus): Promise<Project> {
  return requestJson<Project>(`/api/admin/projects/${encodeURIComponent(projectId)}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}
