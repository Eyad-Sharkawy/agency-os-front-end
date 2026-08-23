export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED";

export interface TaskRequest {
  title: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  priority: TaskPriority;
  status: TaskStatus;
  projectId: string;
  assigneeIds?: string[];
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  priority: TaskPriority;
  status: TaskStatus;
  projectId: string;
  assigneeIds: string[];
  totalLoggedMinutes: number;
  isOverBudget: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStatusUpdateRequest {
  status: TaskStatus;
}
