// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'employee';
export type MemberStatus = 'invited' | 'active' | 'suspended';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginatedMeta;
}

export interface SingleResponse<T> {
  success: true;
  data: T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  sub: string;
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: UserRole;
  companyId?: string | null;
  isEmailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// ─── Company ──────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  workingHoursStart: string;
  workingHoursEnd: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export interface StaffMember {
  id: string;
  email: string;
  designation?: string | null;
  user?: UserSummary | null;
  companyId: string;
  status: MemberStatus;
  joinedAt?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  activeTaskCount: number;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  displayId: string;
  companyId: string;
  parentTaskId?: string | null;
  parentTask?: { id: string; displayId: string; name: string } | null;
  name: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string | null;
  plannedDueDate?: string | null;
  actualDueDate?: string | null;
  estimatedEffortPh: number;
  actualEffortPh: number;
  slippagePh: number;
  owner?: UserSummary | null;
  assignees: UserSummary[];
  subTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubtaskItem {
  id: string;
  displayId: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: UserSummary[];
  plannedDueDate?: string | null;
}

export interface TaskDetail extends Task {
  recentComments: CommentItem[];
  recentAttachments: AttachmentItem[];
}

export interface TaskTreeNode {
  id: string;
  displayId: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  plannedDueDate?: string | null;
  assignees: UserSummary[];
  children: TaskTreeNode[];
}

// ─── Attachment ───────────────────────────────────────────────────────────────

export interface AttachmentItem {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploader: UserSummary;
  downloadUrl: string;
  createdAt: string;
}

// ─── Note ─────────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  taskId: string;
  title?: string | null;
  content: string;
  author: UserSummary;
  createdAt: string;
  updatedAt: string;
}

// ─── Comment ──────────────────────────────────────────────────────────────────

export interface CommentReply {
  id: string;
  content: string;
  author: UserSummary | null;
  createdAt: string;
}

export interface CommentReaction {
  id: string;
  emoji: string;
  user: UserSummary;
}

export interface CommentItem {
  id: string;
  taskId: string;
  content: string;
  author: UserSummary | null;
  mentions: Array<{ userId: string; fullName: string; email: string }>;
  replies: CommentReply[];
  reactions: CommentReaction[];
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface TaskStatusBreakdown {
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  overdue?: number;
  unassigned?: number;
  total?: number;
}

export interface DashboardDeadlineTask {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  plannedDueDate?: string | null;
  assignees: UserSummary[];
}

export interface WorkloadItem {
  user: UserSummary;
  activeTaskCount: number;
}

export interface OwnerDashboard {
  staff: { total: number; active: number; pending: number };
  tasks: TaskStatusBreakdown;
  upcomingDeadlines: DashboardDeadlineTask[];
  workload: WorkloadItem[];
  recentActivity: ActivityItem[];
}

export interface DashboardTask {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  plannedDueDate?: string | null;
}

export interface EmployeeDashboard {
  myTasks: TaskStatusBreakdown;
  upcomingTasks: DashboardTask[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor?: UserSummary;
  createdAt: string;
}
