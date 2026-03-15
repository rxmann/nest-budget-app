import { BudgetFrequency } from '../../../generated/prisma/client';

export class RecurringBudgetResponseDto {
  id: string;
  userId: string;
  budgetCategoryId: string;
  amount: number;
  currency: string;
  name: string | null;
  description: string | null;
  frequency: BudgetFrequency;
  frequencyInterval: number;
  startDate: string;
  endDate: string | null;
  nextOccurrence: string | null;
  isActive: boolean;
  createdAt: string;
}
