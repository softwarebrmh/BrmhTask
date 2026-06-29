import { apiClient } from './client';
import type {
  AuthResponse, Company, StaffMember, Project, Sprint, Task, TaskDetail,
  TaskStep, AttachmentItem, Note, CommentItem, AdminDashboard, StaffDashboard,
  PaginatedResponse, SingleResponse, TaskStatus, TaskPriority,
} from '@/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  signup: (data: { email: string; password: string; fullName: string; companyName: string }) =>
    apiClient.post<SingleResponse<AuthResponse>>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<SingleResponse<AuthResponse>>('/auth/login', data),
  acceptInvite: (data: { token: string; fullName: string; password: string }) =>
    apiClient.post<SingleResponse<AuthResponse>>('/auth/accept-invite', data),
  forgotPassword: (data: { email: string }) =>
    apiClient.post<SingleResponse<{ message: string }>>('/auth/forgot-password', data),
  resetPassword: (data: { token: string; password: string }) =>
    apiClient.post<SingleResponse<{ message: string }>>('/auth/reset-password', data),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getMe: () => apiClient.get<SingleResponse<any>>('/users/me'),
  tasks: (params?: {
    page?: number; limit?: number; status?: TaskStatus;
    priority?: TaskPriority; search?: string; parentTaskId?: string;
  }) => apiClient.get<PaginatedResponse<Task>>('/users/me/tasks', { params }),
  updateProfile: (data: { fullName?: string; avatarUrl?: string }) =>
    apiClient.patch<SingleResponse<any>>('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<SingleResponse<any>>('/users/me/password', data),
};

// ─── Company ──────────────────────────────────────────────────────────────────

export const companyApi = {
  create: (data: { name: string; workingHoursStart?: string; workingHoursEnd?: string }) =>
    apiClient.post<SingleResponse<Company>>('/companies', data),
  getById: (id: string) =>
    apiClient.get<SingleResponse<Company>>(`/companies/${id}`),
  update: (id: string, data: Partial<{ name: string; logoUrl: string; workingHoursStart: string; workingHoursEnd: string }>) =>
    apiClient.patch<SingleResponse<Company>>(`/companies/${id}`, data),
};

// ─── Staff ────────────────────────────────────────────────────────────────────

