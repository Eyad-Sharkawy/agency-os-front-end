export interface TimeEntryRequest {
  taskId: string;
  durationMinutes: number;
  isBillable: boolean;
  userId?: string;
}

export interface TimeEntryResponse {
  id: string;
  taskId: string;
  userId: string;
  durationMinutes: number;
  isBillable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveTimerResponse {
  userId: string;
  taskId: string;
  startTime: string;
}
