export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string | null;
  eventStartDate: string;
  eventEndDate: string | null;
  location: string;
  description: string;
  createdBy: string;
  createdAt: string;
  archivedAt: string | null;
}
