export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
}

export const VALID_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]:        [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.TODO],
  [TaskStatus.REVIEW]:      [TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS],
  [TaskStatus.COMPLETED]:   [TaskStatus.REVIEW],
};
