import { BudgetResponseDto } from '../dto/budget-response.dto';
import { toDisplayAmount } from '../utils/budget.util';
import { BudgetWithCategory } from '../types/budget.types';

export function toBudgetResponse(
  budget: BudgetWithCategory,
): BudgetResponseDto {
  return {
    id: budget.id,
    name: budget.name,
    amount: toDisplayAmount(budget.amount),
    currency: budget.currency,
    budgetType: budget.budgetCategory.budgetType,
    budgetCategoryId: budget.budgetCategory.id,
    budgetCategoryName: budget.budgetCategory.name,
    budgetDate: budget.budgetDate.toISOString(),
    receiptUrl: budget.receiptUrl ?? null,
    tags: budget.tags ?? [],
    isRecurring: budget.isRecurring,
    version: budget.version,
    createdAt: budget.createdAt.toISOString(),
  };
}