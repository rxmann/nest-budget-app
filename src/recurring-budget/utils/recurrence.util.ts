import { BudgetFrequency } from '../../../generated/prisma/client';

/**
 * Calculate the next occurrence date from a given date and frequency.
 * Returns null for ONE_TIME — no next occurrence.
 */
export function getNextOccurrence(
  fromDate: Date,
  frequency: BudgetFrequency,
): Date | null {
  const next = new Date(fromDate);

  switch (frequency) {
    case BudgetFrequency.DAILY:
      next.setDate(next.getDate() + 1);
      return next;

    case BudgetFrequency.WEEKLY:
      next.setDate(next.getDate() + 7);
      return next;

    case BudgetFrequency.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      return next;

    case BudgetFrequency.QUARTERLY:
      next.setMonth(next.getMonth() + 3);
      return next;

    case BudgetFrequency.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      return next;

    case BudgetFrequency.ONE_TIME:
      return null;
  }
}

/**
 * Calculate the first next occurrence from startDate.
 * If startDate is in the future — use startDate directly.
 * If startDate is in the past — advance from today.
 */
export function calculateNextOccurrence(
  startDate: Date,
  frequency: BudgetFrequency,
): Date | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate >= today) {
    return startDate;
  }

  return getNextOccurrence(today, frequency);
}
