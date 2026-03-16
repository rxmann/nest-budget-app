import { DashboardFilter, DateRange } from '../types/analytics.types';

export function calculateDateRange(filter: DashboardFilter): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate: Date;
  let prevStartDate: Date;

  switch (filter) {
    case DashboardFilter.THIS_WEEK: {
      const day = today.getDay();
      // week starts Sunday
      startDate = new Date(today);
      startDate.setDate(today.getDate() - day);

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(startDate.getDate() - 7);
      break;
    }

    case DashboardFilter.THIS_MONTH: {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);

      prevStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      break;
    }

    case DashboardFilter.THIS_QUARTER: {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      startDate = new Date(today.getFullYear(), quarterStartMonth, 1);

      prevStartDate = new Date(startDate);
      prevStartDate.setMonth(prevStartDate.getMonth() - 3);
      break;
    }

    case DashboardFilter.THIS_YEAR: {
      startDate = new Date(today.getFullYear(), 0, 1);

      prevStartDate = new Date(today.getFullYear() - 1, 0, 1);
      break;
    }
  }

  // endDate = tomorrow at midnight (exclusive upper bound)
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 1);

  const prevEndDate = new Date(startDate);

  return { startDate, endDate, prevStartDate, prevEndDate };
}
