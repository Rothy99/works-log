export type TargetStatus = 'meet' | 'sell' | 'interesting' | 'not_meet';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TargetCustomer {
  id: string;
  customerId: string;
  status: TargetStatus;
  desc?: string;
  customer?: Customer;
}

export interface WorkLog {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  desc?: string;
  targets: TargetCustomer[];
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  search: string;
  datePreset: 'all' | 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month';
  startDate: string;
  endDate: string;
  customerId?: string;
}

export interface StandupReport {
  yesterdaySummary: string[];
  todayPlan: string[];
  blockers: string[];
  keyHighlights: string[];
  generatedAt: string;
}
