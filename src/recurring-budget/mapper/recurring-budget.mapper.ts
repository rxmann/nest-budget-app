import { toDisplayAmount } from 'src/budget/utils/budget.util';
import {
  BudgetCategory,
  RecurringBudget,
} from '../../../generated/prisma/client';
import { RecurringBudgetResponseDto } from '../dto/recurring-budget-response.dto';

type RecurringBudgetWithCategory = RecurringBudget & {
  budgetCategory: BudgetCategory;
};

export function toRecurringBudgetResponse(
  rb: RecurringBudgetWithCategory,
): RecurringBudgetResponseDto {
  return {
    id: rb.id,
    userId: rb.userId,
    budgetCategoryId: rb.budgetCategoryId,
    amount: toDisplayAmount(rb.amount),
    currency: rb.currency,
    name: rb.name,
    description: rb.description ?? null,
    frequency: rb.frequency,
    frequencyInterval: rb.frequencyInterval,
    startDate: rb.startDate.toISOString(),
    endDate: rb.endDate?.toISOString() ?? null,
    nextOccurrence: rb.nextOccurrence?.toISOString() ?? null,
    isActive: rb.isActive,
    createdAt: rb.createdAt.toISOString(),
  };
}
