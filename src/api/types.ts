export const TARGET_STATUSES = ["meet", "sell", "interesting", "not_meet"] as const;
export type TargetStatus = (typeof TARGET_STATUSES)[number];

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  name: string;
  phone?: string | null;
  photo?: string | null;
  address?: string | null;
}

export interface TargetCustomer {
  id: string;
  workLogId: string;
  customerId: string;
  status: TargetStatus;
  desc?: string;
  customer?: Customer;
}

export interface TargetCustomerInput {
  customerId: string;
  status?: TargetStatus;
  desc?: string;
}

export interface WorkLog {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  desc?: string;
  targets: TargetCustomer[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkLogInput {
  title: string;
  date: string;
  desc?: string;
  targets?: TargetCustomerInput[];
}

export interface WorkLogFilters {
  date?: string;
  customerId?: string;
  search?: string;
}

// DB row shapes (snake_case)
export interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  photo: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkLogRow {
  id: string;
  title: string;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TargetRow {
  id: string;
  work_log_id: string;
  customer_id: string;
  status: string;
  description: string | null;
  created_at: string;
}
