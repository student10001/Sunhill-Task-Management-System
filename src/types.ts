export type UserRole = 'admin' | 'manager' | 'member';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  title: string;
  department: string;
  phone?: string;
  location?: string;
  statusMessage?: string;
  pinCode?: string;
  generalResponsibilities: string[];
  specificResponsibilities: string[];
  joinedAt: string;
  activeProjectIds: string[];
}

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status: ProjectStatus;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  managerId: string;
  managerName: string;
  memberIds: string[];
  completionPercentage: number;
  category: string;
  budget?: number;
  tags?: string[];
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'completed';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  assigneeId: string;
  assigneeName: string;
  assigneePhoto: string;
  creatorId: string;
  creatorName: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD or ISO string
  estimatedHours: number;
  loggedHours: number;
  createdAt: string;
  completedAt?: string | null;
  tags?: string[];
  subtasks?: SubTask[];
}

export interface Milestone {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  completedBy?: string | null;
  completedByName?: string | null;
  completedAt?: string | null;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  action: string;
  targetType: 'task' | 'project' | 'profile' | 'milestone' | 'system';
  targetName: string;
  timestamp: string;
  details?: string;
}

export interface NotificationItem {
  id: string;
  userId: string; // user ID or 'all'
  title: string;
  message: string;
  type: 'deadline' | 'assignment' | 'system' | 'status_change' | 'reaction' | 'message';
  read: boolean;
  createdAt: string;
  linkId?: string;
  priority?: 'high' | 'normal';
  senderPhoto?: string;
}

export interface ProjectNote {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
}

export type BackgroundMode = 'center' | 'expand' | 'pattern';

export interface AppBackgroundConfig {
  imageUrl: string;
  mode: BackgroundMode;
  opacity: number; // 0 to 1
  presetId?: string;
}

export interface ChatMessageAttachment {
  name: string;
  url: string;
  type: 'image' | 'file';
  size?: string;
  originalSize?: string;
}

export interface ChatMessageReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  recipientId: string; // 'general', project ID, or user UID
  recipientType: 'direct' | 'channel' | 'project';
  recipientName?: string;
  content: string;
  timestamp: string;
  attachments?: ChatMessageAttachment[];
  readBy?: string[];
  replyToId?: string;
  replyToText?: string;
  reactions?: ChatMessageReaction[];
}

