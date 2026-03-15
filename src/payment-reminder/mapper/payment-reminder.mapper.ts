import {
  BudgetCategory,
  PaymentReminder,
} from '../../../generated/prisma/client';
import { PaymentReminderResponseDto } from '../dto/payment-reminder-response.dto';
import {
  calculateDaysUntilDue,
  shouldNotifyToday,
} from '../utils/reminder.util';

type PaymentReminderWithCategory = PaymentReminder & {
  budgetCategory: BudgetCategory;
};

export function toPaymentReminderResponse(
  reminder: PaymentReminderWithCategory,
): PaymentReminderResponseDto {
  return {
    id: reminder.id,
    categoryId: reminder.budgetCategory.id,
    categoryName: reminder.budgetCategory.name,
    reminderName: reminder.reminderName,
    frequency: reminder.frequency,
    nextDueDate: reminder.nextDueDate.toISOString(),
    status: reminder.status,
    daysUntilDue: calculateDaysUntilDue(reminder.nextDueDate),
    shouldNotify: shouldNotifyToday(reminder.nextDueDate, reminder.status),
    createdAt: reminder.createdAt.toISOString(),
    updatedAt: reminder.updatedAt.toISOString(),
  };
}
