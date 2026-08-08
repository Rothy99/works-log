export type TaskCategory = 
  | 'Frontend'
  | 'Backend'
  | 'Database'
  | 'Design/UI'
  | 'Bug Fix'
  | 'Code Review'
  | 'Meeting/Sync'
  | 'DevOps/CI-CD'
  | 'Documentation'
  | 'Other';

export type TaskStatus = 'completed' | 'in_progress' | 'blocked' | 'planned';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Project {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'active' | 'lead' | 'vip' | 'inactive';
  industry?: string;
  notes?: string;
  hourlyRate?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkLog {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: TaskCategory;
  durationMinutes: number;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  customerId?: string;
  tags: string[];
  notes: string;
  outcomeLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveTimer {
  isRunning: boolean;
  startTime: number | null; // Date timestamp
  elapsedSeconds: number;
  taskTitle: string;
  category: TaskCategory;
  projectId: string;
  notes: string;
}

export interface FilterOptions {
  search: string;
  datePreset: 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month';
  startDate: string;
  endDate: string;
  category: string;
  projectId: string;
  customerId?: string;
  status: string;
  priority: string;
  tag: string;
}

export interface StandupReport {
  yesterdaySummary: string[];
  todayPlan: string[];
  blockers: string[];
  keyHighlights: string[];
  generatedAt: string;
}
