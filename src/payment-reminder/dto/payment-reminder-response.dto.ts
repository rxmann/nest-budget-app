import {
  BudgetFrequency,
  ReminderStatus,
} from '../../../generated/prisma/client';

export class PaymentReminderResponseDto {
  id: string;
  categoryId: string;
  categoryName: string;
  reminderName: string;
  frequency: BudgetFrequency;
  nextDueDate: string;
  status: ReminderStatus;
  daysUntilDue: number;
  shouldNotify: boolean;
  createdAt: string;
  updatedAt: string;
}
