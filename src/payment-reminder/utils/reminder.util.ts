import {
  BudgetFrequency,
  ReminderStatus,
} from '../../../generated/prisma/client';

/**
 * Days between today and next due date.
 * Negative = overdue, 0 = today, positive = future.
 */
export function calculateDaysUntilDue(nextDueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(nextDueDate);
  due.setHours(0, 0, 0, 0);

  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Notify on due date, 1 day before, or 3 days before.
 */
export function shouldNotifyToday(
  nextDueDate: Date,
  status: ReminderStatus,
): boolean {
  if (status !== ReminderStatus.ACTIVE) return false;

  const days = calculateDaysUntilDue(nextDueDate);
  return days === 0 || days === 1 || days === 3;
}

/**
 * Advance nextDueDate by one frequency period.
 * Returns null and marks COMPLETED for ONE_TIME.
 */
export function advanceNextDueDate(
  currentDueDate: Date,
  frequency: BudgetFrequency,
): { nextDueDate: Date | null; completed: boolean } {
  const next = new Date(currentDueDate);

  switch (frequency) {
    case BudgetFrequency.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      return { nextDueDate: next, completed: false };

    case BudgetFrequency.QUARTERLY:
      next.setMonth(next.getMonth() + 3);
      return { nextDueDate: next, completed: false };

    case BudgetFrequency.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      return { nextDueDate: next, completed: false };

    case BudgetFrequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      return { nextDueDate: next, completed: false };

    case BudgetFrequency.DAILY:
      next.setDate(next.getDate() + 1);
      return { nextDueDate: next, completed: false };

    case BudgetFrequency.ONE_TIME:
      return { nextDueDate: null, completed: true };
  }
}
