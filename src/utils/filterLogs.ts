import { Customer, FilterOptions, WorkLog } from '../types';

export function filterLogs(logs: WorkLog[], filters: FilterOptions, customers: Customer[]): WorkLog[] {
  const getCustomer = (id: string) => customers.find((c) => c.id === id);

  return logs.filter((log) => {
    // Search query
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = log.title.toLowerCase().includes(q);
      const matchDesc = (log.desc || '').toLowerCase().includes(q);
      const matchCustomers = log.targets.some((target) => {
        const c = getCustomer(target.customerId);
        return c && (c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q));
      });
      if (!matchTitle && !matchDesc && !matchCustomers) return false;
    }

    // Customer
    if (filters.customerId && !log.targets.some((target) => target.customerId === filters.customerId)) {
      return false;
    }

    // Date Presets
    const todayStr = new Date().toISOString().split('T')[0];
    const logDate = new Date(log.date);

    if (filters.datePreset === 'today' && log.date !== todayStr) return false;

    if (filters.datePreset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      if (log.date !== yStr) return false;
    }

    if (filters.datePreset === 'this_week') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      if (logDate < startOfWeek) return false;
    }

    if (filters.datePreset === 'last_week') {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - dayOfWeek);
      startOfThisWeek.setHours(0, 0, 0, 0);

      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

      if (logDate < startOfLastWeek || logDate >= startOfThisWeek) return false;
    }

    if (filters.startDate && log.date < filters.startDate) return false;
    if (filters.endDate && log.date > filters.endDate) return false;

    return true;
  });
}
