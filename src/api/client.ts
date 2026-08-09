import { Customer, WorkLog, TargetStatus } from '../types';

// ---------- API response shapes ----------

export interface ApiCustomer {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTargetCustomer {
  id: string;
  workLogId: string;
  customerId: string;
  status: TargetStatus;
  desc?: string;
  customer?: ApiCustomer;
}

export interface ApiWorkLog {
  id: string;
  title: string;
  date: string;
  desc?: string;
  targets: ApiTargetCustomer[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiEnvelope<T> {
  data: T;
  total?: number;
}

// ---------- API input shapes ----------

export interface ApiCustomerInput {
  name: string;
  phone?: string;
  photo?: string;
  address?: string;
}

export interface ApiWorkLogInput {
  title: string;
  date: string;
  desc?: string;
  targets?: Array<{ customerId: string; status?: TargetStatus; desc?: string }>;
}

// ---------- HTTP client ----------

const BASE = '/api/v1';

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    const isForm = options.body instanceof FormData;
    res = await fetch(BASE + path, {
      ...options,
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    throw new ApiError(0, 'Cannot reach the API server.');
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && typeof data.error === 'string') message = data.error;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

function qs(params: Record<string, string | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export const api = {
  // Photo uploads (R2)
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return request<ApiEnvelope<{ key: string; url: string }>>('/uploads', {
      method: 'POST',
      body: form,
    });
  },

  // Customers
  listCustomers: (search?: string) =>
    request<ApiEnvelope<ApiCustomer[]>>(`/customers${qs({ search })}`),
  createCustomer: (input: ApiCustomerInput) =>
    request<ApiEnvelope<ApiCustomer>>('/customers', { method: 'POST', body: JSON.stringify(input) }),
  updateCustomer: (id: string, input: Partial<ApiCustomerInput>) =>
    request<ApiEnvelope<ApiCustomer>>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteCustomer: (id: string) =>
    request<{ success: boolean }>(`/customers/${id}`, { method: 'DELETE' }),
  listCustomerWorkLogs: (id: string) =>
    request<ApiEnvelope<ApiWorkLog[]>>(`/customers/${id}/work-logs`),

  // Work logs
  listWorkLogs: (filters?: { date?: string; customerId?: string; search?: string }) =>
    request<ApiEnvelope<ApiWorkLog[]>>(`/work-logs${qs(filters || {})}`),
  createWorkLog: (input: ApiWorkLogInput) =>
    request<ApiEnvelope<ApiWorkLog>>('/work-logs', { method: 'POST', body: JSON.stringify(input) }),
  updateWorkLog: (id: string, input: Partial<ApiWorkLogInput>) =>
    request<ApiEnvelope<ApiWorkLog>>(`/work-logs/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteWorkLog: (id: string) =>
    request<{ success: boolean }>(`/work-logs/${id}`, { method: 'DELETE' }),
};

// ---------- Mapping helpers ----------

export function fromApiCustomer(ac: ApiCustomer): Customer {
  return {
    id: ac.id,
    name: ac.name,
    phone: ac.phone ?? '',
    photo: ac.photo,
    address: ac.address,
    createdAt: ac.createdAt,
    updatedAt: ac.updatedAt,
  };
}

export function toApiCustomer(c: Partial<Customer>): ApiCustomerInput {
  return {
    name: c.name ?? '',
    phone: c.phone,
    photo: c.photo,
    address: c.address,
  };
}

export function fromApiLog(al: ApiWorkLog): WorkLog {
  return {
    id: al.id,
    date: al.date,
    title: al.title,
    desc: al.desc ?? '',
    targets: (al.targets || []).map((t) => ({
      id: t.id,
      customerId: t.customerId,
      status: t.status,
      desc: t.desc,
      customer: t.customer ? fromApiCustomer(t.customer) : undefined,
    })),
    createdAt: al.createdAt,
    updatedAt: al.updatedAt,
  };
}

export function toApiLog(l: Partial<WorkLog>): ApiWorkLogInput {
  return {
    title: l.title || 'Work Task',
    date: l.date || new Date().toISOString().split('T')[0],
    desc: l.desc || undefined,
    targets: (l.targets || []).map((t) => ({
      customerId: t.customerId,
      status: t.status,
      desc: t.desc,
    })),
  };
}