export const staffApi = {
  list: (companyId: string, params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<StaffMember>>(`/companies/${companyId}/staff`, { params }),
  invite: (companyId: string, data: { email: string; designation?: string }) =>
    apiClient.post<SingleResponse<StaffMember>>(`/companies/${companyId}/staff`, data),
  resendInvite: (companyId: string, staffId: string) =>
    apiClient.post<SingleResponse<{ message: string }>>(`/companies/${companyId}/staff/${staffId}/resend-invite`),
  update: (companyId: string, staffId: string, data: { designation?: string }) =>
    apiClient.patch<SingleResponse<StaffMember>>(`/companies/${companyId}/staff/${staffId}`, data),
  suspend: (companyId: string, staffId: string) =>
    apiClient.patch<SingleResponse<StaffMember>>(`/companies/${companyId}/staff/${staffId}/suspend`),
  activate: (companyId: string, staffId: string) =>
    apiClient.patch<SingleResponse<StaffMember>>(`/companies/${companyId}/staff/${staffId}/activate`),
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: (companyId: string, params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<Project>>(`/companies/${companyId}/projects`, { params }),
  create: (companyId: string, data: { name: string; description?: string }) =>
    apiClient.post<SingleResponse<Project>>(`/companies/${companyId}/projects`, data),
  getById: (companyId: string, projectId: string) =>
    apiClient.get<SingleResponse<Project>>(`/companies/${companyId}/projects/${projectId}`),
  update: (companyId: string, projectId: string, data: Partial<{ name: string; description: string }>) =>
    apiClient.patch<SingleResponse<Project>>(`/companies/${companyId}/projects/${projectId}`, data),
  archive: (companyId: string, projectId: string) =>
    apiClient.delete<SingleResponse<{ message: string }>>(`/companies/${companyId}/projects/${projectId}`),
};

// ─── Sprints ──────────────────────────────────────────────────────────────────

export const sprintsApi = {
  list: (projectId: string, params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<PaginatedResponse<Sprint>>(`/projects/${projectId}/sprints`, { params }),
  create: (projectId: string, data: { name: string; goal?: string; startDate?: string; endDate?: string }) =>
    apiClient.post<SingleResponse<Sprint>>(`/projects/${projectId}/sprints`, data),
  getById: (projectId: string, sprintId: string) =>
    apiClient.get<SingleResponse<Sprint>>(`/projects/${projectId}/sprints/${sprintId}`),
  update: (projectId: string, sprintId: string, data: Partial<{ name: string; goal: string; startDate: string; endDate: string }>) =>
    apiClient.patch<SingleResponse<Sprint>>(`/projects/${projectId}/sprints/${sprintId}`, data),
  start: (projectId: string, sprintId: string) =>
    apiClient.patch<SingleResponse<Sprint>>(`/projects/${projectId}/sprints/${sprintId}/start`),
  end: (projectId: string, sprintId: string) =>
    apiClient.patch<SingleResponse<Sprint>>(`/projects/${projectId}/sprints/${sprintId}/end`),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasksApi = {
  list: (sprintId: string, params?: {
    page?: number; limit?: number; status?: TaskStatus;
    priority?: TaskPriority; search?: string; parentTaskId?: string;
  }) => apiClient.get<PaginatedResponse<Task>>(`/sprints/${sprintId}/tasks`, { params }),
  create: (sprintId: string, data: {
    name: string; description?: string; priority?: TaskPriority;
    parentTaskId?: string; startDate?: string; plannedDueDate?: string;
    plannedEffortPh?: number; estimatedEffortPh?: number; assigneeIds?: string[];
  }) => apiClient.post<SingleResponse<Task>>(`/sprints/${sprintId}/tasks`, data),
  getById: (taskId: string) =>
    apiClient.get<SingleResponse<TaskDetail>>(`/tasks/${taskId}`),
  update: (taskId: string, data: Partial<{
    name: string; description: string; priority: TaskPriority;
    plannedDueDate: string; plannedEffortPh: number;
  }>) => apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}`, data),
  delete: (taskId: string) =>
    apiClient.delete<SingleResponse<any>>(`/tasks/${taskId}`),
  updateStatus: (taskId: string, status: TaskStatus) =>
    apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}/status`, { status }),
  updateEffort: (taskId: string, data: { actualEffortPh?: number; estimatedEffortPh?: number }) =>
    apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}/effort`, data),
  assign: (taskId: string, assigneeIds: string[]) =>
    apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}/assign`, { assigneeIds }),
  unassign: (taskId: string, userId: string) =>
    apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}/unassign/${userId}`),
  getAssigneeHistory: (taskId: string) =>
    apiClient.get<SingleResponse<any[]>>(`/tasks/${taskId}/assignees`),
};

// ─── Steps ────────────────────────────────────────────────────────────────────

export const stepsApi = {
  list: (taskId: string) =>
    apiClient.get<SingleResponse<TaskStep[]>>(`/tasks/${taskId}/steps`),
  create: (taskId: string, data: { title: string; order?: number }) =>
    apiClient.post<SingleResponse<TaskStep>>(`/tasks/${taskId}/steps`, data),
  reorder: (taskId: string, stepIds: string[]) =>
    apiClient.patch<SingleResponse<TaskStep[]>>(`/tasks/${taskId}/steps/reorder`, { stepIds }),
  check: (taskId: string, stepId: string) =>
    apiClient.patch<SingleResponse<TaskStep>>(`/tasks/${taskId}/steps/${stepId}/check`),
  uncheck: (taskId: string, stepId: string) =>
    apiClient.patch<SingleResponse<TaskStep>>(`/tasks/${taskId}/steps/${stepId}/uncheck`),
  delete: (taskId: string, stepId: string) =>
    apiClient.delete<SingleResponse<any>>(`/tasks/${taskId}/steps/${stepId}`),
};

// ─── Attachments ──────────────────────────────────────────────────────────────

export const attachmentsApi = {
  list: (taskId: string) =>
    apiClient.get<SingleResponse<AttachmentItem[]>>(`/tasks/${taskId}/attachments`),
  upload: (taskId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<SingleResponse<AttachmentItem>>(`/tasks/${taskId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (taskId: string, attachmentId: string) =>
    apiClient.delete<SingleResponse<any>>(`/tasks/${taskId}/attachments/${attachmentId}`),
  downloadUrl: (taskId: string, attachmentId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'}/tasks/${taskId}/attachments/${attachmentId}/download`,
};

// ─── Notes ────────────────────────────────────────────────────────────────────

export const notesApi = {
  list: (taskId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Note>>(`/tasks/${taskId}/notes`, { params }),
  create: (taskId: string, data: { title?: string; content: string }) =>
    apiClient.post<SingleResponse<Note>>(`/tasks/${taskId}/notes`, data),
  update: (taskId: string, noteId: string, data: { title?: string; content?: string }) =>
    apiClient.patch<SingleResponse<Note>>(`/tasks/${taskId}/notes/${noteId}`, data),
  delete: (taskId: string, noteId: string) =>
    apiClient.delete<SingleResponse<any>>(`/tasks/${taskId}/notes/${noteId}`),
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const commentsApi = {
  list: (taskId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<CommentItem>>(`/tasks/${taskId}/comments`, { params }),
  create: (taskId: string, data: { content: string; mentionedUserIds?: string[] }) =>
    apiClient.post<SingleResponse<CommentItem>>(`/tasks/${taskId}/comments`, data),
  update: (taskId: string, commentId: string, data: { content?: string; mentionedUserIds?: string[] }) =>
    apiClient.patch<SingleResponse<CommentItem>>(`/tasks/${taskId}/comments/${commentId}`, data),
  delete: (taskId: string, commentId: string) =>
    apiClient.delete<SingleResponse<any>>(`/tasks/${taskId}/comments/${commentId}`),
  createReply: (taskId: string, commentId: string, data: { content: string }) =>
    apiClient.post<SingleResponse<any>>(`/tasks/${taskId}/comments/${commentId}/replies`, data),
  deleteReply: (taskId: string, commentId: string, replyId: string) =>
    apiClient.delete<SingleResponse<any>>(`/tasks/${taskId}/comments/${commentId}/replies/${replyId}`),
  react: (taskId: string, commentId: string, emoji: string) =>
    apiClient.post<SingleResponse<any>>(`/tasks/${taskId}/comments/${commentId}/reactions`, { emoji }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  admin: (companyId: string) =>
    apiClient.get<SingleResponse<AdminDashboard>>(`/dashboard/admin/${companyId}`),
  staff: () =>
    apiClient.get<SingleResponse<StaffDashboard>>('/dashboard/me'),
  project: (projectId: string) =>
    apiClient.get<SingleResponse<any>>(`/dashboard/projects/${projectId}`),
};

// ─── Project members ──────────────────────────────────────────────────────────

export const projectMembersApi = {
  list: (projectId: string, companyId: string) =>
    apiClient.get<SingleResponse<any[]>>(`/companies/${companyId}/projects/${projectId}/members`),
  add: (companyId: string, projectId: string, userId: string) =>
    apiClient.post<SingleResponse<any>>(`/companies/${companyId}/projects/${projectId}/members`, { userId }),
  remove: (companyId: string, projectId: string, userId: string) =>
    apiClient.delete<SingleResponse<any>>(`/companies/${companyId}/projects/${projectId}/members/${userId}`),
};

// ─── Sprint members ───────────────────────────────────────────────────────────

export const sprintMembersApi = {
  list: (projectId: string, sprintId: string) =>
    apiClient.get<SingleResponse<any[]>>(`/projects/${projectId}/sprints/${sprintId}/members`),
  add: (projectId: string, sprintId: string, userId: string) =>
    apiClient.post<SingleResponse<any>>(`/projects/${projectId}/sprints/${sprintId}/members`, { userId }),
  remove: (projectId: string, sprintId: string, userId: string) =>
    apiClient.delete<SingleResponse<any>>(`/projects/${projectId}/sprints/${sprintId}/members/${userId}`),
};

// ─── Audit ────────────────────────────────────────────────────────────────────

export const auditApi = {
  taskAudit: (taskId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<any>(`/tasks/${taskId}/audit`, { params }),
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => apiClient.get('/health'),
};
