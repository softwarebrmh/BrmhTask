export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export const VALID_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]:        [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW],
  [TaskStatus.REVIEW]:      [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
  [TaskStatus.DONE]:        [TaskStatus.REVIEW],
};
