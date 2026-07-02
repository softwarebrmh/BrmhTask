import { apiClient } from './client';
import type {
  AuthResponse, Company, StaffMember, Task, TaskDetail,
  AttachmentItem, Note, CommentItem, OwnerDashboard, EmployeeDashboard,
  PaginatedResponse, SingleResponse, TaskStatus, TaskPriority, SubtaskItem, TaskTreeNode,
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
  employeeSignup: (data: { fullName: string; email: string; password: string; companySlug: string }) =>
    apiClient.post<SingleResponse<AuthResponse>>('/auth/join', data),
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
  lookup: (code: string) =>
    apiClient.get<SingleResponse<{ name: string; slug: string }>>(`/companies/lookup/${encodeURIComponent(code)}`),
  update: (id: string, data: Partial<{ name: string; logoUrl: string; workingHoursStart: string; workingHoursEnd: string }>) =>
    apiClient.patch<SingleResponse<Company>>(`/companies/${id}`, data),
  allTasks: (companyId: string, params?: { status?: string; priority?: string; search?: string; assigneeId?: string; page?: number; limit?: number }) =>
    apiClient.get(`/companies/${companyId}/tasks`, { params }),
  createTask: (companyId: string, data: { name: string; description?: string; priority?: string; assigneeIds?: string[]; startDate?: string; plannedDueDate?: string }) =>
    apiClient.post(`/companies/${companyId}/tasks`, data),
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

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasksApi = {
  getById: (taskId: string) =>
    apiClient.get<SingleResponse<TaskDetail>>(`/tasks/${taskId}`),
  update: (taskId: string, data: Partial<{
    name: string; description: string; priority: TaskPriority;
    plannedDueDate: string;
  }>) => apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}`, data),
  delete: (taskId: string) =>
    apiClient.delete<SingleResponse<any>>(`/tasks/${taskId}`),
  updateStatus: (taskId: string, status: TaskStatus) =>
    apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}/status`, { status }),
  updatePriority: (taskId: string, priority: TaskPriority) =>
    apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}/priority`, { priority }),
  updateEffort: (taskId: string, data: { actualEffortPh?: number; estimatedEffortPh?: number }) =>
    apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}/effort`, data),
  assign: (taskId: string, assigneeIds: string[]) =>
    apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}/assign`, { assigneeIds }),
  unassign: (taskId: string, userId: string) =>
    apiClient.patch<SingleResponse<Task>>(`/tasks/${taskId}/unassign/${userId}`),
  getAssigneeHistory: (taskId: string) =>
    apiClient.get<SingleResponse<any[]>>(`/tasks/${taskId}/assignees`),
  getTree: (taskId: string) =>
    apiClient.get<SingleResponse<{ tree: TaskTreeNode; currentTaskId: string }>>(`/tasks/${taskId}/tree`),
};

// ─── Subtasks ─────────────────────────────────────────────────────────────────

export const subtasksApi = {
  list: (taskId: string) =>
    apiClient.get<SingleResponse<SubtaskItem[]>>(`/tasks/${taskId}/subtasks`),
  create: (taskId: string, data: { name: string; priority?: TaskPriority; assigneeIds?: string[]; plannedDueDate?: string }) =>
    apiClient.post<SingleResponse<Task>>(`/tasks/${taskId}/subtasks`, data),
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
    apiClient.get<SingleResponse<OwnerDashboard>>(`/dashboard/admin/${companyId}`),
  staff: () =>
    apiClient.get<SingleResponse<EmployeeDashboard>>('/dashboard/me'),
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
